import type { Bet, Match, Pick, Wallet } from "./types";

const initialCoins = 1000;

export function createWallet(visitorId: string): Wallet {
  return {
    visitorId,
    balance: initialCoins,
    bets: [],
  };
}

export function placeBet(wallet: Wallet, match: Match, pick: Pick, stake: number): { wallet: Wallet; bet: Bet } {
  if (match.status !== "upcoming") {
    throw new Error("只能投注未开赛比赛");
  }

  if (!Number.isFinite(stake) || stake <= 0) {
    throw new Error("投注金额必须大于 0");
  }

  if (stake > wallet.balance) {
    throw new Error("金币不足");
  }

  const bet: Bet = {
    id: `${wallet.visitorId}-${match.id}-${pick}-${Date.now()}`,
    matchId: match.id,
    pick,
    stake,
    odds: match.odds[pick],
    status: "open",
    payout: 0,
    placedAt: new Date().toISOString(),
  };

  return {
    bet,
    wallet: {
      ...wallet,
      balance: roundCoins(wallet.balance - stake),
      bets: [...wallet.bets, bet],
    },
  };
}

export function settleBet(wallet: Wallet, betId: string, match: Match): Wallet {
  if (match.status !== "finished") {
    return wallet;
  }

  const result = getMatchResult(match);

  let nextBalance = wallet.balance;
  const bets = wallet.bets.map((bet) => {
    if (bet.id !== betId || bet.status !== "open") return bet;

    const won = bet.pick === result;
    const payout = won ? roundCoins(bet.stake * bet.odds) : 0;
    nextBalance += payout;

    return {
      ...bet,
      status: won ? "won" : "lost",
      payout,
    } satisfies Bet;
  });

  return {
    ...wallet,
    balance: roundCoins(nextBalance),
    bets,
  };
}

export function getMatchResult(match: Match): Pick {
  if (match.homeScore === undefined || match.awayScore === undefined) {
    throw new Error("比赛没有比分");
  }

  if (match.homeScore > match.awayScore) return "home";
  if (match.homeScore < match.awayScore) return "away";
  return "draw";
}

function roundCoins(value: number): number {
  return Math.round(value * 100) / 100;
}
