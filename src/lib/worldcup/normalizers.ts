import type { Match, MatchScorer, MatchStage, MatchStats, NewsItem, Player, SocialSignal, Team, WorldCupData } from "./types";

type WorldCup26Team = {
  id: string;
  name_en: string;
  flag?: string;
  fifa_code: string;
  iso2?: string;
  groups: string;
};

type WorldCup26Game = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  home_scorers?: string;
  away_scorers?: string;
  group?: string;
  matchday?: string;
  local_date: string;
  stadium_id?: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
  home_penalty_score?: string;
  away_penalty_score?: string;
};

const teamNameZh: Record<string, string> = {
  "South Africa": "南非",
  "South Korea": "韩国",
  "Czech Republic": "捷克",
  "Bosnia and Herzegovina": "波黑",
  "United States": "美国",
  "Ivory Coast": "科特迪瓦",
  "Curaçao": "库拉索",
  "Cape Verde": "佛得角",
  "Saudi Arabia": "沙特阿拉伯",
  "Democratic Republic of the Congo": "民主刚果",
  Mexico: "墨西哥",
  Canada: "加拿大",
  Qatar: "卡塔尔",
  Switzerland: "瑞士",
  Brazil: "巴西",
  Morocco: "摩洛哥",
  Haiti: "海地",
  Scotland: "苏格兰",
  Paraguay: "巴拉圭",
  Australia: "澳大利亚",
  Turkey: "土耳其",
  Germany: "德国",
  Ecuador: "厄瓜多尔",
  Netherlands: "荷兰",
  Japan: "日本",
  Sweden: "瑞典",
  Tunisia: "突尼斯",
  Belgium: "比利时",
  Egypt: "埃及",
  Iran: "伊朗",
  "New Zealand": "新西兰",
  Spain: "西班牙",
  Uruguay: "乌拉圭",
  France: "法国",
  Senegal: "塞内加尔",
  Iraq: "伊拉克",
  Norway: "挪威",
  Argentina: "阿根廷",
  Algeria: "阿尔及利亚",
  Austria: "奥地利",
  Jordan: "约旦",
  Portugal: "葡萄牙",
  Uzbekistan: "乌兹别克斯坦",
  Colombia: "哥伦比亚",
  England: "英格兰",
  Croatia: "克罗地亚",
  Ghana: "加纳",
  Panama: "巴拿马",
};

const confederationByCode: Record<string, string> = {
  ARG: "CONMEBOL",
  AUS: "AFC",
  AUT: "UEFA",
  BEL: "UEFA",
  BIH: "UEFA",
  BRA: "CONMEBOL",
  CAN: "CONCACAF",
  CIV: "CAF",
  COD: "CAF",
  COL: "CONMEBOL",
  CPV: "CAF",
  CRO: "UEFA",
  CUW: "CONCACAF",
  CZE: "UEFA",
  ECU: "CONMEBOL",
  EGY: "CAF",
  ENG: "UEFA",
  ESP: "UEFA",
  FRA: "UEFA",
  GER: "UEFA",
  GHA: "CAF",
  HAI: "CONCACAF",
  IRN: "AFC",
  IRQ: "AFC",
  JOR: "AFC",
  JPN: "AFC",
  KOR: "AFC",
  KSA: "AFC",
  MAR: "CAF",
  MEX: "CONCACAF",
  NED: "UEFA",
  NOR: "UEFA",
  NZL: "OFC",
  PAN: "CONCACAF",
  PAR: "CONMEBOL",
  POR: "UEFA",
  QAT: "AFC",
  RSA: "CAF",
  SCO: "UEFA",
  SEN: "CAF",
  SUI: "UEFA",
  SWE: "UEFA",
  TUN: "CAF",
  TUR: "UEFA",
  URU: "CONMEBOL",
  USA: "CONCACAF",
  UZB: "AFC",
};

const rankByCode: Record<string, number> = {
  ARG: 1,
  ESP: 2,
  FRA: 3,
  ENG: 4,
  BRA: 5,
  POR: 6,
  NED: 7,
  BEL: 8,
  GER: 9,
  CRO: 10,
  COL: 11,
  URU: 12,
  MAR: 13,
  MEX: 14,
  USA: 15,
  SUI: 16,
  JPN: 17,
  SEN: 18,
  NOR: 19,
  ECU: 20,
};

