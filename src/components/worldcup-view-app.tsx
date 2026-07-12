"use client";

import { Activity, CalendarDays, Clock3, Gauge, Goal, Medal, Radio, Shield, Trophy, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildBracketRounds, buildDashboardMetrics, calculateGroupStandings, rankTopScorers } from "@/lib/worldcup/analytics";
import type { Match, Pick, WorldCupData } from "@/lib/worldcup/types";
import { MetricPill, formatShortTime } from "./primitives";
import { useWallet } from "./use-wallet";
import { OverviewPanel } from "./sections/overview-panel";
import { BracketPanel } from "./sections/bracket-panel";
import { MatchesPanel } from "./sections/matches-panel";
import { PlayersPanel } from "./sections/players-panel";
import { TeamsPanel } from "./sections/teams-panel";
import { PulsePanel } from "./sections/pulse-panel";
import { BettingPanel } from "./sections/betting-panel";

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

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function WorldCupViewApp({ initialData }: { initialData: WorldCupData }) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedTeamId, setSelectedTeamId] = useState("argentina");

  const teamById = useMemo(() => new Map(data.teams.map((team) => [team.id, team])), [data.teams]);
  const metrics = useMemo(() => buildDashboardMetrics(data), [data]);
  const standings = useMemo(() => calculateGroupStandings(data), [data]);
  const topScorers = useMemo(() => rankTopScorers(data, 10), [data]);
  const bracketRounds = useMemo(() => buildBracketRounds(data.matches), [data.matches]);

  const selectedTeam = teamById.get(selectedTeamId) ?? data.teams[0];
  const selectedTeamMatches = data.matches
    .filter((match) => match.homeTeamId === selectedTeam?.id || match.awayTeamId === selectedTeam?.id)
    .slice(-8);
  const upcomingMarkets = data.matches.filter((match) => match.status === "upcoming").slice(0, 8);
  const finishedMatches = data.matches.filter((match) => match.status === "finished").slice(-8).reverse();
  const liveMatches = data.matches.filter((match) => match.status === "live");
  const upcomingMatches = data.matches.filter((match) => match.status === "upcoming").slice(0, 8);

  const { wallet, bet, reset, notice, setNotice } = useWallet(data.matches);

  useEffect(() => {
    const refresh = async () => {
      try {
        const response = await fetch(`${basePath}/data/worldcup-data.json?ts=${Date.now()}`, { cache: "no-store" });
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
  }, [setNotice]);

  const handleBet = (match: Match, pick: Pick, stake: number) => bet(match, pick, stake);

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
          <MetricPill icon={Radio} label="实时" value={`${metrics.liveCount} 场`} tone={metrics.liveCount > 0 ? "live" : "default"} />
          <MetricPill icon={Goal} label="进球" value={`${metrics.totalGoals}`} />
          <MetricPill icon={Gauge} label="射门" value={`${metrics.totalShots}`} />
          <MetricPill icon={Clock3} label="更新" value={formatShortTime(data.updatedAt)} />
        </div>
        <div className="notice" role="status" aria-live="polite">
          {notice}
        </div>
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
              standings={standings}
              onSelectTeam={setSelectedTeamId}
            />
          )}
          {activeTab === "pulse" && <PulsePanel data={data} teamById={teamById} />}
          {activeTab === "betting" && (
            <BettingPanel
              wallet={wallet}
              markets={upcomingMarkets}
              teamById={teamById}
              onBet={handleBet}
              onReset={reset}
            />
          )}
        </section>
      </section>
    </main>
  );
}
