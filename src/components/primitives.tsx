import { MapPin } from "lucide-react";
import type { Match, Team } from "@/lib/worldcup/types";
import { getTeamName } from "@/lib/worldcup/analytics";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetSrc(src: string) {
  if (!basePath || !src.startsWith("/")) return src;
  return `${basePath}${src}`;
}

export function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function statusText(status: Match["status"]) {
  if (status === "finished") return "已结束";
  if (status === "live") return "进行中";
  return "未开赛";
}

export function stageText(stage: Match["stage"]) {
  const map: Record<Match["stage"], string> = {
    group: "小组赛",
    round32: "32强",
    round16: "16强",
    quarterfinal: "1/4决赛",
    semifinal: "半决赛",
    third: "季军赛",
    final: "决赛",
  };
  return map[stage] ?? stage;
}

export function betStatusText(status: "open" | "won" | "lost" | "void") {
  if (status === "open") return "待开奖";
  if (status === "won") return "已赢";
  if (status === "lost") return "未中";
  return "已退回";
}

export function matchName(match: Match, teamById: Map<string, Team>, side: "home" | "away") {
  const id = side === "home" ? match.homeTeamId : match.awayTeamId;
  const label = side === "home" ? match.homeTeamLabel : match.awayTeamLabel;
  return getTeamName(teamById, id, label);
}

export function MetricPill({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
  tone?: "default" | "live" | "accent";
}) {
  return (
    <div className={`metric-pill ${tone}`}>
      <Icon size={15} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ScoreInline({ match }: { match: Match }) {
  if (match.status === "upcoming") return <span className="score-inline">VS</span>;
  if (match.status === "live")
    return (
      <span className="score-inline live">
        {match.homeScore ?? 0}:{match.awayScore ?? 0}
      </span>
    );
  return <span className="score-inline">{match.homeScore ?? 0}:{match.awayScore ?? 0}</span>;
}

export function Bar({ label, left, right }: { label: string; left: number; right: number }) {
  const total = Math.max(1, left + right);
  const leftPct = (left / total) * 100;
  return (
    <div className="bar-row">
      <span className="bar-value">{left}</span>
      <div className="bar-track">
        <i style={{ width: `${leftPct}%` }} />
        <b>{label}</b>
      </div>
      <span className="bar-value">{right}</span>
    </div>
  );
}

export function MatchDetailCard({
  match,
  teamById,
  title,
}: {
  match: Match;
  teamById: Map<string, Team>;
  title: string;
}) {
  const scorers = match.scorers ?? [];
  const homeScorers = scorers.filter((scorer) => scorer.teamId === match.homeTeamId);
  const awayScorers = scorers.filter((scorer) => scorer.teamId === match.awayTeamId);

  return (
    <aside className="pitch-card match-detail-card" aria-live="polite">
      <div className="section-heading">
        <span>{title}</span>
        <strong className={`status-tag ${match.status}`}>{statusText(match.status)}</strong>
      </div>
      <div className="detail-scoreline">
        <strong>{matchName(match, teamById, "home")}</strong>
        <ScoreInline match={match} />
        <strong>{matchName(match, teamById, "away")}</strong>
      </div>
      <div className="detail-meta">
        <span>{formatShortDate(match.utcDate)}</span>
        <span>{match.venue}</span>
        <span>
          <MapPin size={12} /> {match.city}
        </span>
      </div>
      <p className="detail-summary">{match.summary}</p>

      {scorers.length > 0 && (
        <div className="detail-scorers" aria-label="进球时间线">
          <div className="scorer-col">
            {homeScorers.map((scorer, index) => (
              <div className="scorer-line" key={`h-${index}`}>
                <span className="scorer-minute">{scorer.minute}&apos;</span>
                <span>{scorer.playerName ?? "未命名"}</span>
              </div>
            ))}
          </div>
          <div className="scorer-col away">
            {awayScorers.map((scorer, index) => (
              <div className="scorer-line" key={`a-${index}`}>
                <span>{scorer.playerName ?? "未命名"}</span>
                <span className="scorer-minute">{scorer.minute}&apos;</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="detail-highlights">
        {match.highlights.slice(0, 4).map((highlight) => (
          <span key={highlight}>{highlight}</span>
        ))}
      </div>
      {match.stats && (
        <div className="detail-stats" aria-label="射门控球统计">
          <Bar label="射门" left={match.stats.homeShots} right={match.stats.awayShots} />
          <Bar label="射正" left={match.stats.homeShotsOnTarget} right={match.stats.awayShotsOnTarget} />
          <Bar label="控球" left={match.stats.homePossession} right={match.stats.awayPossession} />
          <Bar label="角球" left={match.stats.homeCorners} right={match.stats.awayCorners} />
        </div>
      )}
    </aside>
  );
}
