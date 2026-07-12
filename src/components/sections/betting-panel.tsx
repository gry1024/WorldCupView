import { useState } from "react";
import { Coins, RotateCcw } from "lucide-react";
import type { Match, Pick, Team, Wallet } from "@/lib/worldcup/types";
import { betStatusText, formatShortDate, matchName, stageText } from "../primitives";

const stakeOptions = [50, 100, 200, 500];

export function BettingPanel({
  wallet,
  markets,
  teamById,
  onBet,
  onReset,
}: {
  wallet: Wallet;
  markets: Match[];
  teamById: Map<string, Team>;
  onBet: (match: Match, pick: Pick, stake: number) => void;
  onReset: () => void;
}) {
  const [stake, setStake] = useState(50);
  const openBets = wallet.bets.filter((bet) => bet.status === "open");
  const settledBets = wallet.bets.filter((bet) => bet.status !== "open");
  const wonCount = wallet.bets.filter((bet) => bet.status === "won").length;
  const totalPayout = settledBets.reduce((sum, bet) => sum + bet.payout, 0);

  return (
    <div className="betting-grid">
      <section className="pitch-card wallet-panel">
        <div className="wallet-balance">
          <Coins size={30} />
          <div>
            <span>模拟金币</span>
            <strong>{wallet.balance.toFixed(0)}</strong>
          </div>
        </div>
        <div className="wallet-stats">
          <div>
            <span>待开奖</span>
            <strong>{openBets.length}</strong>
          </div>
          <div>
            <span>已中奖</span>
            <strong>{wonCount}</strong>
          </div>
          <div>
            <span>累计返还</span>
            <strong>{totalPayout.toFixed(0)}</strong>
          </div>
        </div>
        <p className="wallet-note">
          每位访客本地注册后获得 1000 金币；投注仅用于模拟和赛果理解，比赛结束后自动开奖。
        </p>
        <div className="stake-row" aria-label="投注金额">
          <span>金额</span>
          {stakeOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={option === stake ? "stake-option selected" : "stake-option"}
              aria-pressed={option === stake}
              onClick={() => setStake(option)}
            >
              {option}
            </button>
          ))}
          <button type="button" className="wallet-reset" onClick={onReset} aria-label="重置钱包">
            <RotateCcw size={14} /> 重置
          </button>
        </div>
        <div className="bet-history" aria-label="投注记录">
          {wallet.bets.length === 0 && <p className="bet-empty">还没有投注，去右侧选择一场比赛下注吧</p>}
          {wallet.bets
            .slice(-6)
            .reverse()
            .map((bet) => {
              const match = markets.find((market) => market.id === bet.matchId);
              return (
                <div key={bet.id} className={`bet-row ${bet.status}`}>
                  <span className="bet-pick">
                    {bet.stake} @ {bet.odds}
                  </span>
                  <strong>
                    {match
                      ? bet.pick === "draw"
                        ? "平局"
                        : matchName(match, teamById, bet.pick)
                      : bet.pick === "draw"
                        ? "平局"
                        : bet.pick}
                  </strong>
                  <em className="bet-status">{betStatusText(bet.status)}</em>
                  {bet.status === "won" && <b className="bet-payout">+{bet.payout.toFixed(0)}</b>}
                  {bet.status === "lost" && <b className="bet-payout lost">-{bet.stake}</b>}
                </div>
              );
            })}
        </div>
      </section>

      <section className="market-board">
        <div className="section-heading">
          <span>可投注比赛</span>
          <strong>{markets.length} 场</strong>
        </div>
        {markets.length === 0 && <div className="bet-empty market-empty">暂无可投注的未开赛比赛，稍后再来</div>}
        {markets.map((match) => (
          <article className="market-card" key={match.id}>
            <div className="match-card-head">
              <span>{formatShortDate(match.utcDate)}</span>
              <em>{stageText(match.stage)}</em>
            </div>
            <div className="match-line">
              <strong>{matchName(match, teamById, "home")}</strong>
              <span className="score-inline">VS</span>
              <strong>{matchName(match, teamById, "away")}</strong>
            </div>
            <div className="odds-row">
              <button type="button" onClick={() => onBet(match, "home", stake)}>
                <span>主胜</span>
                <strong>{match.odds.home}</strong>
                <em>可赢 {(stake * match.odds.home).toFixed(0)}</em>
              </button>
              <button type="button" onClick={() => onBet(match, "draw", stake)}>
                <span>平局</span>
                <strong>{match.odds.draw}</strong>
                <em>可赢 {(stake * match.odds.draw).toFixed(0)}</em>
              </button>
              <button type="button" onClick={() => onBet(match, "away", stake)}>
                <span>客胜</span>
                <strong>{match.odds.away}</strong>
                <em>可赢 {(stake * match.odds.away).toFixed(0)}</em>
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
