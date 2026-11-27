<#
  宇宙无敌背景 · 一行安装脚本

  用法（Windows PowerShell 5.1 或 PowerShell 7，一行）：
    $r=(iwr https://gcore.jsdelivr.net/gh/wescien/dsh-lucien-background@main/install.ps1 -UseBasicParsing).Content;
    if($r -is [byte[]]){$r=[Text.Encoding]::UTF8.GetString($r)}; iex $r.TrimStart([char]0xFEFF)

  或者已经下载到本地：
    powershell -ExecutionPolicy Bypass -File install.ps1

  它做四件事：
    1. 把插件文件下载到 <DSH_HOME>\plugins\aurora-background
    2. 在每个 profile 的 package.json 里登记依赖 @local/aurora-background
    3. 把 @local/aurora-background 加进 dsh.profile.bundles
    4. 在 profile 的 node_modules\@local 下建 junction，让加载器找得到它

  已有的配置不会被覆盖：重复运行只会补齐缺的部分。装完重启 DSH 桌面端即可。
#>

[CmdletBinding()]
param(
  [string] $DshHome,
  [string] $PluginDir,
  [string] $Ref = 'main',
  [string] $Repo = 'wescien/dsh-lucien-background'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$PackageName = '@local/aurora-background'
$Files = @(
  'client.js',
  'index.js',
  'package.json',
  'cordis.patch.yml',
  'README.md',
  'LICENSE',
  'icon.svg',
  'locale/zh.json',
  'locale/en.json'
)

function Write-Step($text) { Write-Host "  $text" -ForegroundColor DarkGray }

if (-not $DshHome) {
  $DshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }
}
if (-not (Test-Path $DshHome)) {
  throw "找不到 DSH 目录：$DshHome（先启动一次 DSH 桌面端再运行这个脚本）"
}
if (-not $PluginDir) { $PluginDir = Join-Path $DshHome 'plugins\aurora-background' }

Write-Host ''
Write-Host '宇宙无敌背景 · 安装' -ForegroundColor Cyan
Write-Host "DSH 目录   $DshHome"
Write-Host "插件目录   $PluginDir"
Write-Host ''

# ---------- 1. 下载插件文件 ----------
# 一次拉整包 zip：比逐个文件打 GitHub API 快，也不会撞到匿名 API 的 60 次/小时限流。
New-Item -ItemType Directory -Force -Path $PluginDir | Out-Null

$zipUrl = "https://codeload.github.com/$Repo/zip/refs/heads/$Ref"
$work = Join-Path ([System.IO.Path]::GetTempPath()) ("cosmic-bg-" + [guid]::NewGuid().ToString('N'))
$zip = "$work.zip"
New-Item -ItemType Directory -Force -Path $work | Out-Null
try {
  Invoke-WebRequest -Uri $zipUrl -OutFile $zip -UseBasicParsing
  Expand-Archive -Path $zip -DestinationPath $work -Force
} catch {
  throw "下载源码包失败：$($_.Exception.Message)。检查网络，或手动下载 $Repo 解压到 $PluginDir"
}

$root = Get-ChildItem $work -Directory | Select-Object -First 1
if (-not $root) { throw "源码包解压后是空的：$zip" }

$downloaded = 0
foreach ($file in $Files) {
  $source = Join-Path $root.FullName ($file -replace '/', '\')
  if (-not (Test-Path $source)) { throw "源码包里缺少 $file（是不是分支名写错了？当前 $Ref）" }
  $target = Join-Path $PluginDir ($file -replace '/', '\')
  $parent = Split-Path -Parent $target
  if ($parent -and -not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
  Copy-Item -LiteralPath $source -Destination $target -Force
  $downloaded += 1
}
Remove-Item $zip -Force -ErrorAction SilentlyContinue
Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
Write-Step "已安装 $downloaded 个文件"

# ---------- 2/3/4. 登记到每个 profile ----------
$profilesRoot = Join-Path $DshHome 'profiles'
if (-not (Test-Path $profilesRoot)) {
  throw "找不到 profiles 目录：$profilesRoot（先启动一次 DSH 桌面端）"
}

$profiles = Get-ChildItem $profilesRoot -Directory
$patched = @()
foreach ($profile in $profiles) {
  $manifestPath = Join-Path $profile.FullName 'package.json'
  if (-not (Test-Path $manifestPath)) { continue }

  $raw = Get-Content $manifestPath -Raw -Encoding UTF8
  $json = $raw | ConvertFrom-Json
  if (-not $json.dsh -or -not $json.dsh.profile) { continue }

  $changed = $false

  # dependencies
  if (-not $json.dependencies) {
    $json | Add-Member -NotePropertyName dependencies -NotePropertyValue ([pscustomobject]@{})
  }
  $linkSpec = 'link:' + ($PluginDir -replace '\\', '/')
  if ($json.dependencies.PSObject.Properties.Name -contains $PackageName) {
    if ($json.dependencies.$PackageName -ne $linkSpec) {
      $json.dependencies.$PackageName = $linkSpec
      $changed = $true
    }
  } else {
    $json.dependencies | Add-Member -NotePropertyName $PackageName -NotePropertyValue $linkSpec
    $changed = $true
  }

  # dsh.profile.bundles
  $bundles = @($json.dsh.profile.bundles)
  if ($bundles -notcontains $PackageName) {
    $json.dsh.profile.bundles = @($bundles + $PackageName)
    $changed = $true
  }

  if ($changed) {
    Copy-Item $manifestPath "$manifestPath.bak" -Force
    # PowerShell 5.1 的 ConvertTo-Json 会在冒号后留两个空格，顺手抹平。
    $text = ($json | ConvertTo-Json -Depth 32) -replace '":  ', '": '
    [System.IO.File]::WriteAllText($manifestPath, $text + "`n", (New-Object System.Text.UTF8Encoding($false)))
    Write-Step "$($profile.Name)：已写入依赖与 bundles"
  } else {
    Write-Step "$($profile.Name)：已登记，跳过"
  }

  # node_modules junction
  $localDir = Join-Path $profile.FullName 'node_modules\@local'
  $linkPath = Join-Path $localDir 'aurora-background'
  if (-not (Test-Path $localDir)) { New-Item -ItemType Directory -Force -Path $localDir | Out-Null }
  $existing = Get-Item $linkPath -Force -ErrorAction SilentlyContinue
  if ($existing) {
    if ($existing.LinkType) {
      if ($existing.Target -ne $PluginDir) {
        Remove-Item $linkPath -Force -Recurse
        New-Item -ItemType Junction -Path $linkPath -Target $PluginDir | Out-Null
        Write-Step "$($profile.Name)：更新 junction"
      }
    } else {
      Write-Step "$($profile.Name)：node_modules 里已有实体目录，未改动"
    }
  } else {
    New-Item -ItemType Junction -Path $linkPath -Target $PluginDir | Out-Null
    Write-Step "$($profile.Name)：已创建 junction"
  }

  $patched += $profile.Name
}

if ($patched.Count -eq 0) {
  throw "没有找到可用的 profile（profiles 下没有带 dsh.profile 的 package.json）"
}

# ---------- 校验 ----------
$ok = Test-Path (Join-Path $PluginDir 'client.js')
Write-Host ''
if ($ok) {
  $version = (Get-Content (Join-Path $PluginDir 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json).version
  Write-Host "安装完成：$PackageName v$version" -ForegroundColor Green
  Write-Host "改动的 profile：$($patched -join '、')"
  Write-Host '现在重启 DSH 桌面端，打开 设置 → 宇宙无敌背景 就能看到。' -ForegroundColor Green
} else {
  Write-Host '安装似乎没完成：插件目录里没有 client.js' -ForegroundColor Yellow
}
Write-Host ''
