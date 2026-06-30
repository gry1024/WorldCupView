网址：CloudBase 子域名待绑定；默认部署路径 `/worldcupview`；本地预览 `http://127.0.0.1:3100/`

# WorldCupView

WorldCupView 是 2026 美加墨世界杯一屏式信息网站，覆盖赛程比分、完整淘汰赛对阵图、射手榜、国家队详情、全球新闻/舆情、支持率和模拟金币投注。

## 功能

- 顶部状态栏 + 侧边功能栏，所有主栏目在单屏内完成核心信息展示。
- 赛程：已结束、进行中、即将开赛、比分、场馆、摘要、射门/射正等技术统计。
- 对阵图：32 强到决赛的淘汰赛路径。
- 球员：知名球员头像、进球、射门、射正、xG。
- 球队：48 队入口，可查看每支国家队世界杯履历和本届对阵。
- 舆情：新闻观点、支持率、情绪和全球声量。
- 模拟投注：本地注册钱包，初始 1000 模拟金币，按赔率投注胜平负。
- 数据：`pnpm update:data` 拉取公开赛程/比分与新闻源，GitHub Actions 每小时自动刷新。

## 开发

```bash
pnpm install
pnpm update:data
pnpm dev -H 127.0.0.1 -p 3100
```

## 验证

```bash
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

## 部署

项目静态导出到 `out/`，避免覆盖 CloudBase 根域名，默认上传到 `/worldcupview`。

GitHub 仓库 secrets：

- `TCB_ENV_ID`
- `TCB_SECRET_ID`
- `TCB_SECRET_KEY`

手动部署：

```bash
pnpm build
npm install -g @cloudbase/cli
tcb login --apiKeyId "$TCB_SECRET_ID" --apiKey "$TCB_SECRET_KEY"
tcb hosting deploy ./out /worldcupview -e "$TCB_ENV_ID"
```

登录和密钥环境变量准备好后，可一键开源并部署：

```powershell
$env:TCB_ENV_ID="your-cloudbase-env-id"
$env:TCB_SECRET_ID="your-tencent-secret-id"
$env:TCB_SECRET_KEY="your-tencent-secret-key"
gh auth login -h github.com
pnpm publish:after-login -- -PublicUrl "https://your-subdomain.example.com/worldcupview/"
```

## 数据源

- WorldCup26 public API：球队、赛程、比分、射手。
- GDELT / Google News RSS：全球新闻观点和情绪信号。
- 缺失的射门、控球和赔率字段由 WorldCupView 根据比分、排名和队伍强弱生成可复现估算，仅用于信息展示和模拟玩法。
