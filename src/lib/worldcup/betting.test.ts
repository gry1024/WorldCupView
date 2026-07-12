import { describe, expect, it } from "vitest";
import { createWallet, placeBet, settleBet, settleOpenBets } from "./betting";
import type { Match } from "./types";

const finishedMatch: Match = {
  id: "final-test",
  stage: "final",
  utcDate: "2026-07-19T23:00:00.000Z",
  venue: "MetLife Stadium",
  city: "New York New Jersey",
  homeTeamId: "argentina",
  awayTeamId: "france",
  status: "finished",
  homeScore: 2,
  awayScore: 1,
  odds: { home: 2.25, draw: 3.25, away: 3.05 },
  summary: "测试决赛。",
  highlights: [],
};

describe("simulated betting", () => {
  it("grants each new visitor a fixed coin bankroll", () => {
    const wallet = createWallet("visitor-1");

    expect(wallet.balance).toBe(1000);
    expect(wallet.visitorId).toBe("visitor-1");
    expect(wallet.bets).toEqual([]);
  });

  it("places a valid pre-match bet and deducts the stake", () => {
    const wallet = createWallet("visitor-2");
    const match: Match = { ...finishedMatch, status: "upcoming", homeScore: undefined, awayScore: undefined };

    const result = placeBet(wallet, match, "home", 120);

    expect(result.wallet.balance).toBe(880);
    expect(result.bet).toMatchObject({
      matchId: "final-test",
      pick: "home",
      stake: 120,
      odds: 2.25,
      status: "open",
    });
  });

  it("rejects invalid stakes and bets on finished matches", () => {
    const wallet = createWallet("visitor-3");

    expect(() => placeBet(wallet, finishedMatch, "away", 50)).toThrow("只能投注未开赛比赛");
    expect(() => placeBet(wallet, { ...finishedMatch, status: "upcoming" }, "draw", 1200)).toThrow("金币不足");
  });

  it("settles winning and losing bets using decimal odds", () => {
    const wallet = createWallet("visitor-4");
    const upcoming: Match = { ...finishedMatch, status: "upcoming", homeScore: undefined, awayScore: undefined };
    const placed = placeBet(wallet, upcoming, "home", 100);

    const settled = settleBet(placed.wallet, placed.bet.id, finishedMatch);

    expect(settled.bets[0]).toMatchObject({ status: "won", payout: 225 });
    expect(settled.balance).toBe(1125);

    const second = placeBet(settled, upcoming, "away", 100);
    const settledAgain = settleBet(second.wallet, second.bet.id, finishedMatch);

    expect(settledAgain.bets[1]).toMatchObject({ status: "lost", payout: 0 });
    expect(settledAgain.balance).toBe(1025);
  });

  it("settleOpenBets resolves every open bet whose match has finished and leaves others untouched", () => {
    const wallet = createWallet("visitor-5");
    const upcoming: Match = { ...finishedMatch, status: "upcoming", homeScore: undefined, awayScore: undefined };
    const stillUpcoming: Match = { ...finishedMatch, id: "later", status: "upcoming" };

    const placedHome = placeBet(wallet, upcoming, "home", 100);
    const placedAway = placeBet(placedHome.wallet, stillUpcoming, "away", 80);

    const settled = settleOpenBets(placedAway.wallet, [finishedMatch, stillUpcoming]);

    const homeBet = settled.bets.find((bet) => bet.matchId === "final-test");
    const laterBet = settled.bets.find((bet) => bet.matchId === "later");

    expect(homeBet).toMatchObject({ status: "won", payout: 225 });
    expect(laterBet).toMatchObject({ status: "open" });
    expect(settled.balance).toBe(1045);
  });
});
