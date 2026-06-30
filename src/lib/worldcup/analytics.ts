import type {
  BracketRound,
  DashboardMetrics,
  Match,
  MatchStage,
  Standing,
  Team,
  TopScorer,
  WorldCupData,
} from "./types";

const bracketOrder: MatchStage[] = ["round32", "round16", "quarterfinal", "semifinal", "third", "final"];

const bracketLabels: Record<MatchStage, string> = {
  group: "小组赛",
  round32: "32强",
  round16: "16强",
  quarterfinal: "8强",
  semifinal: "半决赛",
  third: "季军赛",
  final: "决赛",
};

export function buildDashboardMetrics(data: WorldCupData, now = new Date()): DashboardMetrics {
  const finished = data.matches.filter((match) => match.status === "finished");
  const live = data.matches.filter((match) => match.status === "live");
  const upcoming = data.matches
    .filter((match) => match.status === "upcoming")
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  const totalGoals = data.matches.reduce((sum, match) => {
    if (match.status === "upcoming") return sum;
    return sum + (match.homeScore ?? 0) + (match.awayScore ?? 0);
  }, 0);

  const totalShots = data.matches.reduce((sum, match) => {
    if (!match.stats || match.status === "upcoming") return sum;
    return sum + match.stats.homeShots + match.stats.awayShots;
  }, 0);

  const teamById = new Map(data.teams.map((team) => [team.id, team]));
  const hottestSignal = [...data.social].sort(
    (a, b) => b.volume * (1 + b.sentiment) * b.supportPercent - a.volume * (1 + a.sentiment) * a.supportPercent,
  )[0];

  const featuredMatch =
    live[0] ??
    upcoming.find((match) => new Date(match.utcDate).getTime() >= now.getTime()) ??
    finished.at(-1);

  return {
    finishedCount: finished.length,
    liveCount: live.length,
    upcomingCount: upcoming.length,
    totalGoals,
    totalShots,
    nextMatch: upcoming.find((match) => new Date(match.utcDate).getTime() >= now.getTime()) ?? upcoming[0],
    featuredMatch,
    hottestTeam: hottestSignal ? teamById.get(hottestSignal.teamId) : undefined,
  };
}

export function calculateGroupStandings(data: WorldCupData): Record<string, Standing[]> {
  const standings: Record<string, Standing[]> = {};

  for (const team of data.teams) {
    standings[team.group] ??= [];
    standings[team.group].push(emptyStanding(team.id));
  }

  const standingByTeam = new Map<string, Standing>();
  for (const group of Object.values(standings)) {
    for (const standing of group) standingByTeam.set(standing.teamId, standing);
  }

  for (const match of data.matches) {
    if (match.stage !== "group" || match.status !== "finished") continue;
    if (match.homeScore === undefined || match.awayScore === undefined) continue;

    const home = standingByTeam.get(match.homeTeamId);
    const away = standingByTeam.get(match.awayTeamId);
    if (!home || !away) continue;

    applyMatchToStanding(home, match.homeScore, match.awayScore);
    applyMatchToStanding(away, match.awayScore, match.homeScore);

    if (match.homeScore > match.awayScore) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else if (match.homeScore < match.awayScore) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const group of Object.values(standings)) {
    group.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.teamId.localeCompare(b.teamId);
    });
  }

  return standings;
}

export function rankTopScorers(data: WorldCupData, limit = 12): TopScorer[] {
  const scorerByPlayer = new Map<string, TopScorer>();

  for (const player of data.players) {
    scorerByPlayer.set(player.id, {
      playerId: player.id,
      name: player.name,
      teamId: player.teamId,
      goals: player.goals,
      assists: player.assists,
      shots: player.shots,
      shotsOnTarget: player.shotsOnTarget,
      xg: player.xg,
      image: player.image,
    });
  }

  for (const match of data.matches) {
    for (const scorer of match.scorers ?? []) {
      const scorerId = scorer.playerId ?? (scorer.playerName ? slugifyName(scorer.playerName) : undefined);
      if (!scorerId) continue;
      const existing = scorerByPlayer.get(scorerId);
      if (existing) {
        existing.goals += 1;
      }
    }
  }

  return [...scorerByPlayer.values()]
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.assists !== a.assists) return b.assists - a.assists;
      if (b.shotsOnTarget !== a.shotsOnTarget) return b.shotsOnTarget - a.shotsOnTarget;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

export function buildBracketRounds(matches: Match[]): BracketRound[] {
  return bracketOrder
    .map((stage) => ({
      stage,
      label: bracketLabels[stage],
      matches: matches
        .filter((match) => match.stage === stage)
        .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()),
    }))
    .filter((round) => round.matches.length > 0);
}

export function getTeamName(teamById: Map<string, Team>, id: string, fallback?: string): string {
  return teamById.get(id)?.name ?? fallback ?? "待定";
}

function emptyStanding(teamId: string): Standing {
  return {
    teamId,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function applyMatchToStanding(standing: Standing, goalsFor: number, goalsAgainst: number) {
  standing.played += 1;
  standing.goalsFor += goalsFor;
  standing.goalsAgainst += goalsAgainst;
  standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
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
