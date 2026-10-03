param([ValidateSet('start','stop','restart','check')][string]$Action='start')
$ErrorActionPreference='Stop'
$labRoot=Split-Path -Parent $PSScriptRoot
$labInfoFile=Join-Path $labRoot 'data\mobile-access.json'
$labNodeCommand=Get-Command node -ErrorAction SilentlyContinue
$labNode=if($env:IMPAVIDUS_NODE){$env:IMPAVIDUS_NODE}elseif($labNodeCommand){$labNodeCommand.Source}else{Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'}
try {
    if(!(Test-Path -LiteralPath $labNode)){throw 'Node.js 24 szükséges.'}
    function Stop-LabMobile {
        if(Test-Path -LiteralPath $labInfoFile){
            $labInfo=Get-Content -LiteralPath $labInfoFile -Raw | ConvertFrom-Json
            [IO.File]::WriteAllText((Join-Path $labRoot 'data\mobile-access-stop'),$labInfo.token)
            for($labAttempt=0;$labAttempt -lt 40 -and (Test-Path -LiteralPath $labInfoFile);$labAttempt++){Start-Sleep -Milliseconds 250}
            if(Test-Path -LiteralPath $labInfoFile){throw 'A kapcsolat nem állt le. Nézd meg a mobil naplót.'}
        }
    }
    function Get-LabMobile {
        try{return Invoke-RestMethod 'http://127.0.0.1:8084/__mobile_status' -TimeoutSec 2}catch{return $null}
    }
    function Test-LabPublic($labCandidate) {
        if(!$labCandidate -or !$labCandidate.ready -or !$labCandidate.origin){return $false}
        try{
            $labPublic=Invoke-RestMethod "$($labCandidate.origin)/api/v1/ready" -TimeoutSec 10
            $labLocalConfig=(& $labNode (Join-Path $PSScriptRoot 'local-config.js')) | ConvertFrom-Json
            return $labPublic.status -eq 'ok' -and $labPublic.app -eq 'IMPAVIDUS LAB' -and $labPublic.instance -eq $labLocalConfig.instance
        }catch{return $false}
    }
    if($Action -in @('stop','restart')){Stop-LabMobile}
    if($Action -eq 'stop'){
        Write-Host 'A telefonos kapcsolat leállt. A helyi app és az adatok megmaradtak.'
        exit 0
    }
    & (Join-Path $PSScriptRoot 'launcher.ps1') -Action start -NoBrowser -NoPrompt
    if($LASTEXITCODE -ne 0){throw 'A helyi alkalmazás nem indult.'}
    $labRunning=Get-LabMobile
    if($labRunning -and $labRunning.app -ne 'IMPAVIDUS MOBILE'){throw 'A 8084 porton másik szolgáltatás fut.'}
    if(Test-LabPublic $labRunning){Write-Host "Külső HTTPS és saját API: OK. Telefonos cím: $($labRunning.origin)";exit 0}
    if($Action -eq 'check'){throw 'A külső HTTPS-elérés nem működik. Indítsd újra a MOBIL_INDITAS.cmd fájllal.'}
    if($labRunning){Write-Host 'A korábbi mobilkapcsolat nem elérhető; új kapcsolat indul.';Stop-LabMobile}
    $labLogs=Join-Path $labRoot 'data\logs'
    New-Item -ItemType Directory -Force -Path $labLogs | Out-Null
    $labStamp=Get-Date -Format 'yyyyMMdd-HHmmss-fff'
    $labProcess=Start-Process -FilePath $labNode -ArgumentList @('scripts/mobile-access.js') -WorkingDirectory $labRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $labLogs "mobile-$labStamp.log") -RedirectStandardError (Join-Path $labLogs "mobile-error-$labStamp.log") -PassThru
    for($labAttempt=0;$labAttempt -lt 120;$labAttempt++){
        $labRunning=Get-LabMobile
        if($labRunning -and $labRunning.ready){break}
        if($labProcess.HasExited){throw "A mobilkapcsolat nem indult. Napló: $labLogs"}
        Start-Sleep -Milliseconds 500
    }
    if(!(Test-LabPublic $labRunning)){throw "A külső HTTPS-ellenőrzés sikertelen. Nem adunk ki hibás címet. Napló: $labLogs"}
    Write-Host "Telefonon nyisd meg: $($labRunning.origin)"
    Write-Host 'A címet a MOBIL_CIM.txt fájl is tartalmazza. A gép maradjon bekapcsolva.'
}catch{Write-Host "HIBA: $($_.Exception.Message)" -ForegroundColor Red;exit 1}
