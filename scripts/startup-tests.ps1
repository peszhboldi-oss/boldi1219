param([string]$FixtureDirectory)
$ErrorActionPreference='Stop'
$labSource=Split-Path -Parent $PSScriptRoot
if(!$FixtureDirectory){$FixtureDirectory=Join-Path ([IO.Path]::GetTempPath()) ('Impavidus startup tests '+[guid]::NewGuid().ToString())}
$labFixture=[IO.Path]::GetFullPath($FixtureDirectory)
if(Test-Path -LiteralPath $labFixture){throw 'A tesztmappa már létezik. Válassz új, üres útvonalat.'}
New-Item -ItemType Directory -Path $labFixture | Out-Null
foreach($labItem in @('backend','frontend','db','scripts','index.html','sw.js','manifest.webmanifest','package.json','server.js','icon.svg','icon.ico','icon-192.png','icon-512.png','.env.example','CREATE_DESKTOP_SHORTCUT.ps1')){Copy-Item -LiteralPath (Join-Path $labSource $labItem) -Destination $labFixture -Recurse}
$labEnvPath=Join-Path $labFixture '.env'
Set-Content -LiteralPath $labEnvPath -Encoding ASCII -Value "PORT=8084`nBACKUP_INTERVAL_HOURS=0"
$labLauncher=Join-Path $labFixture 'scripts\launcher.ps1'
$labResults=New-Object System.Collections.Generic.List[string]
function Invoke-LabCase([string]$Name,[string]$Action,[int]$Expected){
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $labLauncher -Action $Action -NoBrowser -NoPrompt
    $labCode=$LASTEXITCODE
    if($labCode -ne $Expected){throw "$Name sikertelen: $labCode (elvárt: $Expected)."}
    $labResults.Add("OK: $Name")
}
try{
    Invoke-LabCase 'Tiszta telepítés és első indítás, szóközös útvonal' 'install' 0
    $labFirst=Get-Content -LiteralPath (Join-Path $labFixture 'data\local-control.json') -Raw | ConvertFrom-Json
    Invoke-LabCase 'Második indítás' 'start' 0
    $labSecond=Get-Content -LiteralPath (Join-Path $labFixture 'data\local-control.json') -Raw | ConvertFrom-Json
    if($labFirst.pid -ne $labSecond.pid){throw 'A második indítás új példányt hozott létre.'}
    Invoke-LabCase 'Teljes egészségellenőrzés' 'check' 0
    Invoke-LabCase 'Szabályos újraindítás' 'restart' 0
    Invoke-LabCase 'Szabályos leállítás' 'stop' 0
    if(!(Test-Path -LiteralPath (Join-Path $labFixture 'data\impavidus.sqlite'))){throw 'Az adatbázis nem maradt meg.'}
    Invoke-LabCase 'Leállt szolgáltatás felismerése' 'check' 1
    $labPreviousNode=$env:IMPAVIDUS_NODE
    try{$env:IMPAVIDUS_NODE=Join-Path $labFixture 'missing-node.exe';Invoke-LabCase 'Hiányzó futtatókörnyezet felismerése' 'start' 1}finally{$env:IMPAVIDUS_NODE=$labPreviousNode}
    Set-Content -LiteralPath $labEnvPath -Encoding ASCII -Value "PORT=not-a-port`nBACKUP_INTERVAL_HOURS=0"
    Invoke-LabCase 'Hibás konfiguráció felismerése' 'start' 1
    Set-Content -LiteralPath $labEnvPath -Encoding ASCII -Value "PORT=8082`nBACKUP_INTERVAL_HOURS=0"
    Invoke-LabCase 'Másik projekt által foglalt port felismerése' 'start' 1
    Set-Content -LiteralPath $labEnvPath -Encoding ASCII -Value "PORT=8084`nBACKUP_INTERVAL_HOURS=0`nSQLITE_PATH=data/corrupt-test.sqlite"
    Set-Content -LiteralPath (Join-Path $labFixture 'data\corrupt-test.sqlite') -Encoding ASCII -Value 'not a database'
    Invoke-LabCase 'Sérült adatbázis felismerése' 'start' 1
    $labResults | ForEach-Object {Write-Host $_}
    Write-Host "Tesztmappa megőrizve: $labFixture"
}catch{Write-Host "TESZTHIBA: $($_.Exception.Message)";exit 1}
