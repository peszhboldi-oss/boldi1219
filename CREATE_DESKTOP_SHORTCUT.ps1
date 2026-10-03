param([string]$DesktopPath=[Environment]::GetFolderPath('Desktop'))
$ErrorActionPreference='Stop'
$labRoot=$PSScriptRoot
$labShortcutFile=Join-Path $DesktopPath 'IMPAVIDUS LAB.lnk'
if(Test-Path -LiteralPath $labShortcutFile){throw 'Már létezik IMPAVIDUS LAB parancsikon. Meglévő parancsikont nem írunk felül.'}
$labShell=New-Object -ComObject WScript.Shell
$labShortcut=$labShell.CreateShortcut($labShortcutFile)
$labShortcut.TargetPath=Join-Path $labRoot 'START_IMPAVIDUS_LAB.cmd'
$labShortcut.WorkingDirectory=$labRoot
$labShortcut.IconLocation=(Join-Path $labRoot 'icon.ico')+',0'
$labShortcut.Description='IMPAVIDUS LAB - Luxury Performance System'
$labShortcut.WindowStyle=7
$labShortcut.Save()
Write-Host "Asztali parancsikon elkészült: $labShortcutFile"
