import Image from "next/image";
import type { Match, Standing, Team } from "@/lib/worldcup/types";
import type { calculateGroupStandings } from "@/lib/worldcup/analytics";
import { getTeamName } from "@/lib/worldcup/analytics";
import { ScoreInline, assetSrc, formatShortDate, matchName, statusText } from "../primitives";

type Standings = ReturnType<typeof calculateGroupStandings>;

export function TeamsPanel({
  teams,
  selectedTeam,
  selectedTeamMatches,
  teamById,
  standings,
  onSelectTeam,
}: {
  teams: Team[];
  selectedTeam?: Team;
  selectedTeamMatches: Match[];
  teamById: Map<string, Team>;
  standings: Standings;
  onSelectTeam: (teamId: string) => void;
}) {
  if (!selectedTeam) return null;

  const orderedTeams = [...teams].sort((a, b) => a.group.localeCompare(b.group) || a.fifaRank - b.fifaRank);
  const groupStandings = standings[selectedTeam.group] ?? [];
  const palette = selectedTeam.palette ?? ["#0B6E4F", "#0B6E4F"];

  return (
    <div className="teams-grid">
      <section className="team-selector" aria-label="国家队列表">
        {orderedTeams.map((team) => (
          <button
            key={team.id}
            type="button"
            className={team.id === selectedTeam.id ? "team-button selected" : "team-button"}
            onClick={() => onSelectTeam(team.id)}
            aria-pressed={team.id === selectedTeam.id}
          >
            <span>{team.flag}</span>
            <strong>{team.name}</strong>
            <em>{team.group}组</em>
          </button>
        ))}
      </section>

      <section className="pitch-card team-detail">
        <div
          className="team-crest"
          style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1] ?? palette[0]})` }}
        >
          {selectedTeam.flagImage && (
            <Image src={assetSrc(selectedTeam.flagImage)} alt={selectedTeam.name} width={84} height={56} unoptimized />
          )}
        </div>
        <div className="team-detail-body">
          <p className="eyebrow">国家队全景</p>
          <h2>{selectedTeam.name}</h2>
          <div className="team-facts">
            <span>FIFA #{selectedTeam.fifaRank}</span>
            <span>{selectedTeam.confederation}</span>
            <span>{selectedTeam.group}组</span>
            <span>世界杯履历：{selectedTeam.bestFinish}</span>
            {selectedTeam.titles > 0 && <span>夺冠 {selectedTeam.titles} 次</span>}
          </div>
          {selectedTeam.coach && selectedTeam.coach !== "官方名单待更新" && (
            <div className="team-coach">主教练：{selectedTeam.coach}</div>
          )}
          {selectedTeam.starPlayers.length > 0 && (
            <div className="team-stars">核心球员：{selectedTeam.starPlayers.join(" · ")}</div>
          )}
          <p className="team-story">{selectedTeam.story}</p>
        </div>
      </section>

      <section className="pitch-card team-standings">
        <div className="section-heading">
          <span>{selectedTeam.group} 组积分</span>
          <strong>{groupStandings.length} 队</strong>
        </div>
        <table className="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>球队</th>
              <th>赛</th>
              <th>胜</th>
              <th>平</th>
              <th>负</th>
              <th>净胜</th>
              <th>积分</th>
            </tr>
          </thead>
          <tbody>
            {groupStandings.map((row, index) => (
              <StandingRow
                key={row.teamId}
                row={row}
                rank={index + 1}
                teamName={getTeamName(teamById, row.teamId)}
                highlighted={row.teamId === selectedTeam.id}
              />
            ))}
          </tbody>
        </table>
      </section>

      <section className="pitch-card team-timeline">
        <div className="section-heading">
          <span>本届对阵</span>
          <strong>{selectedTeamMatches.length} 场</strong>
        </div>
        {selectedTeamMatches.map((match) => (
          <div className="team-match" key={match.id}>
            <span>{formatShortDate(match.utcDate)}</span>
            <strong>
              {matchName(match, teamById, "home")} <ScoreInline match={match} /> {matchName(match, teamById, "away")}
            </strong>
            <em className={`status-tag ${match.status}`}>{statusText(match.status)}</em>
          </div>
        ))}
      </section>
    </div>
  );
}

function StandingRow({
  row,
  rank,
  teamName,
  highlighted,
}: {
  row: Standing;
  rank: number;
  teamName: string;
  highlighted: boolean;
}) {
  return (
    <tr className={highlighted ? "highlighted" : ""}>
      <td>{rank}</td>
      <td>{teamName}</td>
      <td>{row.played}</td>
      <td>{row.wins}</td>
      <td>{row.draws}</td>
      <td>{row.losses}</td>
      <td>
        {row.goalDifference >= 0 ? "+" : ""}
        {row.goalDifference}
      </td>
      <td>
        <strong>{row.points}</strong>
      </td>
    </tr>
  );
}
