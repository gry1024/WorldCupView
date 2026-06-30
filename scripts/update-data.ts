import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeWorldCup26 } from "../src/lib/worldcup/normalizers";
import type { NewsItem, Team, WorldCupData } from "../src/lib/worldcup/types";

const root = process.cwd();
const updatedAt = new Date().toISOString();

async function main() {
  const [teamsPayload, gamesPayload] = await Promise.all([
    fetchJson("https://worldcup26.ir/get/teams"),
    fetchJson("https://worldcup26.ir/get/games"),
  ]);

  const previewData = normalizeWorldCup26(teamsPayload, gamesPayload, updatedAt, []);
  const news = await fetchGdeltNews(previewData.teams);
  const data = normalizeWorldCup26(teamsPayload, gamesPayload, updatedAt, news);

  await writeDataFiles(data);

  console.log(`WorldCupView data updated: ${data.teams.length} teams, ${data.matches.length} matches, ${data.news.length} news items.`);
}

async function fetchJson(url: string) {
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
          title,
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
        title,
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
