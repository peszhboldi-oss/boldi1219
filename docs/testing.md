# Tesztek és reprodukció — negyedik lépés

## Automatikus csomag

`node tests/run.js`: Node beépített tesztek egy folyamatban, memória vagy elkülönített ideiglenes SQLite-adatbázissal. Nincs worker/spawn, új függőség vagy éles kliensadat. Utolsó eredmény: **86 sikeres, 0 hibás, 0 kihagyott**.

| Terület | Automatizált ellenőrzés |
|---|---|
| Hitelesítés | Username, hash, session, CSRF/origin, archiválás, credential-változás és sessionvisszavonás |
| Hozzárendelés | Idegen kliens/edző 404; jogosulatlan tény- és tervírás; nyugta-replay után is aktuális jog |
| Edzés | Tervből NULL tény, snapshot, verzió, extra sorozat, kategóriák, RPE, pihenőnapütközés, korábbi eredmény |
| Étrend/étel | Katalógusprivát/központi, duplikáció, grammok, NULL és valódi nulla, 5/6 étkezés, dátumok, másolat/archiválás |
| Fogyasztás | Másolat nem tény, explicit consumed, célkülönbség, reference snapshot, kézi ételre váltás, visszavonás |
| Streak | Hétváltás, második hiány, mai nyitott/lezárt nap, monotón maximum tényíráskor köztes GET nélkül |
| Napló/készítmény | Regeneráció/prefs, gyógyszeridőszak, változástörténet, fotó/measurement jogosultság |
| Export | Hétfő/dátumtartomány, CSV formula-védelem, XLSX ZIP és szövegcellák/CRC |
| Offline | Hálózati hibák, új Repositoryból tartós sor, FIFO, egyszeri mentés, sessionazonosság, konfliktus és feloldás, régi epoch, tárhelyíráshiba |
| PWA update | Több nyitott lapból egy mentetlen állapot blokkol; minden jóváhagyás enged |
| Backup/restore | Natív mentés, integrity_check, fotóadatok, régi adatbázis megőrzése, új epoch, sérült mentés és futó szerver tiltása, auto-retention |
| Import | Saját wger JSON-adapter szintetikus exporttal, licenc/szerző/forrás és kategória, duplikáció |

## Indítási tesztek

`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/startup-tests.ps1 -FixtureDirectory "EGY_UJ_TESZT_MAPPA"`.

A script meglévő tesztmappát nem ír felül. Runtime-forrást másol, `.env`/data/backups/valódi kliens nélkül; 8084-es port, kikapcsolt automatamentés. A foglaltport-próbához a tényleges 8082-es szervernek futnia kell. Ellenőrzött 10 eset: tiszta install+első indulás szóközös útvonalon, második indulás ugyanazon PID, CHECK, RESTART, STOP/adatmegőrzés, leállt CHECK hibája, hiányzó Node, hibás PORT, idegen foglalt port, sérült DB.

Hibatesztben az érthető HIBA üzenet az elvárt kimenet; csak eltérő exit code teszthiba. A tesztmappa és naplók megmaradnak. A tesztek `-NoBrowser -NoPrompt` kapcsolót használnak, nem írnak az Asztalra.

## Kódellenőrzés és build

`node --experimental-vm-modules scripts/check.js`: JS/MJS VM-szintaxis, nem ESLint. A VM Modules ExperimentalWarning várható. `node scripts/build.js`: a 13 shell-fájl `dist/` másolata; data/backups/secret nem kerül a buildbe. Ez nem API nélküli teljes statikus alkalmazás.

## Tényleges böngészős próbák

Elkülönített 8083-as szintetikus adatbázis. Username-login; coach étrend létrehozása; kliens explicit fogyasztás és 300 kcal / 30 g fehérje; daily/prefs reload; tényleges szerverleállítás közbeni mérés és új edzés+szett, reload, automatikus sync és API/SQL egyszeri visszaellenőrzés. Privát fotó feltöltés/zoom/két időpont összevetés. Mind a 10 oldalon 390×844 viewport és horizontális túlcsordulásellenőrzés; asztali nézet, frissítési üzenetek és mentetlen űrlapvédelem.

A felületi próbák az automatizált HTTP-egység/integrációs csomagot egészítik ki. Nem verziózott, teljes automatizált böngészős regressziós suite. A képernyőkép tesztadatot mutat, nem production seedet. A végső jelentés külön sorolja a nem végzett teszteket.

## További elfogadási követelmények

Valódi Windows 10 és 11 gép külön; mobiltelepítés iOS/Android; LAN HTTPS, több eszköz/account, browser eviction és nagy fotótár, többórás hálózati/terhelési próbák, váratlan process/gépösszeomlás és lemezmeghibásodás. A Windows restore script BackupPath + IGEN stdin útvonala és az újraindítás ténylegesen sikerült elkülönített mappában. A grafikus fájlválasztó emberi folyamata külön elfogadási próba. Böngészős XLSX download-capture a környezetben timeoutot adott, ezért a valódi exportfájl API-ból mentve kapott külön ZIP/XML/olvasó ellenőrzést.
