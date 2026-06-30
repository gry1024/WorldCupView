import { describe, expect, it } from "vitest";
import {
  buildBracketRounds,
  buildDashboardMetrics,
  calculateGroupStandings,
  rankTopScorers,
} from "./analytics";
import type { WorldCupData } from "./types";

const sampleData: WorldCupData = {
  updatedAt: "2026-07-01T00:00:00.000Z",
  sources: ["test"],
  teams: [
    {
      id: "mexico",
      name: "墨西哥",
      code: "MEX",
      flag: "🇲🇽",
      group: "A",
      confederation: "CONCACAF",
      fifaRank: 14,
      titles: 0,
      bestFinish: "八强",
      coach: "测试教练",
      starPlayers: ["santi"],
      palette: ["#006847", "#ce1126"],
    },
    {
      id: "canada",
      name: "加拿大",
      code: "CAN",
      flag: "🇨🇦",
      group: "A",
      confederation: "CONCACAF",
      fifaRank: 31,
      titles: 0,
      bestFinish: "小组赛",
      coach: "测试教练",
      starPlayers: ["david"],
      palette: ["#d80621", "#ffffff"],
    },
    {
      id: "brazil",
      name: "巴西",
      code: "BRA",
      flag: "🇧🇷",
      group: "B",
      confederation: "CONMEBOL",
      fifaRank: 5,
      titles: 5,
      bestFinish: "冠军",
      coach: "测试教练",
      starPlayers: ["vini"],
      palette: ["#009b3a", "#ffdf00"],
    },
    {
      id: "japan",
      name: "日本",
      code: "JPN",
      flag: "🇯🇵",
      group: "B",
      confederation: "AFC",
      fifaRank: 18,
      titles: 0,
      bestFinish: "16强",
      coach: "测试教练",
      starPlayers: ["kubo"],
      palette: ["#bc002d", "#ffffff"],
    },
  ],
  players: [
    {
      id: "santi",
      name: "Santiago Gimenez",
      teamId: "mexico",
      position: "FW",
      goals: 1,
      assists: 0,
      shots: 4,
      shotsOnTarget: 2,
      xg: 0.8,
      image: "/players/santi.svg",
    },
    {
      id: "vini",
      name: "Vinicius Junior",
      teamId: "brazil",
      position: "FW",
      goals: 2,
      assists: 1,
      shots: 7,
      shotsOnTarget: 5,
      xg: 1.9,
      image: "/players/vini.svg",
    },
  ],
  matches: [
    {
      id: "m1",
      stage: "group",
      group: "A",
      utcDate: "2026-06-30T19:00:00.000Z",
      venue: "Estadio Azteca",
      city: "Mexico City",
      homeTeamId: "mexico",
      awayTeamId: "canada",
      status: "finished",
      homeScore: 2,
      awayScore: 1,
      odds: { home: 2.1, draw: 3.2, away: 3.7 },
      stats: {
        homeShots: 12,
        awayShots: 9,
        homeShotsOnTarget: 5,
        awayShotsOnTarget: 3,
        homePossession: 54,
        awayPossession: 46,
        homeCorners: 6,
        awayCorners: 3,
      },
      scorers: [
        { playerId: "santi", teamId: "mexico", minute: 28 },
        { playerName: "测试球员", teamId: "mexico", minute: 70 },
        { playerName: "测试球员", teamId: "canada", minute: 74 },
      ],
      summary: "墨西哥利用边路压迫拿下揭幕胜利。",
      highlights: ["高压逼抢制造首球", "加拿大末段追回悬念"],
    },
    {
      id: "m2",
      stage: "group",
      group: "B",
      utcDate: "2026-07-01T03:00:00.000Z",
      venue: "Rose Bowl",
      city: "Los Angeles",
      homeTeamId: "brazil",
      awayTeamId: "japan",
      status: "live",
      homeScore: 1,
      awayScore: 0,
      odds: { home: 1.62, draw: 4.1, away: 5.8 },
      stats: {
        homeShots: 8,
        awayShots: 4,
        homeShotsOnTarget: 4,
        awayShotsOnTarget: 1,
        homePossession: 59,
        awayPossession: 41,
        homeCorners: 5,
        awayCorners: 1,
      },
      scorers: [{ playerId: "vini", teamId: "brazil", minute: 35 }],
      summary: "巴西暂时控制中路节奏。",
      highlights: ["维尼修斯反击破门"],
    },
    {
      id: "m3",
      stage: "round32",
      utcDate: "2026-07-04T20:00:00.000Z",
      venue: "MetLife Stadium",
      city: "New York New Jersey",
      homeTeamId: "mexico",
      awayTeamId: "japan",
      status: "upcoming",
      odds: { home: 2.4, draw: 3.1, away: 2.95 },
      summary: "假设淘汰赛对阵。",
      highlights: [],
    },
  ],
  social: [
    {
      teamId: "mexico",
      supportPercent: 62,
      sentiment: 0.42,
      volume: 180000,
      headline: "主场声量继续上升",
      source: "test",
    },
    {
      teamId: "brazil",
      supportPercent: 71,
      sentiment: 0.58,
      volume: 260000,
      headline: "冠军赔率和社媒情绪同步走高",
      source: "test",
    },
  ],
  news: [],
};

