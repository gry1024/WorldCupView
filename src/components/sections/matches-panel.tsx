import { useMemo, useState } from "react";
import { Clock3, Radio, Trophy } from "lucide-react";
import type { Match, Team } from "@/lib/worldcup/types";
import { Bar, MatchDetailCard, ScoreInline, formatShortDate, matchName, stageText, statusText } from "../primitives";

export function MatchesPanel({
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
  const fallbackMatches = useMemo(
    () => (live.length ? live : upcoming.length ? upcoming : finished),
    [finished, live, upcoming],
  );
  const allMatches = useMemo(() => [...live, ...finished, ...upcoming], [finished, live, upcoming]);
  const [selectedMatchId, setSelectedMatchId] = useState(fallbackMatches[0]?.id ?? "");
  const selectedMatch = allMatches.find((match) => match.id === selectedMatchId) ?? fallbackMatches[0];

  return (
    <div className="matches-grid">
      <MatchColumn
        title="进行中"
        icon={Radio}
        matches={live.length ? live : upcoming.slice(0, 2)}
        selectedMatchId={selectedMatch?.id}
        teamById={teamById}
        onSelectMatch={setSelectedMatchId}
      />
      <MatchColumn
        title="已结束"
        icon={Trophy}
        matches={finished}
        selectedMatchId={selectedMatch?.id}
        teamById={teamById}
        onSelectMatch={setSelectedMatchId}
      />
      <MatchColumn
        title="即将进行"
        icon={Clock3}
        matches={upcoming}
        selectedMatchId={selectedMatch?.id}
        teamById={teamById}
        onSelectMatch={setSelectedMatchId}
      />
      {selectedMatch && <MatchDetailCard match={selectedMatch} teamById={teamById} title="比赛详报" />}
    </div>
  );
}

function MatchColumn({
  title,
  icon: Icon,
  matches,
  selectedMatchId,
  teamById,
  onSelectMatch,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  matches: Match[];
  selectedMatchId?: string;
  teamById: Map<string, Team>;
  onSelectMatch: (matchId: string) => void;
}) {
  return (
    <section className="match-column">
      <div className="column-title">
        <Icon size={16} />
        <span>{title}</span>
        <em>{matches.length}</em>
      </div>
      {matches.slice(0, 8).map((match) => (
        <button
          type="button"
          className={match.id === selectedMatchId ? "match-card selected" : "match-card"}
          key={match.id}
          aria-pressed={match.id === selectedMatchId}
          onClick={() => onSelectMatch(match.id)}
        >
          <div className="match-card-head">
            <span>{formatShortDate(match.utcDate)}</span>
            <em>{stageText(match.stage)}</em>
          </div>
          <div className="match-line">
            <strong>{matchName(match, teamById, "home")}</strong>
            <ScoreInline match={match} />
            <strong>{matchName(match, teamById, "away")}</strong>
          </div>
          <p>{match.summary}</p>
          <div className="highlight-chips" aria-label="比赛亮点">
            {match.highlights.slice(0, 2).map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
          {match.stats && (
            <div className="stat-bars">
              <Bar label="射门" left={match.stats.homeShots} right={match.stats.awayShots} />
              <Bar label="射正" left={match.stats.homeShotsOnTarget} right={match.stats.awayShotsOnTarget} />
            </div>
          )}
          <div className={`match-status ${match.status}`}>{statusText(match.status)}</div>
        </button>
      ))}
    </section>
  );
}
