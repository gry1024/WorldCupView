export type MatchStatus = "finished" | "live" | "upcoming";

export type MatchStage =
  | "group"
  | "round32"
  | "round16"
  | "quarterfinal"
  | "semifinal"
  | "third"
  | "final";

export type Pick = "home" | "draw" | "away";

export type Team = {
  id: string;
  name: string;
  code: string;
  flag: string;
  group: string;
  confederation: string;
  fifaRank: number;
  titles: number;
  bestFinish: string;
  coach: string;
  starPlayers: string[];
  palette: [string, string] | string[];
  flagImage?: string;
  form?: string[];
  story?: string;
};

export type Player = {
  id: string;
  name: string;
  teamId: string;
  position: string;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  xg: number;
  image: string;
  minutes?: number;
  headline?: string;
};

export type MatchStats = {
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homePossession: number;
  awayPossession: number;
  homeCorners: number;
  awayCorners: number;
};

export type MatchScorer = {
  playerId?: string;
  playerName?: string;
  teamId: string;
  minute: number;
};

export type Odds = {
  home: number;
  draw: number;
  away: number;
};

export type Match = {
  id: string;
  stage: MatchStage;
  group?: string;
  matchday?: number;
  utcDate: string;
  venue: string;
  city: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamLabel?: string;
  awayTeamLabel?: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  odds: Odds;
  stats?: MatchStats;
  scorers?: MatchScorer[];
  summary: string;
  highlights: string[];
};

export type SocialSignal = {
  teamId: string;
  supportPercent: number;
  sentiment: number;
  volume: number;
  headline: string;
  source: string;
  url?: string;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  tone: number;
  teamId?: string;
};

export type WorldCupData = {
  updatedAt: string;
  sources: string[];
  teams: Team[];
  players: Player[];
  matches: Match[];
  social: SocialSignal[];
  news: NewsItem[];
};

export type Standing = {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type BracketRound = {
  stage: MatchStage;
  label: string;
  matches: Match[];
};

export type DashboardMetrics = {
  finishedCount: number;
  liveCount: number;
  upcomingCount: number;
  totalGoals: number;
  totalShots: number;
  nextMatch?: Match;
  featuredMatch?: Match;
  hottestTeam?: Team;
};

export type TopScorer = {
  playerId: string;
  name: string;
  teamId: string;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  xg: number;
  image: string;
};

export type BetStatus = "open" | "won" | "lost" | "void";

export type Bet = {
  id: string;
  matchId: string;
  pick: Pick;
  stake: number;
  odds: number;
  status: BetStatus;
  payout: number;
  placedAt: string;
};

export type Wallet = {
  visitorId: string;
  balance: number;
  bets: Bet[];
};
