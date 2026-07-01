import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { getPlayerProfile, repairPlayerName, toChineseNewsTitle } from "../src/lib/worldcup/localization";
import { normalizeWorldCup26 } from "../src/lib/worldcup/normalizers";
import type { NewsItem, Team, WorldCupData } from "../src/lib/worldcup/types";

const root = process.cwd();
const updatedAt = new Date().toISOString();

async function main() {
  const data = await loadWorldCupData();

  await writeDataFiles(data);

  console.log(`WorldCupView data updated: ${data.teams.length} teams, ${data.matches.length} matches, ${data.news.length} news items.`);
}

async function loadWorldCupData(): Promise<WorldCupData> {
  try {
    const [teamsPayload, gamesPayload] = await Promise.all([
      fetchJson("https://worldcup26.ir/get/teams"),
      fetchJson("https://worldcup26.ir/get/games"),
    ]);

    const previewData = normalizeWorldCup26(teamsPayload, gamesPayload, updatedAt, []);
    const news = await fetchNewsWithFallback(previewData.teams, []);
    return normalizeWorldCup26(teamsPayload, gamesPayload, updatedAt, news);
  } catch (error) {
    console.warn(`Tournament feed fetch failed, using cached data: ${(error as Error).message}`);
    const cachedData = await readExistingData();
    const news = await fetchNewsWithFallback(cachedData.teams, cachedData.news);
    return refreshCachedData(cachedData, news);
  }
}

async function fetchJson(url: string) {
  return withRetry(`GET ${url}`, async () => {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "WorldCupView/1.0 (+https://github.com/)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return response.json();
  });
}

