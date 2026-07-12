import { useState } from "react";
import Image from "next/image";
import type { Team } from "@/lib/worldcup/types";
import type { rankTopScorers } from "@/lib/worldcup/analytics";
import { getTeamName } from "@/lib/worldcup/analytics";
import { assetSrc } from "../primitives";

type TopScorers = ReturnType<typeof rankTopScorers>;

export function PlayersPanel({ topScorers, teams }: { topScorers: TopScorers; teams: Map<string, Team> }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(topScorers[0]?.playerId ?? "");
  const selectedPlayer = topScorers.find((player) => player.playerId === selectedPlayerId) ?? topScorers[0];

  return (
    <div className="players-grid">
      {selectedPlayer && (
        <section className="pitch-card player-leader">
          <Image
            src={assetSrc(selectedPlayer.image)}
            alt={selectedPlayer.name}
            width={160}
            height={160}
            unoptimized
            priority
          />
          <div className="player-leader-info">
            <p className="eyebrow">球员档案</p>
            <h2>{selectedPlayer.name}</h2>
            <strong>
              {selectedPlayer.goals} 球 · {teams.get(selectedPlayer.teamId)?.name}
            </strong>
            <span>
              {selectedPlayer.assists} 助攻 / {selectedPlayer.shotsOnTarget} 射正 / xG{" "}
              {selectedPlayer.xg.toFixed(2)}
            </span>
            <small>点击右侧射手榜切换球员，照片为真实公开图库资源</small>
          </div>
        </section>
      )}
      <section className="pitch-card scorer-table">
        <div className="section-heading">
          <span>射手榜</span>
          <strong>{topScorers.length} 人</strong>
        </div>
        {topScorers.map((player, index) => (
          <button
            type="button"
            className={player.playerId === selectedPlayer?.playerId ? "scorer-row selected" : "scorer-row"}
            key={player.playerId}
            aria-pressed={player.playerId === selectedPlayer?.playerId}
            onClick={() => setSelectedPlayerId(player.playerId)}
          >
            <span className="rank-num">{index + 1}</span>
            <Image
              src={assetSrc(player.image)}
              alt={player.name}
              width={34}
              height={34}
              unoptimized
              loading="eager"
            />
            <strong>{player.name}</strong>
            <em>{teams.get(player.teamId)?.name ?? getTeamName(teams, player.teamId)}</em>
            <b>{player.goals}球</b>
            <div className="mini-meter" aria-hidden="true">
              <i style={{ width: `${Math.min(100, player.shotsOnTarget * 13)}%` }} />
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}
