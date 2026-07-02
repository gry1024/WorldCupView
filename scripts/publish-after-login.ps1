param(
  [string]$RepoName = "WorldCupView",
  [string]$CloudPath = "worldcupview",
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
$tcbCloudBaseApiKey = Require-Env "TCB_CLOUDBASE_API_KEY"

Write-Host "Writing CloudBase secrets to GitHub Actions"
Run { gh secret set TCB_ENV_ID --repo $repoFullName --body $tcbEnvId }
Run { gh secret set TCB_CLOUDBASE_API_KEY --repo $repoFullName --body $tcbCloudBaseApiKey }

if (-not [string]::IsNullOrWhiteSpace($PublicUrl)) {
  $readmePath = Join-Path $gitRoot "README.md"
  $readme = Get-Content -LiteralPath $readmePath -Raw -Encoding UTF8
  $lines = $readme -split "\r?\n"
  if ($lines.Count -gt 0 -and $lines[0].StartsWith("网址：")) {
    $lines[0] = "网址：$PublicUrl"
    $readme = $lines -join [Environment]::NewLine
  } else {
    $readme = "网址：$PublicUrl$([Environment]::NewLine)$([Environment]::NewLine)$readme"
  }
  Set-Content -LiteralPath $readmePath -Value $readme -Encoding UTF8 -NoNewline
  Run { git add README.md }
  Run { git commit -m "docs: update published url" }
  Run { git push }
}

Run { pnpm verify }

if (-not $SkipCloudBaseDeploy) {
  Write-Host "Deploying static site to CloudBase path $CloudPath"
  Run { pnpm --package=@cloudbase/cli dlx tcb login --cloudbase-api-key $tcbCloudBaseApiKey -e $tcbEnvId }
  $normalizedCloudPath = $CloudPath.Trim("/")
  $env:NEXT_PUBLIC_BASE_PATH = "/$normalizedCloudPath"
  Run { pnpm build }
  Run { pnpm --package=@cloudbase/cli dlx tcb hosting deploy ./out $normalizedCloudPath -e $tcbEnvId }
}

Write-Host "Published $repoFullName and deployed CloudBase path $CloudPath"