async function fetchGdeltNews(teams: Team[]): Promise<NewsItem[]> {
  const query = encodeURIComponent('"World Cup 2026" football');
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&format=json&maxrecords=75&sort=HybridRel`;
  const teamByName = buildTeamMatcher(teams);

  try {
    const payload = await fetchJson(url);
    const articles = Array.isArray(payload.articles) ? payload.articles : [];

    return articles
      .map((article: Record<string, unknown>, index: number) => {
        const title = String(article.title ?? "").trim();
        const urlValue = String(article.url ?? "").trim();
        if (!title || !urlValue) return undefined;

        return {
          id: `gdelt-${index}-${hash(urlValue)}`,
          title: toChineseNewsTitle(title, String(article.sourceCommonName ?? article.domain ?? "GDELT")),
          source: String(article.sourceCommonName ?? article.domain ?? "GDELT"),
          url: urlValue,
          publishedAt: parseGdeltDate(String(article.seendate ?? "")),
          tone: normalizeTone(Number(article.tone ?? 0)),
          teamId: findTeamId(title, teamByName),
        } satisfies NewsItem;
      })
      .filter((item: NewsItem | undefined): item is NewsItem => Boolean(item))
      .slice(0, 50);
  } catch (error) {
    console.warn(`GDELT fetch failed, falling back to Google News RSS: ${(error as Error).message}`);
    return fetchGoogleNewsRss(teamByName);
  }
}

async function fetchGoogleNewsRss(teamByName: Array<[string, string]>): Promise<NewsItem[]> {
  const url = "https://news.google.com/rss/search?q=World%20Cup%202026%20football&hl=en-US&gl=US&ceid=US:en";
  const xml = await fetchText(url);
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 50);

  const mapped: Array<NewsItem | undefined> = items.map((item, index) => {
      const block = item[1];
      const title = decodeXml(readXmlTag(block, "title"));
      const link = decodeXml(readXmlTag(block, "link"));
      const source = decodeXml(readXmlTag(block, "source")) || "Google News";
      const publishedAt = new Date(readXmlTag(block, "pubDate") || updatedAt).toISOString();
      if (!title || !link) return undefined;

      return {
        id: `gnews-${index}-${hash(link)}`,
        title: toChineseNewsTitle(title, source),
        source,
        url: link,
        publishedAt,
        tone: inferTone(title),
        teamId: findTeamId(title, teamByName),
      } satisfies NewsItem;
    });

  return mapped.filter((item): item is NewsItem => Boolean(item));
}

async function fetchText(url: string): Promise<string> {
  return withRetry(`GET ${url}`, async () => {
    const response = await fetch(url, {
      headers: {
        accept: "application/rss+xml,text/xml",
        "user-agent": "WorldCupView/1.0 (+https://github.com/)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    return response.text();
  });
}

async function fetchNewsWithFallback(teams: Team[], fallbackNews: NewsItem[]): Promise<NewsItem[]> {
  try {
    const news = await fetchGdeltNews(teams);
    return news.length > 0 ? news : fallbackNews;
  } catch (error) {
    console.warn(`News fetch failed, using cached news: ${(error as Error).message}`);
    return fallbackNews;
  }
}

function buildTeamMatcher(teams: Team[]) {
  const entries: Array<[string, string]> = [];
  for (const team of teams) {
    entries.push([team.name.toLowerCase(), team.id]);
    entries.push([team.code.toLowerCase(), team.id]);
    for (const star of team.starPlayers) {
      entries.push([star.toLowerCase(), team.id]);
    }
  }
  return entries;
}

function findTeamId(text: string, teamByName: Array<[string, string]>): string | undefined {
  const normalized = text.toLowerCase();
  return teamByName.find(([needle]) => normalized.includes(needle))?.[1];
}

function normalizeTone(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value / 10));
}

function inferTone(title: string): number {
  const lower = title.toLowerCase();
  const positive = ["win", "stun", "advance", "historic", "brilliant", "beats", "victory", "thriller"].some((word) =>
    lower.includes(word),
  );
  const negative = ["injury", "out", "loss", "controversy", "ban", "probe", "concern"].some((word) => lower.includes(word));
  if (positive && !negative) return 0.35;
  if (negative && !positive) return -0.35;
  return 0.05;
}

function parseGdeltDate(value: string): string {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);
  if (!match) return updatedAt;

  const [, year, month, day, hour = "00", minute = "00"] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))).toISOString();
}

async function writeDataFiles(data: WorldCupData) {
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  const targets = [
    path.join(root, "src", "data", "worldcup-data.json"),
    path.join(root, "public", "data", "worldcup-data.json"),
  ];

  for (const target of targets) {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, serialized, "utf8");
  }
}

async function readExistingData(): Promise<WorldCupData> {
  const file = path.join(root, "src", "data", "worldcup-data.json");
  return JSON.parse(await readFile(file, "utf8")) as WorldCupData;
}

function refreshCachedData(data: WorldCupData, news: NewsItem[]): WorldCupData {
  return {
    ...data,
    updatedAt,
    news,
    teams: data.teams.map((team) => ({
      ...team,
      confederation: chineseConfederation(team.confederation, team.code),
    })),
    players: data.players.map((player) => {
      if (!player.name.startsWith("外文名：") && !shouldRefreshPlayerImage(player.image)) return player;
      const profile = getPlayerProfile(player.name.replace(/^外文名：/, ""));
      return {
        ...player,
        name: profile.displayName,
        image: profile.photoUrl,
        headline: profile.headline,
      };
    }),
    matches: data.matches.map((match) => ({
      ...match,
      venue: chineseVenue(match.venue),
      city: chineseCity(match.city),
      scorers: match.scorers?.map((scorer) => ({
        ...scorer,
        playerName: scorer.playerName ? repairPlayerName(scorer.playerName) : scorer.playerName,
      })),
      highlights: match.highlights.map(repairHighlight),
    })),
  };
}

function shouldRefreshPlayerImage(image: string): boolean {
  return image.includes("dicebear") || image.includes("commons.wikimedia.org") || image.includes("upload.wikimedia.org");
}

async function withRetry<T>(label: string, request: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        console.warn(`${label} failed on attempt ${attempt}, retrying.`);
        await delay(900 * attempt);
      }
    }
  }

  throw lastError;
}

function chineseConfederation(value: string, code: string): string {
  const byCode: Record<string, string> = {
    ALG: "非洲足联",
  };
  const byValue: Record<string, string> = {
    AFC: "亚足联",
    CAF: "非洲足联",
    CONCACAF: "中北美及加勒比足联",
    CONMEBOL: "南美足联",
    FIFA: byCode[code] ?? "国际足联",
    OFC: "大洋洲足联",
    UEFA: "欧洲足联",
  };
  return byValue[value] ?? value;
}

function repairHighlight(value: string): string {
  const withoutVs = value.replace(" vs ", " 对阵 ");
  const scorer = withoutVs.match(/^(\d+'\s)(.+?)( 改写比分)$/);
  if (!scorer) return withoutVs;

  return `${scorer[1]}${getPlayerProfile(scorer[2]).displayName}${scorer[3]}`;
}

function chineseVenue(value: string): string {
  return venueTranslations[value] ?? value;
}

function chineseCity(value: string): string {
  return cityTranslations[value] ?? value;
}

const venueTranslations: Record<string, string> = {
  "Estadio Azteca": "阿兹特克体育场",
  "Guadalajara Stadium": "瓜达拉哈拉体育场",
  "Monterrey Stadium": "蒙特雷体育场",
  "MetLife Stadium": "大都会人寿体育场",
  "AT&T Stadium": "AT&T 体育场",
  "NRG Stadium": "NRG 体育场",
  "Mercedes-Benz Stadium": "梅赛德斯-奔驰体育场",
  "Hard Rock Stadium": "硬石体育场",
  "Arrowhead Stadium": "箭头体育场",
  "Lincoln Financial Field": "林肯金融球场",
  "Gillette Stadium": "吉列体育场",
  "Levi's Stadium": "李维斯体育场",
  "SoFi Stadium": "SoFi 体育场",
  "Lumen Field": "卢门球场",
  "BC Place": "BC 广场",
  "BMO Field": "BMO 球场",
};

const cityTranslations: Record<string, string> = {
  "Mexico City": "墨西哥城",
  Guadalajara: "瓜达拉哈拉",
  Monterrey: "蒙特雷",
  "New York New Jersey": "纽约/新泽西",
  Dallas: "达拉斯",
  Houston: "休斯敦",
  Atlanta: "亚特兰大",
  Miami: "迈阿密",
  "Kansas City": "堪萨斯城",
  Philadelphia: "费城",
  Boston: "波士顿",
  "San Francisco Bay Area": "旧金山湾区",
  "Los Angeles": "洛杉矶",
  Seattle: "西雅图",
  Vancouver: "温哥华",
  Toronto: "多伦多",
};

function hash(value: string): string {
  let acc = 0;
  for (let index = 0; index < value.length; index += 1) {
    acc = (acc * 31 + value.charCodeAt(index)) >>> 0;
  }
  return acc.toString(36);
}

function readXmlTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}(?: [^>]*)?>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1]?.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim() ?? "";
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
