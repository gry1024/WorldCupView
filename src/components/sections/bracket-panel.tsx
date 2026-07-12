import { useMemo, useState } from "react";
import type { Team } from "@/lib/worldcup/types";
import type { buildBracketRounds } from "@/lib/worldcup/analytics";
import { MatchDetailCard, ScoreInline, formatShortDate, matchName, stageText } from "../primitives";

type Rounds = ReturnType<typeof buildBracketRounds>;

export function BracketPanel({ rounds, teamById }: { rounds: Rounds; teamById: Map<string, Team> }) {
  const allMatches = useMemo(() => rounds.flatMap((round) => round.matches), [rounds]);
  const [selectedMatchId, setSelectedMatchId] = useState(allMatches[0]?.id ?? "");
  const selectedMatch = allMatches.find((match) => match.id === selectedMatchId) ?? allMatches[0];

  return (
    <div className="bracket-board">
      <div className="bracket-rounds" aria-label="世界杯淘汰赛对阵图">
        {rounds.map((round) => (
          <section className="bracket-round" key={round.stage}>
            <div className="round-title">{round.label}</div>
            <div className="bracket-list">
              {round.matches.slice(0, round.stage === "round32" ? 16 : 8).map((match) => (
                <button
                  type="button"
                  className={`bracket-match ${match.status} ${match.id === selectedMatch?.id ? "selected" : ""}`}
                  key={match.id}
                  aria-pressed={match.id === selectedMatch?.id}
                  onClick={() => setSelectedMatchId(match.id)}
                >
                  <span className="bracket-date">{formatShortDate(match.utcDate)}</span>
                  <strong className="bracket-side">{matchName(match, teamById, "home")}</strong>
                  <ScoreInline match={match} />
                  <strong className="bracket-side">{matchName(match, teamById, "away")}</strong>
                  <em className="bracket-stage">{stageText(match.stage)}</em>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      {selectedMatch && <MatchDetailCard match={selectedMatch} teamById={teamById} title="对阵详情" />}
    </div>
  );
}
