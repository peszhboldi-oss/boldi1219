param([string]$BackupPath)
$ErrorActionPreference='Stop'
$labRoot=Split-Path -Parent $PSScriptRoot
if(!$BackupPath){Add-Type -AssemblyName System.Windows.Forms;$labPicker=New-Object System.Windows.Forms.OpenFileDialog;$labPicker.Title='IMPAVIDUS LAB adatbázismentés kiválasztása';$labPicker.Filter='SQLite biztonsági mentés (*.sqlite)|*.sqlite';$labPicker.InitialDirectory=Join-Path $labRoot 'backups';if($labPicker.ShowDialog() -ne 'OK'){exit 0};$BackupPath=$labPicker.FileName}
if(!(Test-Path -LiteralPath $BackupPath)){Write-Host 'A mentés nem található.';exit 1}
$labAnswer=Read-Host 'A jelenlegi adatbázist megőrizzük, majd visszaállítjuk a kiválasztott mentést. Előbb rendezd és exportáld a böngésző függő mentéseit. Folytatás? (IGEN)'
if($labAnswer -cne 'IGEN'){exit 0}
& (Join-Path $PSScriptRoot 'launcher.ps1') -Action stop -NoBrowser
if($LASTEXITCODE -ne 0){exit 1}
$labNodeCommand=Get-Command node -ErrorAction SilentlyContinue
$labNode=if($env:IMPAVIDUS_NODE){$env:IMPAVIDUS_NODE}elseif($labNodeCommand){$labNodeCommand.Source}else{Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'}
Set-Location -LiteralPath $labRoot
& $labNode (Join-Path $PSScriptRoot 'restore.js') $BackupPath --confirm
if($LASTEXITCODE -ne 0){exit 1}
Write-Host 'Visszaállítás kész. Indítsd el a START_IMPAVIDUS_LAB.cmd fájlt. A böngészőben lépj be újra.'