const titlesByCode: Record<string, number> = {
  BRA: 5,
  GER: 4,
  ITA: 4,
  ARG: 3,
  FRA: 2,
  URU: 2,
  ENG: 1,
  ESP: 1,
};

const bestFinishByCode: Record<string, string> = {
  BRA: "冠军",
  GER: "冠军",
  ARG: "冠军",
  FRA: "冠军",
  URU: "冠军",
  ENG: "冠军",
  ESP: "冠军",
  NED: "亚军",
  CRO: "亚军",
  POR: "季军",
  BEL: "季军",
  MAR: "四强",
  USA: "四强",
  MEX: "八强",
  JPN: "16强",
};

const paletteByCode: Record<string, [string, string]> = {
  ARG: ["#75aadb", "#f6b40e"],
  BRA: ["#009b3a", "#ffdf00"],
  CAN: ["#d80621", "#ffffff"],
  ENG: ["#f5f5f5", "#cf142b"],
  ESP: ["#aa151b", "#f1bf00"],
  FRA: ["#0055a4", "#ef4135"],
  GER: ["#111111", "#ffcc00"],
  MEX: ["#006847", "#ce1126"],
  POR: ["#006600", "#ff0000"],
  USA: ["#3c3b6e", "#b22234"],
};

const starByTeam: Record<string, string[]> = {
  argentina: ["Lionel Messi", "Julian Alvarez"],
  brazil: ["Vinicius Junior", "Rodrygo"],
  canada: ["Alphonso Davies", "Jonathan David"],
  england: ["Harry Kane", "Jude Bellingham"],
  france: ["Kylian Mbappé", "Ousmane Dembélé"],
  germany: ["Jamal Musiala", "Kai Havertz"],
  mexico: ["Santiago Gimenez", "Edson Alvarez"],
  norway: ["Erling Haaland", "Martin Odegaard"],
  portugal: ["Cristiano Ronaldo", "Rafael Leão"],
  spain: ["Lamine Yamal", "Pedri"],
  "united-states": ["Christian Pulisic", "Weston McKennie"],
};

export function normalizeWorldCup26(
  teamsPayload: { teams?: WorldCup26Team[] },
  gamesPayload: { games?: WorldCup26Game[] },
  updatedAt = new Date().toISOString(),
  news: NewsItem[] = [],
): WorldCupData {
  const teams = (teamsPayload.teams ?? []).map(toTeam);
  const teamByNumericId = new Map((teamsPayload.teams ?? []).map((raw) => [raw.id, slugifyName(raw.name_en)]));
  const teamById = new Map(teams.map((team) => [team.id, team]));

  const matches = (gamesPayload.games ?? [])
    .map((raw) => toMatch(raw, teamByNumericId, teamById))
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  const players = buildPlayers(teams, matches);
  const social = buildSocialSignals(teams, news);

  return {
    updatedAt,
    sources: [
      "https://worldcup26.ir/get/teams",
      "https://worldcup26.ir/get/games",
      "https://api.gdeltproject.org/api/v2/doc/doc",
    ],
    teams,
    players,
    matches,
    social,
    news,
  };
}

