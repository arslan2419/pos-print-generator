# Watches a folder for new PDF receipts and prints them on the office thermal printer.
# Use noscale so 80mm PDFs map 1:1 to paper (no fit-to-page shrinking).

param(
    [string]$WatchFolder = "$env:USERPROFILE\Downloads",
    [string]$PrinterName = "SpeedX 400",
    [string]$SumatraPath = "C:\Program Files\SumatraPDF\SumatraPDF.exe"
)

$printArgs = @(
    "-print-to", $PrinterName,
    "-print-settings", "noscale,portrait",
    "-silent"
)

if (-not (Test-Path $SumatraPath)) {
    Write-Error "SumatraPDF not found at $SumatraPath"
    exit 1
}

Write-Host "Watching $WatchFolder for fuel-receipt PDFs → $PrinterName (noscale)"

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $WatchFolder
$watcher.Filter = "fuel-receipt*.pdf"
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true

Register-ObjectEvent $watcher Created -Action {
    $path = $Event.SourceEventArgs.FullPath
    Start-Sleep -Seconds 1
    if (Test-Path $path) {
        & $using:SumatraPath @using:printArgs $path
        Write-Host "Printed: $path"
    }
} | Out-Null

while ($true) { Start-Sleep -Seconds 5 }
