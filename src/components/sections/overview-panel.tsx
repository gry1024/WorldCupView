import { Newspaper } from "lucide-react";
import type { Match, Team, WorldCupData } from "@/lib/worldcup/types";
import { getTeamName } from "@/lib/worldcup/analytics";
import type { buildDashboardMetrics, calculateGroupStandings, rankTopScorers } from "@/lib/worldcup/analytics";
import { ScoreInline, formatShortDate, matchName, statusText } from "../primitives";

type Metrics = ReturnType<typeof buildDashboardMetrics>;
type Standings = ReturnType<typeof calculateGroupStandings>;
type TopScorers = ReturnType<typeof rankTopScorers>;

export function OverviewPanel({
  data,
  metrics,
  teamById,
  standings,
  topScorers,
}: {
  data: WorldCupData;
  metrics: Metrics;
  teamById: Map<string, Team>;
  standings: Standings;
  topScorers: TopScorers;
}) {
  const spotlight = metrics.featuredMatch;
  const groups = Object.entries(standings).slice(0, 12);

  return (
    <div className="overview-grid">
      <section className="pitch-card spotlight">
        <div className="section-heading">
          <span>全局焦点</span>
          <strong className={`status-tag ${spotlight?.status ?? ""}`}>
            {spotlight ? statusText(spotlight.status) : "待更新"}
          </strong>
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
                <span>{group}组</span>
                <strong>{getTeamName(teamById, leader.teamId)}</strong>
                <em>
                  {leader.points}分 / {leader.goalDifference >= 0 ? "+" : ""}
                  {leader.goalDifference}
                </em>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pitch-card player-race">
        <div className="section-heading">
          <span>射手榜</span>
          <strong>前六</strong>
        </div>
        <div className="compact-rank">
          {topScorers.slice(0, 6).map((player, index) => (
            <div className="rank-row" key={player.playerId}>
              <span>{index + 1}</span>
              <strong>{player.name}</strong>
              <em>
                {getTeamName(teamById, player.teamId)} · {player.goals}球
              </em>
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

function MatchHero({ match, teamById }: { match: Match; teamById: Map<string, Team> }) {
  return (
    <div className="match-hero">
      <div className="hero-side">
        <span>{matchName(match, teamById, "home")}</span>
        <strong>{match.homeScore ?? "-"}</strong>
      </div>
      <div className="hero-center">
        <em>{formatShortDate(match.utcDate)}</em>
        <ScoreInline match={match} />
        <small>{match.city}</small>
      </div>
      <div className="hero-side">
        <span>{matchName(match, teamById, "away")}</span>
        <strong>{match.awayScore ?? "-"}</strong>
      </div>
      <p>{match.summary}</p>
    </div>
  );
}
