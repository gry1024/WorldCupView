"use client";

import { useCallback, useEffect, useState } from "react";
import { createWallet, placeBet, settleOpenBets } from "@/lib/worldcup/betting";
import type { Match, Pick, Wallet } from "@/lib/worldcup/types";

const storageKey = "worldcupview-wallet";

function loadWallet(): Wallet {
  if (typeof window === "undefined") return createWallet("guest");

  const stored = localStorage.getItem(storageKey);
  if (stored) {
    try {
      return JSON.parse(stored) as Wallet;
    } catch {
      // fall through to create a fresh wallet
    }
  }

  const nextWallet = createWallet(`fan-${crypto.randomUUID().slice(0, 8)}`);
  localStorage.setItem(storageKey, JSON.stringify(nextWallet));
  return nextWallet;
}

export function useWallet(matches: Match[]) {
  const [wallet, setWallet] = useState<Wallet>(loadWallet);
  const [notice, setNotice] = useState("数据已加载");
  // 用前一次 matches 引用判断是否需要结算；初始为 null 保证首屏也结算一次
  const [prevMatches, setPrevMatches] = useState<Match[] | null>(null);

  // 当比赛数据变化（含首屏）时，结算所有已完赛的待开奖投注。
  // 采用「渲染期间调整 state」模式，避免 effect 内同步 setState 触发级联渲染。
  if (prevMatches !== matches) {
    setPrevMatches(matches);
    setWallet((prev) => {
      const settled = settleOpenBets(prev, matches);
      return settled === prev ? prev : settled;
    });
  }

  // 持久化钱包
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(wallet));
  }, [wallet]);

  const bet = useCallback(
    (match: Match, pick: Pick, stake: number) => {
      try {
        const result = placeBet(wallet, match, pick, stake);
        setWallet(result.wallet);
        setNotice(`投注成功：${stake} 金币 · 赔率 ${result.bet.odds}`);
        return result.bet;
      } catch (error) {
        setNotice((error as Error).message);
        return null;
      }
    },
    [wallet],
  );

  const reset = useCallback(() => {
    const nextWallet = createWallet(`fan-${crypto.randomUUID().slice(0, 8)}`);
    setWallet(nextWallet);
    setNotice("钱包已重置为 1000 金币");
  }, []);

  return { wallet, bet, reset, notice, setNotice };
}
