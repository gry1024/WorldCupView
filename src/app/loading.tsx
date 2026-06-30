export default function Loading() {
  return (
    <div className="loading-shell">
      <div className="rolling-loader">
        <div className="rolling-ball" aria-hidden="true" />
        <div className="grass-track" aria-hidden="true" />
        <span>WorldCupView 正在刷新比赛数据</span>
      </div>
    </div>
  );
}
