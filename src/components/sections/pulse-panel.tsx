import { useMemo, useState } from "react";
import type { Team, WorldCupData } from "@/lib/worldcup/types";

export function PulsePanel({ data, teamById }: { data: WorldCupData; teamById: Map<string, Team> }) {
  const signals = useMemo(
    () => [...data.social].sort((a, b) => b.supportPercent - a.supportPercent).slice(0, 16),
    [data.social],
  );
  const [selectedTeamId, setSelectedTeamId] = useState(signals[0]?.teamId ?? "");
  const selectedSignal = signals.find((signal) => signal.teamId === selectedTeamId) ?? signals[0];
  const selectedTeam = selectedSignal ? teamById.get(selectedSignal.teamId) : undefined;

  return (
    <div className="pulse-grid">
      <section className="support-map">
        <div className="section-heading">
          <span>支持率排行</span>
          <strong>{signals.length} 队</strong>
        </div>
        {signals.map((signal) => (
          <button
            type="button"
            className={signal.teamId === selectedSignal?.teamId ? "support-cell selected" : "support-cell"}
            key={signal.teamId}
            aria-pressed={signal.teamId === selectedSignal?.teamId}
            onClick={() => setSelectedTeamId(signal.teamId)}
          >
            <span>{teamById.get(signal.teamId)?.flag}</span>
            <strong>{teamById.get(signal.teamId)?.name}</strong>
            <div className="support-bar">
              <i style={{ width: `${signal.supportPercent}%` }} />
            </div>
            <em>
              {signal.supportPercent}% · {signal.sentiment >= 0 ? "积极" : "承压"}
            </em>
          </button>
        ))}
      </section>
      {selectedSignal && (
        <section className="pitch-card pulse-detail">
          <div className="section-heading">
            <span>社媒情绪详情</span>
            <strong>{selectedTeam?.name ?? "球队"}</strong>
          </div>
          <div className="pulse-spotlight">
            <span className="pulse-flag">{selectedTeam?.flag}</span>
            <h2>{selectedTeam?.name}</h2>
            <strong className="pulse-support">{selectedSignal.supportPercent}% 支持率</strong>
            <p>{selectedSignal.headline}</p>
            <div className="pulse-numbers">
              <b>声量 {selectedSignal.volume.toLocaleString("zh-CN")}</b>
              <b>
                情绪 {selectedSignal.sentiment >= 0 ? "+" : ""}
                {selectedSignal.sentiment.toFixed(2)}
              </b>
            </div>
          </div>
        </section>
      )}
      <section className="pitch-card pulse-news">
        <div className="section-heading">
          <span>值得关注的全球观点</span>
          <strong>新闻 + 社媒声量</strong>
        </div>
        {data.news.slice(0, 10).map((item) => (
          <a className="pulse-headline" href={item.url} key={item.id} target="_blank" rel="noreferrer">
            <span>来源：{item.source}</span>
            <strong>{item.title}</strong>
            <em className={item.tone >= 0 ? "tone-positive" : "tone-negative"}>
              {item.tone >= 0 ? "情绪偏正" : "情绪偏负"}
            </em>
          </a>
        ))}
      </section>
    </div>
  );
}
