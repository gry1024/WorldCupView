# CloudBase 多人协作和部署方案

## 结论

不要多人共用同一个 CloudBase 控制台扫码登录态，也不要让生产部署依赖某个人当前是否登录。WorldCupView 的生产部署应固定走 GitHub Actions + CloudBase API Key；控制台人工操作应使用腾讯云 CAM 子账号或协作者权限。

## 这次看到的现象

- 截图里的问题是：一个人扫码登录后，另一个人的 CloudBase 控制台或部署登录状态被挤掉。
- 这个现象不会影响当前 GitHub Actions 自动部署。最近的 schedule run 已经连续成功，说明 CI 中的 API Key 部署链路是可用的。
- 本机没有全局 `tcb` 登录依赖；仓库脚本通过 `pnpm --package=@cloudbase/cli dlx tcb` 临时使用 CLI。

## 根因

扫码登录和控制台会话是人的交互登录态，适合个人临时操作，不适合作为团队共用凭据。多人共用同一个主账号或微信扫码状态时，会出现会话互相覆盖、重新登录、权限边界不清、无法审计是谁操作的问题。

部署本身不需要这种扫码态。WorldCupView 已经使用：

- GitHub Actions Secrets 保存 `TCB_ENV_ID` 和 `TCB_CLOUDBASE_API_KEY`。
- `.github/workflows/hourly-update-deploy.yml` 每小时更新数据、构建、验证并部署。
- CloudBase 静态托管子路径 `worldcupview`，保留根路径 `/` 给其他站点。

## 正确方案

1. CI/CD 固定使用 API Key  
   GitHub Actions 是唯一生产自动部署入口。任何人的控制台登录失效，都不应该影响 hourly update 和 CloudBase 发布。

2. 控制台访问使用个人账号  
   主账号给每个成员创建 CAM 子账号或协作者，按最小权限授权 CloudBase 环境访问。不要共享主账号二维码、微信登录态或浏览器会话。

3. 本地部署只用于紧急手动恢复  
   本地需要部署时，使用环境变量传入 API Key，不把密钥写入仓库，也不依赖 `tcb login` 的二维码模式。

4. 密钥轮换  
   如果 API Key 曾经通过聊天、截图或明文发给多人，应在 CloudBase 控制台轮换新 Key，然后更新 GitHub Secrets。

5. 不覆盖根路径  
   所有 WorldCupView 静态资源部署到 `worldcupview` 子路径，禁止使用裸命令部署到根路径。

## 常用命令

查看最近自动部署：

```powershell
gh run list --repo gry1024/WorldCupView --workflow hourly-update-deploy.yml --limit 10
```

手动触发一次自动部署：

```powershell
gh workflow run hourly-update-deploy.yml --repo gry1024/WorldCupView --ref main
```

重新写入 GitHub Secrets，使用 `--body`，不要用管道写入，避免末尾换行进入 secret：

```powershell
gh secret set TCB_ENV_ID --repo gry1024/WorldCupView --body $env:TCB_ENV_ID
gh secret set TCB_CLOUDBASE_API_KEY --repo gry1024/WorldCupView --body $env:TCB_CLOUDBASE_API_KEY
```

紧急手动部署：

```powershell
$env:NEXT_PUBLIC_BASE_PATH="/worldcupview"
pnpm build
pnpm --package=@cloudbase/cli dlx tcb login --cloudbase-api-key $env:TCB_CLOUDBASE_API_KEY -e $env:TCB_ENV_ID
pnpm --package=@cloudbase/cli dlx tcb hosting deploy ./out worldcupview -e $env:TCB_ENV_ID
```