describe("world cup analytics", () => {
  it("builds the one-screen dashboard metrics from matches and social signals", () => {
    const metrics = buildDashboardMetrics(sampleData, new Date("2026-07-01T04:00:00.000Z"));

    expect(metrics.finishedCount).toBe(1);
    expect(metrics.liveCount).toBe(1);
    expect(metrics.upcomingCount).toBe(1);
    expect(metrics.totalGoals).toBe(4);
    expect(metrics.totalShots).toBe(33);
    expect(metrics.hottestTeam?.id).toBe("brazil");
  });

  it("calculates group standings with points, goal difference, and ranking rules", () => {
    const standings = calculateGroupStandings(sampleData);

    expect(standings.A[0]).toMatchObject({
      teamId: "mexico",
      played: 1,
      points: 3,
      goalDifference: 1,
    });
    expect(standings.A[1]).toMatchObject({
      teamId: "canada",
      played: 1,
      points: 0,
      goalDifference: -1,
    });
  });

  it("merges official player totals with match scorers for the top scorer race", () => {
    const scorers = rankTopScorers(sampleData, 3);

    expect(scorers[0]).toMatchObject({
      playerId: "vini",
      teamId: "brazil",
      goals: 3,
      shotsOnTarget: 5,
    });
    expect(scorers[1]).toMatchObject({
      playerId: "santi",
      teamId: "mexico",
      goals: 2,
    });
  });

  it("matches scorer rows by player name when the source does not include player ids", () => {
    const data: WorldCupData = {
      ...sampleData,
      players: [
        {
          id: "kylian-mbappe",
          name: "Kylian Mbappé",
          teamId: "brazil",
          position: "FW",
          goals: 0,
          assists: 0,
          shots: 2,
          shotsOnTarget: 1,
          xg: 0.3,
          image: "/players/mbappe.svg",
        },
      ],
      matches: [
        {
          ...sampleData.matches[0],
          scorers: [{ playerName: "Kylian Mbappé", teamId: "brazil", minute: 14 }],
        },
      ],
    };

    expect(rankTopScorers(data, 1)[0]).toMatchObject({
      playerId: "kylian-mbappe",
      goals: 1,
    });
  });

  it("groups knockout matches into bracket rounds in tournament order", () => {
    const rounds = buildBracketRounds(sampleData.matches);

    expect(rounds.map((round) => round.stage)).toEqual(["round32"]);
    expect(rounds[0].matches[0].id).toBe("m3");
  });
});
