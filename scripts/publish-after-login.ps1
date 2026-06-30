param(
  [string]$RepoName = "WorldCupView",
  [string]$CloudPath = "/worldcupview",
  [string]$PublicUrl = "",
  [switch]$SkipCloudBaseDeploy
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found in PATH."
  }
}

function Require-Env {
  param([string]$Name)
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Required environment variable '$Name' is missing."
  }
  return $value
}

function Run {
  param([scriptblock]$Command)
  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE"
  }
}

Require-Command "git"
Require-Command "gh"
Require-Command "pnpm"

$gitRoot = (git rev-parse --show-toplevel).Trim()
Set-Location $gitRoot

$status = (git status --porcelain)
if (-not [string]::IsNullOrWhiteSpace($status)) {
  throw "Working tree is not clean. Commit or stash changes before publishing."
}

Run { gh auth status }
$owner = (gh api user --jq ".login").Trim()
if ([string]::IsNullOrWhiteSpace($owner)) {
  throw "Could not determine GitHub owner from gh auth."
}

$repoFullName = "$owner/$RepoName"
$originUrl = "https://github.com/$repoFullName.git"

Write-Host "Publishing GitHub repository $repoFullName"
if (-not (gh repo view $repoFullName 2>$null)) {
  Run { gh repo create $repoFullName --public --description "WorldCupView - 2026 World Cup dashboard, bracket, teams, news, sentiment, and simulated betting." }
}

if (git remote get-url origin 2>$null) {
  Run { git remote set-url origin $originUrl }
} else {
  Run { git remote add origin $originUrl }
}

Run { git push -u origin main }

$tcbEnvId = Require-Env "TCB_ENV_ID"
$tcbSecretId = Require-Env "TCB_SECRET_ID"
$tcbSecretKey = Require-Env "TCB_SECRET_KEY"

Write-Host "Writing CloudBase secrets to GitHub Actions"
$tcbEnvId | gh secret set TCB_ENV_ID --repo $repoFullName
if ($LASTEXITCODE -ne 0) { throw "Failed to set TCB_ENV_ID secret." }
$tcbSecretId | gh secret set TCB_SECRET_ID --repo $repoFullName
if ($LASTEXITCODE -ne 0) { throw "Failed to set TCB_SECRET_ID secret." }
$tcbSecretKey | gh secret set TCB_SECRET_KEY --repo $repoFullName
if ($LASTEXITCODE -ne 0) { throw "Failed to set TCB_SECRET_KEY secret." }

if (-not [string]::IsNullOrWhiteSpace($PublicUrl)) {
  $readmePath = Join-Path $gitRoot "README.md"
  $readme = Get-Content -LiteralPath $readmePath -Raw -Encoding UTF8
  $readme = $readme -replace "^网址：.*", "网址：$PublicUrl"
  Set-Content -LiteralPath $readmePath -Value $readme -Encoding UTF8 -NoNewline
  Run { git add README.md }
  Run { git commit -m "docs: update published url" }
  Run { git push }
}

Run { pnpm verify }

if (-not $SkipCloudBaseDeploy) {
  Write-Host "Deploying static site to CloudBase path $CloudPath"
  Run { pnpm --package=@cloudbase/cli dlx tcb login --apiKeyId $tcbSecretId --apiKey $tcbSecretKey }
  Run { pnpm build }
  Run { pnpm --package=@cloudbase/cli dlx tcb hosting deploy ./out $CloudPath -e $tcbEnvId }
}

Write-Host "Published $repoFullName and deployed CloudBase path $CloudPath"
