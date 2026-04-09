$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$presentationsRoot = Join-Path $repoRoot 'presentations'
$activeFile = Join-Path $presentationsRoot 'ACTIVE_PRESENTATION.txt'
$gitExe = 'C:\Program Files\Git\cmd\git.exe'

if(-not (Test-Path $activeFile)){
  Write-Host 'No active presentation file was found.'
  exit 1
}

$slug = (Get-Content $activeFile -Raw).Trim()
if([string]::IsNullOrWhiteSpace($slug)){
  Write-Host 'There is no active presentation to disable.'
  exit 1
}

$targetDir = Join-Path $presentationsRoot $slug
$resolvedPresentationsRoot = [System.IO.Path]::GetFullPath($presentationsRoot)
$resolvedTargetDir = [System.IO.Path]::GetFullPath($targetDir)

if(-not $resolvedTargetDir.StartsWith($resolvedPresentationsRoot, [System.StringComparison]::OrdinalIgnoreCase)){
  throw "Refusing to remove a path outside the presentations folder: $resolvedTargetDir"
}

if(-not (Test-Path $targetDir)){
  Write-Host "The presentation folder does not exist anymore: $slug"
} else {
  Remove-Item -LiteralPath $targetDir -Recurse -Force
  Write-Host "Removed presentation folder: $slug"
}

Set-Content -LiteralPath $activeFile -Value '' -NoNewline

Push-Location $repoRoot
try {
  & $gitExe add --all presentations
  $status = & $gitExe status --short -- presentations
  if(-not $status){
    Write-Host 'No git changes were detected for presentations.'
    exit 0
  }

  & $gitExe commit -m "Disable temporary presentation link"
  & $gitExe push origin main
} finally {
  Pop-Location
}

Write-Host ''
Write-Host 'The temporary presentation link was disabled and pushed to main.'
