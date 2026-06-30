"use client";

import Image from "next/image";
import {
  Activity,
  CalendarDays,
  Clock3,
  Coins,
  Gauge,
  Goal,
  MapPin,
  Medal,
  Newspaper,
  Radio,
  Shield,
  Trophy,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildBracketRounds, buildDashboardMetrics, calculateGroupStandings, getTeamName, rankTopScorers } from "@/lib/worldcup/analytics";
import { createWallet, placeBet } from "@/lib/worldcup/betting";
import type { Match, Pick, Team, Wallet, WorldCupData } from "@/lib/worldcup/types";

type TabKey = "overview" | "bracket" | "matches" | "players" | "teams" | "pulse" | "betting";

const tabs: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: "overview", label: "总览", icon: Activity },
  { key: "bracket", label: "对阵图", icon: Trophy },
  { key: "matches", label: "比赛", icon: CalendarDays },
  { key: "players", label: "球员", icon: Medal },
  { key: "teams", label: "球队", icon: Shield },
  { key: "pulse", label: "舆情", icon: Radio },
  { key: "betting", label: "模拟投注", icon: WalletCards },
];

const stake = 50;

export function WorldCupViewApp({ initialData }: { initialData: WorldCupData }) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedTeamId, setSelectedTeamId] = useState("argentina");
  const [wallet, setWallet] = useState<Wallet>(() => {
    if (typeof window === "undefined") return createWallet("guest");

    const stored = localStorage.getItem("worldcupview-wallet");
    if (stored) return JSON.parse(stored) as Wallet;

    const nextWallet = createWallet(`fan-${crypto.randomUUID().slice(0, 8)}`);
    localStorage.setItem("worldcupview-wallet", JSON.stringify(nextWallet));
    return nextWallet;
  });
  const [notice, setNotice] = useState("数据已加载");

  const teamById = useMemo(() => new Map(data.teams.map((team) => [team.id, team])), [data.teams]);
  const metrics = useMemo(() => buildDashboardMetrics(data), [data]);
  const standings = useMemo(() => calculateGroupStandings(data), [data]);
  const topScorers = useMemo(() => rankTopScorers(data, 10), [data]);
  const bracketRounds = useMemo(() => buildBracketRounds(data.matches), [data.matches]);
  const selectedTeam = teamById.get(selectedTeamId) ?? data.teams[0];
  const selectedTeamMatches = data.matches
    .filter((match) => match.homeTeamId === selectedTeam?.id || match.awayTeamId === selectedTeam?.id)
    .slice(-8);
  const upcomingMarkets = data.matches.filter((match) => match.status === "upcoming").slice(0, 5);
  const finishedMatches = data.matches.filter((match) => match.status === "finished").slice(-8).reverse();
  const liveMatches = data.matches.filter((match) => match.status === "live");
  const upcomingMatches = data.matches.filter((match) => match.status === "upcoming").slice(0, 8);

  useEffect(() => {
    localStorage.setItem("worldcupview-wallet", JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    const refresh = async () => {
      try {
        const response = await fetch(`/data/worldcup-data.json?ts=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const nextData = (await response.json()) as WorldCupData;
        setData(nextData);
        setNotice("整点数据已刷新");
      } catch {
        setNotice("离线缓存可用");
      }
    };

    const timer = window.setInterval(refresh, 3_600_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleBet = (match: Match, pick: Pick) => {
    try {
      const result = placeBet(wallet, match, pick, stake);
      setWallet(result.wallet);
      setNotice(`投注成功：${stake} 金币，赔率 ${result.bet.odds}`);
    } catch (error) {
      setNotice((error as Error).message);
    }
  };

  return (
    <main className="wcv-shell">
      <header className="wcv-topbar">
        <div className="brand-lockup">
          <div className="brand-ball" aria-hidden="true" />
          <div>
            <p className="eyebrow">2026 美加墨世界杯全局雷达</p>
            <h1>WorldCupView</h1>
          </div>
        </div>
        <div className="topbar-metrics" aria-label="数据概览">
          <MetricPill icon={Radio} label="实时" value={`${metrics.liveCount} 场`} />
          <MetricPill icon={Goal} label="进球" value={`${metrics.totalGoals}`} />
          <MetricPill icon={Gauge} label="射门" value={`${metrics.totalShots}`} />
          <MetricPill icon={Clock3} label="更新" value={formatShortTime(data.updatedAt)} />
        </div>
        <div className="notice">{notice}</div>
      </header>

      <section className="wcv-body">
        <nav className="wcv-tabs" role="tablist" aria-label="WorldCupView 功能栏目">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-label={tab.label}
                className="nav-tab"
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="wcv-panel" role="tabpanel">
          {activeTab === "overview" && (
            <OverviewPanel data={data} metrics={metrics} teamById={teamById} standings={standings} topScorers={topScorers} />
          )}
          {activeTab === "bracket" && <BracketPanel rounds={bracketRounds} teamById={teamById} />}
          {activeTab === "matches" && (
            <MatchesPanel finished={finishedMatches} live={liveMatches} upcoming={upcomingMatches} teamById={teamById} />
          )}
          {activeTab === "players" && <PlayersPanel topScorers={topScorers} teams={teamById} />}
          {activeTab === "teams" && (
            <TeamsPanel
              teams={data.teams}
              selectedTeam={selectedTeam}
              selectedTeamMatches={selectedTeamMatches}
              teamById={teamById}
              onSelectTeam={setSelectedTeamId}
            />
          )}
          {activeTab === "pulse" && <PulsePanel data={data} teamById={teamById} />}
          {activeTab === "betting" && <BettingPanel wallet={wallet} markets={upcomingMarkets} teamById={teamById} onBet={handleBet} />}
        </section>
      </section>
    </main>
  );
}

function OverviewPanel({
  data,
  metrics,
  teamById,
  standings,
  topScorers,
}: {
  data: WorldCupData;
  metrics: ReturnType<typeof buildDashboardMetrics>;
  teamById: Map<string, Team>;
  standings: ReturnType<typeof calculateGroupStandings>;
  topScorers: ReturnType<typeof rankTopScorers>;
}) {
  const spotlight = metrics.featuredMatch;
  const groups = Object.entries(standings).slice(0, 12);

  return (
    <div className="overview-grid">
      <section className="pitch-card spotlight">
        <div className="section-heading">
          <span>全局焦点</span>
          <strong>{spotlight ? statusText(spotlight.status) : "待更新"}</strong>
        </div>
        {spotlight && <MatchHero match={spotlight} teamById={teamById} />}
      </section>

      <section className="pitch-card score-strip">
        <div className="score-tile">
          <span>已结束</span>
          <strong>{metrics.finishedCount}</strong>
        </div>
        <div className="score-tile live">
          <span>进行中</span>
          <strong>{metrics.liveCount}</strong>
        </div>
        <div className="score-tile">
          <span>待开赛</span>
          <strong>{metrics.upcomingCount}</strong>
        </div>
        <div className="score-tile hot">
          <span>热度队</span>
          <strong>{metrics.hottestTeam?.name ?? "刷新中"}</strong>
        </div>
      </section>

      <section className="pitch-card group-board">
        <div className="section-heading">
          <span>小组头名速览</span>
          <strong>12 组</strong>
        </div>
        <div className="group-leaders">
          {groups.map(([group, rows]) => {
            const leader = rows[0];
            return (
              <div className="group-chip" key={group}>
                <span>{group}</span>
                <strong>{getTeamName(teamById, leader.teamId)}</strong>
                <em>{leader.points}分 / {leader.goalDifference >= 0 ? "+" : ""}{leader.goalDifference}</em>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pitch-card player-race">
        <div className="section-heading">
          <span>射手榜</span>
          <strong>Top 6</strong>
        </div>
        <div className="compact-rank">
          {topScorers.slice(0, 6).map((player, index) => (
            <div className="rank-row" key={player.playerId}>
              <span>{index + 1}</span>
              <strong>{player.name}</strong>
              <em>{getTeamName(teamById, player.teamId)} · {player.goals}球</em>
            </div>
          ))}
        </div>
      </section>

      <section className="pitch-card news-rail">
        <div className="section-heading">
          <span>全球观点</span>
          <strong>{data.news.length} 条</strong>
        </div>
        {data.news.slice(0, 5).map((item) => (
          <a className="headline-row" href={item.url} key={item.id} target="_blank" rel="noreferrer">
            <Newspaper size={15} />
            <span>{item.title}</span>
          </a>
        ))}
      </section>
    </div>
  );
}

function BracketPanel({ rounds, teamById }: { rounds: ReturnType<typeof buildBracketRounds>; teamById: Map<string, Team> }) {
  return (
    <div className="bracket-board">
      {rounds.map((round) => (
        <section className="bracket-round" key={round.stage}>
          <div className="round-title">{round.label}</div>
          <div className="bracket-list">
            {round.matches.slice(0, round.stage === "round32" ? 16 : 8).map((match) => (
              <div className={`bracket-match ${match.status}`} key={match.id}>
                <span>{formatShortDate(match.utcDate)}</span>
                <strong>{matchName(match, teamById, "home")}</strong>
                <ScoreInline match={match} />
                <strong>{matchName(match, teamById, "away")}</strong>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MatchesPanel({
  finished,
  live,
  upcoming,
  teamById,
}: {
  finished: Match[];
  live: Match[];
  upcoming: Match[];
  teamById: Map<string, Team>;
}) {
  return (
    <div className="matches-grid">
      <MatchColumn title="进行中" icon={Radio} matches={live.length ? live : upcoming.slice(0, 2)} teamById={teamById} />
      <MatchColumn title="已结束" icon={Trophy} matches={finished} teamById={teamById} />
      <MatchColumn title="即将进行" icon={Clock3} matches={upcoming} teamById={teamById} />
    </div>
  );
}

function MatchColumn({
  title,
  icon: Icon,
  matches,
  teamById,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  matches: Match[];
  teamById: Map<string, Team>;
}) {
  return (
    <section className="match-column">
      <div className="column-title">
        <Icon size={16} />
        <span>{title}</span>
      </div>
      {matches.slice(0, 8).map((match) => (
        <article className="match-card" key={match.id}>
          <div className="match-card-head">
            <span>{formatShortDate(match.utcDate)}</span>
            <em>{match.venue}</em>
          </div>
          <div className="match-line">
            <strong>{matchName(match, teamById, "home")}</strong>
            <ScoreInline match={match} />
            <strong>{matchName(match, teamById, "away")}</strong>
          </div>
          <p>{match.summary}</p>
          {match.stats && (
            <div className="stat-bars">
              <Bar label="射门" left={match.stats.homeShots} right={match.stats.awayShots} />
              <Bar label="射正" left={match.stats.homeShotsOnTarget} right={match.stats.awayShotsOnTarget} />
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

function PlayersPanel({ topScorers, teams }: { topScorers: ReturnType<typeof rankTopScorers>; teams: Map<string, Team> }) {
  const leader = topScorers[0];

  return (
    <div className="players-grid">
      {leader && (
        <section className="pitch-card player-leader">
          <Image src={leader.image} alt={leader.name} width={160} height={160} unoptimized priority />
          <div>
            <p className="eyebrow">金靴领跑</p>
            <h2>{leader.name}</h2>
            <strong>{leader.goals} 球 · {teams.get(leader.teamId)?.name}</strong>
            <span>{leader.shotsOnTarget} 次射正 / xG {leader.xg.toFixed(2)}</span>
          </div>
        </section>
      )}
      <section className="pitch-card scorer-table">
        {topScorers.map((player, index) => (
          <div className="scorer-row" key={player.playerId}>
            <span>{index + 1}</span>
            <Image src={player.image} alt={player.name} width={34} height={34} unoptimized />
            <strong>{player.name}</strong>
            <em>{teams.get(player.teamId)?.name}</em>
            <b>{player.goals}</b>
            <div className="mini-meter">
              <i style={{ width: `${Math.min(100, player.shotsOnTarget * 13)}%` }} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function TeamsPanel({
  teams,
  selectedTeam,
  selectedTeamMatches,
  teamById,
  onSelectTeam,
}: {
  teams: Team[];
  selectedTeam?: Team;
  selectedTeamMatches: Match[];
  teamById: Map<string, Team>;
  onSelectTeam: (teamId: string) => void;
}) {
  if (!selectedTeam) return null;

  const orderedTeams = [...teams].sort((a, b) => a.group.localeCompare(b.group) || a.fifaRank - b.fifaRank);

  return (
    <div className="teams-grid">
      <section className="team-selector" aria-label="国家队列表">
        {orderedTeams.map((team) => (
          <button
            key={team.id}
            type="button"
            className={team.id === selectedTeam.id ? "team-button selected" : "team-button"}
            onClick={() => onSelectTeam(team.id)}
          >
            <span>{team.flag}</span>
            <strong>{team.name}</strong>
          </button>
        ))}
      </section>

      <section className="pitch-card team-detail">
        <div className="team-crest" style={{ background: `linear-gradient(135deg, ${selectedTeam.palette[0]}, ${selectedTeam.palette[1]})` }}>
          {selectedTeam.flagImage && <Image src={selectedTeam.flagImage} alt={selectedTeam.name} width={84} height={56} unoptimized />}
        </div>
        <div>
          <p className="eyebrow">国家队全景</p>
          <h2>国家队全景 · {selectedTeam.name}</h2>
          <div className="team-facts">
            <span>FIFA #{selectedTeam.fifaRank}</span>
            <span>{selectedTeam.confederation}</span>
            <span>{selectedTeam.group}组</span>
            <span>世界杯履历：{selectedTeam.bestFinish}</span>
          </div>
          <p>{selectedTeam.story}</p>
        </div>
      </section>

      <section className="pitch-card team-timeline">
        <div className="section-heading">
          <span>本届对阵</span>
          <strong>{selectedTeamMatches.length} 场</strong>
        </div>
        {selectedTeamMatches.map((match) => (
          <div className="team-match" key={match.id}>
            <span>{formatShortDate(match.utcDate)}</span>
            <strong>{matchName(match, teamById, "home")} <ScoreInline match={match} /> {matchName(match, teamById, "away")}</strong>
            <em>{statusText(match.status)}</em>
          </div>
        ))}
      </section>
    </div>
  );
}

function PulsePanel({ data, teamById }: { data: WorldCupData; teamById: Map<string, Team> }) {
  const signals = [...data.social].sort((a, b) => b.supportPercent - a.supportPercent).slice(0, 16);

  return (
    <div className="pulse-grid">
      <section className="support-map">
        {signals.map((signal) => (
          <div className="support-cell" key={signal.teamId}>
            <span>{teamById.get(signal.teamId)?.flag}</span>
            <strong>{teamById.get(signal.teamId)?.name}</strong>
            <div className="support-bar">
              <i style={{ width: `${signal.supportPercent}%` }} />
            </div>
            <em>{signal.supportPercent}% 支持 · {signal.sentiment >= 0 ? "积极" : "承压"}</em>
          </div>
        ))}
      </section>
      <section className="pitch-card pulse-news">
        <div className="section-heading">
          <span>值得关注的全球观点</span>
          <strong>新闻 + 社媒声量</strong>
        </div>
        {data.news.slice(0, 10).map((item) => (
          <a className="pulse-headline" href={item.url} key={item.id} target="_blank" rel="noreferrer">
            <span>{item.source}</span>
            <strong>{item.title}</strong>
            <em>{item.tone >= 0 ? "情绪偏正" : "情绪偏负"}</em>
          </a>
        ))}
      </section>
    </div>
  );
}

function BettingPanel({
  wallet,
  markets,
  teamById,
  onBet,
}: {
  wallet: Wallet;
  markets: Match[];
  teamById: Map<string, Team>;
  onBet: (match: Match, pick: Pick) => void;
}) {
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
        <p>每个访问者本地注册后自动获得 1000 金币；所有投注仅用于模拟和赛果理解。</p>
        <div className="bet-history">
          {wallet.bets.slice(-5).reverse().map((bet) => (
            <div key={bet.id}>
              <span>已下注</span>
              <strong>{bet.stake} @ {bet.odds}</strong>
              <em>{bet.status}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="market-board">
        {markets.map((match) => (
          <article className="market-card" key={match.id}>
            <div className="match-card-head">
              <span>{formatShortDate(match.utcDate)}</span>
              <em>{match.venue}</em>
            </div>
            <div className="match-line">
              <strong>{matchName(match, teamById, "home")}</strong>
              <ScoreInline match={match} />
              <strong>{matchName(match, teamById, "away")}</strong>
            </div>
            <div className="odds-row">
              <button type="button" onClick={() => onBet(match, "home")}>主胜 {match.odds.home}</button>
              <button type="button" onClick={() => onBet(match, "draw")}>平局 {match.odds.draw}</button>
              <button type="button" onClick={() => onBet(match, "away")}>客胜 {match.odds.away}</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function MatchHero({ match, teamById }: { match: Match; teamById: Map<string, Team> }) {
  return (
    <div className="match-hero">
      <div>
        <span>{matchName(match, teamById, "home")}</span>
        <strong>{match.homeScore ?? "-"}</strong>
      </div>
      <div className="hero-center">
        <em>{formatShortDate(match.utcDate)}</em>
        <ScoreInline match={match} />
        <small><MapPin size={13} />{match.city}</small>
      </div>
      <div>
        <span>{matchName(match, teamById, "away")}</span>
        <strong>{match.awayScore ?? "-"}</strong>
      </div>
      <p>{match.summary}</p>
    </div>
  );
}

function MetricPill({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string }) {
  return (
    <div className="metric-pill">
      <Icon size={15} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScoreInline({ match }: { match: Match }) {
  if (match.status === "upcoming") return <span className="score-inline">vs</span>;
  return <span className="score-inline">{match.homeScore ?? 0}:{match.awayScore ?? 0}</span>;
}

function Bar({ label, left, right }: { label: string; left: number; right: number }) {
  const total = Math.max(1, left + right);
  return (
    <div className="bar-row">
      <span>{left}</span>
      <div>
        <i style={{ width: `${(left / total) * 100}%` }} />
        <b>{label}</b>
      </div>
      <span>{right}</span>
    </div>
  );
}

function matchName(match: Match, teamById: Map<string, Team>, side: "home" | "away") {
  const id = side === "home" ? match.homeTeamId : match.awayTeamId;
  const label = side === "home" ? match.homeTeamLabel : match.awayTeamLabel;
  return getTeamName(teamById, id, label);
}

function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusText(status: Match["status"]) {
  if (status === "finished") return "已结束";
  if (status === "live") return "进行中";
  return "未开赛";
}
