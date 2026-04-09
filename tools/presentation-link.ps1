$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$activeFile = Join-Path $repoRoot 'presentations\ACTIVE_PRESENTATION.txt'

if(-not (Test-Path $activeFile)){
  Write-Host 'No active presentation link file was found.'
  exit 1
}

$slug = (Get-Content $activeFile -Raw).Trim()
if([string]::IsNullOrWhiteSpace($slug)){
  Write-Host 'There is no active presentation right now.'
  exit 1
}

$url = "https://mynewhouseori.github.io/NFC-DEMO01/presentations/$slug/"
Write-Host ''
Write-Host 'Current presentation link:'
Write-Host $url
Write-Host ''

try {
  Set-Clipboard -Value $url
  Write-Host 'The link was copied to the clipboard.'
} catch {
  Write-Host 'Could not copy automatically, but the link is shown above.'
}