export function parseScorers(raw: string | undefined, teamId: string): MatchScorer[] {
  if (!raw || raw === "null") return [];

  const entries = raw
    .replace(/^\{/, "")
    .replace(/\}$/, "")
    .split('","')
    .map((item) => item.replace(/^"/, "").replace(/"$/, "").trim())
    .filter(Boolean);

  const parsed: Array<MatchScorer | undefined> = entries.map((entry) => {
      const minuteMatch = entry.match(/(\d+)(?:\+(\d+))?\s*'?/);
      if (!minuteMatch) return undefined;

      const base = Number(minuteMatch[1]);
      const stoppage = minuteMatch[2] ? Number(minuteMatch[2]) : 0;
      const playerName = entry
        .slice(0, minuteMatch.index)
        .replace(/\(p\)|pen\.?|own goal/gi, "")
        .trim();

      return {
        playerName,
        teamId,
        minute: base + stoppage,
      } satisfies MatchScorer;
    });

  return parsed.filter((scorer): scorer is MatchScorer => Boolean(scorer?.playerName));
}

export function toStage(type: string): MatchStage {
  const normalized = type.toLowerCase();
  if (normalized === "r32") return "round32";
  if (normalized === "r16") return "round16";
  if (normalized === "qf") return "quarterfinal";
  if (normalized === "sf") return "semifinal";
  if (normalized === "third") return "third";
  if (normalized === "final") return "final";
  return "group";
}

function toTeam(raw: WorldCup26Team): Team {
  const id = slugifyName(raw.name_en);
  const rank = rankByCode[raw.fifa_code] ?? 30 + Number(raw.id);
  const stars = starByTeam[id] ?? [];

  return {
    id,
    name: teamNameZh[raw.name_en] ?? raw.name_en,
    code: raw.fifa_code,
    flag: flagEmoji(raw.iso2 ?? raw.fifa_code),
    group: raw.groups,
    confederation: confederationByCode[raw.fifa_code] ?? "FIFA",
    fifaRank: rank,
    titles: titlesByCode[raw.fifa_code] ?? 0,
    bestFinish: bestFinishByCode[raw.fifa_code] ?? "参赛",
    coach: "官方名单待更新",
    starPlayers: stars,
    palette: paletteByCode[raw.fifa_code] ?? ["#1f8a70", "#f2c94c"],
    flagImage: raw.flag,
    form: [],
    story: `${teamNameZh[raw.name_en] ?? raw.name_en} 位于 ${raw.groups} 组，当前总览由公开赛程和比分自动合成。`,
  };
}

function toMatch(raw: WorldCup26Game, teamByNumericId: Map<string, string>, teamById: Map<string, Team>): Match {
  const homeTeamId = teamByNumericId.get(raw.home_team_id) ?? slugifyName(raw.home_team_name_en ?? raw.home_team_label ?? "tbd-home");
  const awayTeamId = teamByNumericId.get(raw.away_team_id) ?? slugifyName(raw.away_team_name_en ?? raw.away_team_label ?? "tbd-away");
  const status = toStatus(raw);
  const homeScore = numericScore(raw.home_score, status);
  const awayScore = numericScore(raw.away_score, status);
  const home = teamById.get(homeTeamId);
  const away = teamById.get(awayTeamId);
  const scorers = [
    ...parseScorers(raw.home_scorers, homeTeamId),
    ...parseScorers(raw.away_scorers, awayTeamId),
  ];

  return {
    id: `wc26-${raw.id}`,
    stage: toStage(raw.type),
    group: raw.group,
    matchday: Number(raw.matchday) || undefined,
    utcDate: parseWorldCup26Date(raw.local_date),
    venue: stadiumName(raw.stadium_id),
    city: stadiumCity(raw.stadium_id),
    homeTeamId,
    awayTeamId,
    homeTeamLabel: raw.home_team_label,
    awayTeamLabel: raw.away_team_label,
    status,
    homeScore,
    awayScore,
    homePenaltyScore: nullableNumber(raw.home_penalty_score),
    awayPenaltyScore: nullableNumber(raw.away_penalty_score),
    odds: estimateOdds(home, away),
    stats: status === "upcoming" ? undefined : estimateStats(home, away, homeScore ?? 0, awayScore ?? 0, raw.id),
    scorers,
    summary: buildSummary(raw, home?.name ?? raw.home_team_name_en ?? raw.home_team_label, away?.name ?? raw.away_team_name_en ?? raw.away_team_label, homeScore, awayScore),
    highlights: buildHighlights(scorers, home?.name ?? raw.home_team_name_en, away?.name ?? raw.away_team_name_en, status),
  };
}

function buildPlayers(teams: Team[], matches: Match[]): Player[] {
  const playerByName = new Map<string, Player>();

  for (const team of teams) {
    for (const name of team.starPlayers) {
      const id = slugifyName(name);
      playerByName.set(id, {
        id,
        name,
        teamId: team.id,
        position: guessPosition(name),
        goals: 0,
        assists: 0,
        shots: 0,
        shotsOnTarget: 0,
        xg: 0,
        image: playerAvatar(name),
        headline: "核心球员",
      });
    }
  }

  for (const match of matches) {
    for (const scorer of match.scorers ?? []) {
      if (!scorer.playerName) continue;
      const id = slugifyName(scorer.playerName);
      const existing = playerByName.get(id);
      if (existing) {
        existing.shots += 2;
        existing.shotsOnTarget += 1;
        existing.xg = round(existing.xg + 0.32);
        continue;
      }

      playerByName.set(id, {
        id,
        name: scorer.playerName,
        teamId: scorer.teamId,
        position: guessPosition(scorer.playerName),
        goals: 0,
        assists: 0,
        shots: 2,
        shotsOnTarget: 1,
        xg: 0.32,
        image: playerAvatar(scorer.playerName),
        headline: "本届已有进球",
      });
    }
  }

  return [...playerByName.values()];
}

function buildSocialSignals(teams: Team[], news: NewsItem[]): SocialSignal[] {
  return teams.map((team) => {
    const related = news.filter((item) => item.teamId === team.id);
    const volume = related.length > 0 ? related.length * 24000 + Math.max(0, 50 - team.fifaRank) * 1200 : Math.max(8000, (60 - team.fifaRank) * 1500);
    const tone = related.length > 0 ? related.reduce((sum, item) => sum + item.tone, 0) / related.length : (50 - team.fifaRank) / 100;
    const supportPercent = clamp(32 + (60 - team.fifaRank) * 0.7 + team.titles * 3 + tone * 10, 12, 82);

    return {
      teamId: team.id,
      supportPercent: Math.round(supportPercent),
      sentiment: round(clamp(tone, -0.65, 0.8)),
      volume: Math.round(volume),
      headline: related[0]?.title ?? `${team.name} 的全球讨论热度稳定`,
      source: related[0]?.source ?? "WorldCupView model",
      url: related[0]?.url,
    };
  });
}

function toStatus(raw: WorldCup26Game): "finished" | "live" | "upcoming" {
  if (raw.time_elapsed?.toLowerCase() === "live") return "live";
  if (raw.finished === "TRUE" || raw.time_elapsed?.toLowerCase() === "finished") return "finished";
  return "upcoming";
}

function numericScore(value: string | undefined, status: "finished" | "live" | "upcoming"): number | undefined {
  if (status === "upcoming") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function nullableNumber(value: string | undefined): number | undefined {
  if (!value || value === "null") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseWorldCup26Date(value: string): string {
  const [datePart, timePart = "00:00"] = value.split(" ");
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString();
}

function estimateOdds(home?: Team, away?: Team) {
  const homeStrength = teamStrength(home);
  const awayStrength = teamStrength(away);
  const draw = 3.15 + Math.abs(homeStrength - awayStrength) * 0.18;
  const homeOdds = clamp(1.35 + awayStrength / Math.max(homeStrength, 8), 1.28, 5.9);
  const awayOdds = clamp(1.35 + homeStrength / Math.max(awayStrength, 8), 1.28, 6.2);

  return {
    home: round(homeOdds),
    draw: round(draw),
    away: round(awayOdds),
  };
}

function estimateStats(home: Team | undefined, away: Team | undefined, homeScore: number, awayScore: number, seed: string): MatchStats {
  const seedValue = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const homeEdge = teamStrength(home) - teamStrength(away);
  const homeShots = clamp(Math.round(9 + homeScore * 2 + homeEdge * 0.12 + (seedValue % 4)), 4, 24);
  const awayShots = clamp(Math.round(9 + awayScore * 2 - homeEdge * 0.1 + (seedValue % 3)), 3, 22);
  const homePossession = clamp(Math.round(50 + homeEdge * 0.8 + ((seedValue % 7) - 3)), 32, 68);

  return {
    homeShots,
    awayShots,
    homeShotsOnTarget: clamp(Math.round(homeShots * 0.36 + homeScore), 1, homeShots),
    awayShotsOnTarget: clamp(Math.round(awayShots * 0.36 + awayScore), 1, awayShots),
    homePossession,
    awayPossession: 100 - homePossession,
    homeCorners: clamp(Math.round(homeShots / 3), 1, 11),
    awayCorners: clamp(Math.round(awayShots / 3), 1, 11),
  };
}

function buildSummary(
  raw: WorldCup26Game,
  homeName = "主队",
  awayName = "客队",
  homeScore?: number,
  awayScore?: number,
): string {
  if (raw.time_elapsed?.toLowerCase() === "live") {
    return `${homeName} 对 ${awayName} 正在进行，当前比分 ${homeScore ?? 0}-${awayScore ?? 0}。`;
  }
  if (raw.finished === "TRUE") {
    if (homeScore === awayScore && raw.home_penalty_score && raw.away_penalty_score) {
      return `${homeName} 与 ${awayName} 常规时间战平，点球比分 ${raw.home_penalty_score}-${raw.away_penalty_score}。`;
    }
    return `${homeName} ${homeScore ?? 0}-${awayScore ?? 0} ${awayName}，比赛已结束。`;
  }
  return `${homeName} 对 ${awayName} 将在 ${raw.local_date} 开球。`;
}

function buildHighlights(scorers: MatchScorer[], homeName?: string, awayName?: string, status?: string): string[] {
  if (status === "upcoming") return ["赛前阵容与赔率持续更新", "开赛前可进行模拟投注"];
  if (scorers.length === 0) return ["防守质量高于进攻转化", "门将和定位球成为关键变量"];

  return scorers.slice(0, 3).map((scorer) => `${scorer.minute}' ${scorer.playerName ?? "进球队员"} 改写比分`).concat(`${homeName ?? "主队"} vs ${awayName ?? "客队"} 技术统计已生成`);
}

function stadiumName(id?: string): string {
  return stadiums[id ?? ""]?.name ?? "世界杯球场";
}

function stadiumCity(id?: string): string {
  return stadiums[id ?? ""]?.city ?? "北美赛区";
}

const stadiums: Record<string, { name: string; city: string }> = {
  "1": { name: "Estadio Azteca", city: "Mexico City" },
  "2": { name: "Guadalajara Stadium", city: "Guadalajara" },
  "3": { name: "Monterrey Stadium", city: "Monterrey" },
  "4": { name: "MetLife Stadium", city: "New York New Jersey" },
  "5": { name: "AT&T Stadium", city: "Dallas" },
  "6": { name: "NRG Stadium", city: "Houston" },
  "7": { name: "Mercedes-Benz Stadium", city: "Atlanta" },
  "8": { name: "Hard Rock Stadium", city: "Miami" },
  "9": { name: "Arrowhead Stadium", city: "Kansas City" },
  "10": { name: "Lincoln Financial Field", city: "Philadelphia" },
  "11": { name: "Gillette Stadium", city: "Boston" },
  "12": { name: "Levi's Stadium", city: "San Francisco Bay Area" },
  "13": { name: "SoFi Stadium", city: "Los Angeles" },
  "14": { name: "Lumen Field", city: "Seattle" },
  "15": { name: "BC Place", city: "Vancouver" },
  "16": { name: "BMO Field", city: "Toronto" },
};

function teamStrength(team?: Team): number {
  if (!team) return 42;
  return 75 - Math.min(team.fifaRank, 75) + team.titles * 2;
}

function slugifyName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function flagEmoji(countryCode: string): string {
  const normalized = countryCode.toUpperCase();
  if (normalized.length !== 2) return "🏳";
  return normalized
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}

function guessPosition(name: string): string {
  if (/mbapp|haaland|kane|ronaldo|gimenez|david|vinicius|rodrygo|leão|yamal/i.test(name)) return "FW";
  if (/bellingham|pedri|odegaard|mckennie|alvarez/i.test(name)) return "MF";
  return "AM";
}

function playerAvatar(name: string): string {
  return `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(name)}&backgroundColor=0a7f5a,f5c542,1f4e79`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
