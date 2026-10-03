param([ValidateSet('start','stop')][string]$Action='start')
$ErrorActionPreference='Stop'
$labRoot=Split-Path -Parent $PSScriptRoot
$labInfoFile=Join-Path $labRoot 'data\mobile-access.json'
$labNodeCommand=Get-Command node -ErrorAction SilentlyContinue
$labNode=if($env:IMPAVIDUS_NODE){$env:IMPAVIDUS_NODE}elseif($labNodeCommand){$labNodeCommand.Source}else{Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'}
try {
    if(!(Test-Path -LiteralPath $labNode)){throw 'Node.js 24 szükséges.'}
    if($Action -eq 'stop'){
        if(Test-Path -LiteralPath $labInfoFile){
            $labInfo=Get-Content -LiteralPath $labInfoFile -Raw | ConvertFrom-Json
            [IO.File]::WriteAllText((Join-Path $labRoot 'data\mobile-access-stop'),$labInfo.token)
            for($labAttempt=0;$labAttempt -lt 40 -and (Test-Path -LiteralPath $labInfoFile);$labAttempt++){Start-Sleep -Milliseconds 250}
            if(Test-Path -LiteralPath $labInfoFile){throw 'A kapcsolat nem állt le. Nézd meg a mobil naplót.'}
        }
        Write-Host 'A telefonos kapcsolat leállt. A helyi app és az adatok megmaradtak.'
        exit 0
    }
    & (Join-Path $PSScriptRoot 'launcher.ps1') -Action start -NoBrowser -NoPrompt
    if($LASTEXITCODE -ne 0){throw 'A helyi alkalmazás nem indult.'}
    $labRunning=$null
    try{$labRunning=Invoke-RestMethod 'http://127.0.0.1:8084/__mobile_status' -TimeoutSec 2}catch{}
    if($labRunning -and $labRunning.app -eq 'IMPAVIDUS MOBILE' -and $labRunning.origin){Write-Host "Telefonos cím: $($labRunning.origin)";exit 0}
    $labLogs=Join-Path $labRoot 'data\logs'
    New-Item -ItemType Directory -Force -Path $labLogs | Out-Null
    $labStamp=Get-Date -Format 'yyyyMMdd-HHmmss-fff'
    $labProcess=Start-Process -FilePath $labNode -ArgumentList @('scripts/mobile-access.js') -WorkingDirectory $labRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $labLogs "mobile-$labStamp.log") -RedirectStandardError (Join-Path $labLogs "mobile-error-$labStamp.log") -PassThru
    for($labAttempt=0;$labAttempt -lt 90;$labAttempt++){
        $labRunning=$null
        try{$labRunning=Invoke-RestMethod 'http://127.0.0.1:8084/__mobile_status' -TimeoutSec 1}catch{}
        if($labRunning -and $labRunning.origin){break}
        if($labProcess.HasExited){throw "A mobilkapcsolat nem indult. Napló: $labLogs"}
        Start-Sleep -Milliseconds 500
    }
    if(!$labRunning.origin){throw "A kapcsolat még nem készült el. Napló: $labLogs"}
    Write-Host "Telefonon nyisd meg: $($labRunning.origin)"
    Write-Host 'A címet a MOBIL_CIM.txt fájl is tartalmazza. A gép maradjon bekapcsolva.'
}catch{Write-Host "HIBA: $($_.Exception.Message)" -ForegroundColor Red;exit 1}
