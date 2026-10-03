param([ValidateSet('start','stop','restart','check','install')][string]$Action='start',[switch]$NoBrowser,[switch]$NoPrompt)
$ErrorActionPreference='Stop'
$labRoot=Split-Path -Parent $PSScriptRoot
$labLogs=Join-Path $labRoot 'data\logs'
New-Item -ItemType Directory -Force -Path $labLogs | Out-Null
try {
    $labNodeCommand=Get-Command node -ErrorAction SilentlyContinue
    $labNode=if($env:IMPAVIDUS_NODE){$env:IMPAVIDUS_NODE}elseif($labNodeCommand){$labNodeCommand.Source}else{Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'}
    if(!(Test-Path -LiteralPath $labNode)){throw 'Node.js 24 vagy újabb szükséges. Telepítsd a nodejs.org hivatalos LTS kiadását, majd indítsd újra.'}
    $labMajor=[int]((& $labNode --version).Trim().TrimStart('v').Split('.')[0])
    if($labMajor -lt 24){throw 'A Node.js verziója túl régi. Legalább 24 szükséges.'}
    $labInfo=(& $labNode (Join-Path $PSScriptRoot 'local-config.js')) | ConvertFrom-Json
    if($LASTEXITCODE -ne 0){throw 'A helyi konfiguráció hibás.'}
    $labPort=$labInfo.port
    $labEnv=Join-Path $labRoot '.env'
    $labUrl="http://127.0.0.1:$labPort"
    $labInstance=$labInfo.instance
    function Get-LabHealth {
        try { $labHealth=Invoke-RestMethod "$labUrl/api/v1/ready" -TimeoutSec 2
            if($labHealth.app -eq 'IMPAVIDUS LAB' -and $labHealth.instance -eq $labInstance -and $labHealth.database -eq 'sqlite'){return $labHealth}
        } catch {}
        return $null
    }
    if($Action -in @('stop','restart')){
        & $labNode (Join-Path $PSScriptRoot 'local-control.js')
        if($LASTEXITCODE -ne 0){throw 'A szabályos leállítás sikertelen. Az adatbázist nem módosítottuk.'}
        for($labAttempt=0;$labAttempt -lt 40 -and (Get-LabHealth);$labAttempt++){Start-Sleep -Milliseconds 250}
        if(Get-LabHealth){throw 'A szerver még nem állt le.'}
        if($Action -eq 'stop'){Write-Host 'IMPAVIDUS LAB leállítva. Az adatok megmaradtak.';exit 0}
    }
    if($Action -eq 'install'){
        if(!(Test-Path -LiteralPath $labEnv)){Copy-Item -LiteralPath (Join-Path $labRoot '.env.example') -Destination $labEnv}
        & $labNode (Join-Path $PSScriptRoot 'prepare.js')
        if($LASTEXITCODE -ne 0){throw 'Az adatbázis előkészítése sikertelen.'}
    }
    if(!(Get-LabHealth)){
        if($Action -eq 'check'){throw 'Az alkalmazás nem fut. Indítsd el a START_IMPAVIDUS_LAB.cmd fájllal.'}
        $labClient=New-Object System.Net.Sockets.TcpClient
        try{$labTask=$labClient.ConnectAsync('127.0.0.1',$labPort);$labBusy=$labTask.Wait(500) -and $labClient.Connected}catch{$labBusy=$false}finally{$labClient.Dispose()}
        if($labBusy){throw "A $labPort portot másik vagy hibás szolgáltatás használja. Nem indítunk második példányt."}
        $labStamp=Get-Date -Format 'yyyyMMdd-HHmmss-fff'
        $labProcess=Start-Process -FilePath $labNode -ArgumentList @('server.js') -WorkingDirectory $labRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $labLogs "server-$labStamp.log") -RedirectStandardError (Join-Path $labLogs "error-$labStamp.log") -PassThru
        for($labAttempt=0;$labAttempt -lt 80;$labAttempt++){if(Get-LabHealth){break};if($labProcess.HasExited){throw "Az alkalmazás nem indult. Részletek: $labLogs"};Start-Sleep -Milliseconds 250}
        if(!(Get-LabHealth)){throw "Az alkalmazás 20 másodpercen belül nem vált használhatóvá. Naplók: $labLogs"}
    }
    $labFront=Invoke-WebRequest $labUrl -UseBasicParsing -TimeoutSec 5
    if($labFront.StatusCode -ne 200 -or $labFront.Content -notmatch 'IMPAVIDUS LAB'){throw 'A felület ellenőrzése sikertelen.'}
    $labFree=[double]$labInfo.freeBytes
    if($labFree -lt 100MB){throw 'Kevesebb mint 100 MB szabad hely. Szabadíts fel helyet az adatbiztonság érdekében.'}
    Write-Host "Backend, API, SQLite-adatbazis es felulet: OK. Cim: $labUrl"
    if($Action -eq 'install' -and !$NoPrompt){
        $labAnswer=Read-Host 'Letrehozzuk az IMPAVIDUS LAB asztali ikont? (I/N)'
        if($labAnswer -match '^[iIyY]$'){& (Join-Path $labRoot 'CREATE_DESKTOP_SHORTCUT.ps1')}
    }
    if(!$NoBrowser -and $Action -in @('start','restart','install')){Start-Process $labUrl}
    exit 0
} catch {
    $labMessage=$_.Exception.Message
    Add-Content -LiteralPath (Join-Path $labLogs 'launcher-errors.log') -Value "$(Get-Date -Format o) $labMessage"
    Write-Host "HIBA: $labMessage" -ForegroundColor Red
    exit 1
}
