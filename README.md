网址：https://groy-env-d5g7okht7dcd202fe-1401196005.tcloudbaseapp.com/worldcupview/

# WorldCupView

WorldCupView 是一个面向 2026 美加墨世界杯的一屏式信息网站，覆盖赛程比分、淘汰赛对阵图、射手榜、国家队档案、全球新闻舆情、支持率和模拟金币投注。

## 功能

- 顶部状态栏和侧边功能栏，核心信息优先在单屏内完成总览。
- 赛程：已结束、进行中、即将开始、比分、场馆、摘要、射门和射正等技术统计。
- 对阵图：从 32 强到决赛的淘汰赛路径。
- 球员：知名球员真实照片、进球、射门、射正和 xG。
- 球队：国家队入口、世界杯历史和本届对阵记录。
- 舆情：全球新闻观点、支持率、情绪和关注热度。
- 模拟投注：本地注册钱包，初始 1000 模拟金币，按赔率投注胜平负。
- 数据更新：`pnpm update:data` 拉取公开赛程、比分、新闻源并生成可复现的补充统计；GitHub Actions 每小时自动刷新并部署。

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

项目静态导出到 `out/`，CloudBase 静态托管目标路径固定为 `worldcupview`，不会覆盖环境根路径 `/`。

GitHub 仓库需要配置以下 Actions Secrets：

- `TCB_ENV_ID`
- `TCB_CLOUDBASE_API_KEY`

手动部署示例：

```powershell
$env:NEXT_PUBLIC_BASE_PATH="/worldcupview"
$env:TCB_ENV_ID="your-cloudbase-env-id"
$env:TCB_CLOUDBASE_API_KEY="your-cloudbase-api-key"
pnpm build
pnpm --package=@cloudbase/cli dlx tcb login --cloudbase-api-key $env:TCB_CLOUDBASE_API_KEY -e $env:TCB_ENV_ID
pnpm --package=@cloudbase/cli dlx tcb hosting deploy ./out worldcupview -e $env:TCB_ENV_ID
```

发布到 GitHub 并写入 CloudBase Secrets：

```powershell
$env:TCB_ENV_ID="your-cloudbase-env-id"
$env:TCB_CLOUDBASE_API_KEY="your-cloudbase-api-key"
gh auth login -h github.com
pnpm publish:after-login -- -PublicUrl "https://your-subdomain.example.com/worldcupview/"
```

CloudBase 多人协作不要共用同一个扫码登录态。CI/CD 使用 GitHub Secrets 中的 API Key；控制台访问应使用腾讯云 CAM 子账号或协作者授权。详情见 [docs/cloudbase-collaboration.md](docs/cloudbase-collaboration.md)。

## 数据源

- WorldCup26 public API：球队、赛程、比分、射手。
- GDELT / Google News RSS：全球新闻观点和情绪信号。
- 缺失的射门、控球和赔率字段由 WorldCupView 根据比分、排名和球队强弱生成可复现估算，仅用于信息展示和模拟玩法。
