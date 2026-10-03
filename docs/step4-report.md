# IMPAVIDUS LAB — a negyedik lépés átadása

**Dátum:** 2026-10-03. **Kiadás:** működő helyi alkalmazás, package v4.0.0. **Projekt:** `C:\Users\User\Documents\Codex\2026-10-03\a-feladat-az-impavidus-lab-pr\impavidus-lab`.

Az eredeti saját repository folytatása történt. Egy frontend, Node API és SQLite-adatbázis van. wger/FitHub alkalmazáskód nem került összevonásra vagy bemásolásra. A valódi 8082-es adatbázisba nem került gyári account, tesztkliens vagy kitalált mérés. Az eredeti forrás és a történeti `legacy/` megmaradt; a korábbi böngészős localStorage nincs automatikusan importálva.

## A. Telepítés

- Szükséges: Node.js 24+, Windows PowerShell 5.1+, korszerű böngésző. A gép meglévő Node 24.19 runtime-ját használtuk. Nem települt új npm-csomag, Docker, PostgreSQL vagy rendszerfüggőség.
- Másik gépen teljes projektkicsomagolás írható mappába, szükség esetén hivatalos Node telepítése, `INSTALL_IMPAVIDUS_LAB.cmd` indítása. A meglévő `.env`, adatbázis és asztali ikon nem íródik felül.
- Első fiók: a felhasználó saját edzői felhasználónevet és legalább 12 karakteres jelszót ad meg. Nincs gyári jelszó, e-mail vagy meghívókód.
- A kiadási ZIP kizárólag forrás és útmutatók. Személyes adatbázis, `.env`, backup és abszolút útvonalú `.lnk` nincs benne. A meglévő projektet nem szükséges másodszor telepíteni.

## B. Indítás

**Elkészült a valódi Asztali `IMPAVIDUS LAB.lnk`**, célja `START_IMPAVIDUS_LAB.cmd`, munkamappája a fenti repository, egyedi `icon.ico` ikonnal. Target/WorkingDirectory/IconLocation visszaellenőrzött. A mindennapi indítás dupla kattintással végezhető; nem kell terminálban parancsot írni.

**Helyi cím: http://127.0.0.1:8082**. A frontend, session API és valódi SQLite ténylegesen elindult; `/ready` SQLite quick_check-et és projektazonosítót ellenőriz. A launcher ezen felül frontend HTML-t, Node-verziót, portot, konfigurációt, elérhető/írható adat- és mentési útvonalat, szabad lemezterületet vizsgál. Második START ugyanazt a saját egészséges folyamatot használja. A saját példányt hitelesített helyi vezérlőfájl állítja le, kényszerített kill nélkül.

START/STOP/RESTART/CHECK/INSTALL és a korábbi INDITAS is működő kód. A START sikeres ellenőrzés után az alapértelmezett böngészőt nyitja meg. A programindítást `-NoBrowser` módban ismételten teszteltük; a natív Windows-asztali ikon fizikai duplakattintását és külön Windows 10/11 gépeket ez a munkakörnyezet nem automatizálta.

## C. Funkciók és technikai döntések

| Oldal | Elkészült működés | Jogosultság / lényeges szabály |
|---|---|---|
| Adatlap | Profil, avatar, tényleges aktuális súly, kg/% változás, régi mérés jelzése, megjegyzések, archiválás, belépési adatok | Edző hozzárendeléssel; kliens saját profil. Nincs `[Alex team]` |
| Napi napló | Alvás/minőség, energia, stressz, tervkövetés, emésztés, fájdalom; edzés, étkezés, készítmények; opcionális mezők és napzárás | Saját kliens tényadatai, tervből nem képzett számok |
| Heti összesítő | Hétfő–vasárnap, teljesített nap/streak/maximum, súly, makró/cél/eltérés, volumen/RPE/izomcsoport, megjegyzés, készítmény, grafikon, CSV/XLSX | Jogosultan megnyitott kliens; szerverexport előtt függő sor rendezése |
| Edzésnapló | Gyakorlatkönyvtár, verziózott terv, sorozatcélok, NULL ténymezők, actual sorozat, extra sorozat, lezárás/javítás, előzmény, pihenőnap | Edző terv, kliens tény; pillanatfelvétel megmarad |
| Étrend | Központi/privát katalógus, keresés, duplikáció, 100 g referencia, 5/6 étkezés, grammok, célok, dátumok, másolás és archiválás | Edző kezeli a tervet; lejárt másolat új kezdethez érvényes |
| Kajanapló | Dátum, terv/előző nap draft másolat, explicit fogyasztás, saját étel, grammjavítás, megjegyzés, visszavonás, snapshot | A másolat nem automatikus fogyasztás; NULL nem nulla |
| Gyógyszer | Dózislista, egység/gyakoriság/fázis/dátum/jegyzet, minden változás előtte-utána előzménnyel | Emberi edzői művelet, nincs dózisjavaslat vagy napi pipa |
| Mérések | Testsúly kötelező, körméretek/jegyzet, történeti lista és grafikon | Kliens és hozzárendelt edző új rekord; régi mérés megőrzése |
| Fotónapló | Validált PNG/JPEG, privát tárolás, dátum/jegyzet, rendezés/nagyítás/két időpont/archiválás | Saját kliens feltölt, hozzárendelt edző olvas; 1 MB / 4096 px korlát |
| Beállítások | 5/6 étkezés, vérnyomás/vércukor/vérkép/víz/kiegészítők, JSON-export, teljes backup, outbox/sync/konfliktus | Tartós DB-beállítások; backup edzői, local outbox fiókonként külön |

### Offline és adatbiztonság

IndexedDB tartós outbox a kérés előtt; atomikus helyi sorszám, stabil új rekord/sorozat UUID, account+idempotency-key nyugta ugyanabban a szervertranzakcióban. Automatikus FIFO-szinkron visszatéréskor és 15 másodpercenként. Ütközés látható és nem veszíti el a helyi adatot; explicit server/local választás és JSON-export. Szerver-visszaállítás új adatbázis-generációt ad, régi helyi sort nem küld be automatikusan.

A PWA csak a felületet cache-eli; privát adat IndexedDB-ben van. Frissítés minden megnyitott lap mentett állapota mellett, külön gombbal. A háttérszinkron megőrzi a nyitott/mentetlen űrlapot. Első belépés, fiókkezelés, backup, teljes történet új lekérése és heti szerverexport online szükséges; offline session legfeljebb 12 óra.

Natív SQLite backup indításkor és alapból 24 óránként, dátum+UUID névvel, fotókkal és integritásellenőrzéssel. `BACKUP_KEEP=30` csak automatikus backupokat szabályoz; kézi/migráció/visszaállítás előtti példány nem kerül a megőrzési törlésbe. Restore leállított szolgáltatásban, jelenlegi DB teljes megőrzésével, session/receipt visszavonással. A migrációk 001–005, meglévő DB-ről előzetes konzisztens snapshot.

### Fennmaradó határok

1. **Belső hálózatos, telefonos HTTPS-kiszolgálás nincs beállítva.** Jelenleg 127.0.0.1-es helyi alkalmazás; több eszközhöz konkrét hostname/cert/proxy/tűzfal és ellenőrzött hozzáférés kell.
2. **Tényleges készülékes PWA-telepítés és külön Windows 10/11 elfogadás még szükséges.** Manifest/ikon/SW/offline működik, az eszközre telepítési dialógust nem próbáltuk végig.
3. **Nincs alkalmazásszintű adat- vagy backup-titkosítás.** A Windows-fiók, lemez és böngészőprofil védelme szükséges. A szerverbackup a még nem szinkronizált outboxot nem tartalmazza.
4. **Tárhely-kilakoltatás, tömeges offline fotó és hosszú terhelés nincs teljesen igazolva.** Betelt helyi tárhely hibaágát teszteltük; nagy fotótárhoz külön objektumtár és terhelésmérés kell. Nagy cache esetén a jelenlegi getAll-alapú helyi olvasás optimalizálandó.
5. **Nem minden új/hiányzó függőségű konfliktus erőltethető automatikusan.** Ilyenkor helyi export és online újrarögzítés kell. Korábban le nem töltött adat/history offline nem elérhető.
6. MFA, önkiszolgáló account-helyreállítás, edzők közti hozzárendelés-admin, szervezeti megőrzés és PostgreSQL/objektumtár nincs beállítva.
7. A backend fotóellenőrzése méret/aláírás/dimenzió; teljes szerveroldali képdekódolás nincs. A felület újrakódol, de szélesebb hálózati szolgáltatás előtt ezt is erősíteni kell.

A személyes adatokat kezelő többeszközös éles 1.0 elfogadásához a fenti üzemeltetési és eszközpróbák még szükségesek. A tíz helyi modul tényleges működését és az alább részletezett alapfolyamatokat ellenőriztük.

## D. Tesztek

| Ellenőrzés | Eredmény |
|---|---|
| Automatikus Node egység/HTTP/SQLite/integráció | **86 sikeres, 0 hibás, 0 kihagyott** |
| Windows indítási script | **10 sikeres**: tiszta install/első indítás/szóközös útvonal, második START ugyanazon PID, CHECK, RESTART, STOP megőrzéssel; leállt/hiányzó Node/hibás port/foglalt port/sérült DB elvárt hiba |
| Windows restore script | Backup kiválasztott path + IGEN stdin, leállítás, helyreállítás, újraindítás/ready, új leállítás: **sikeres**, elkülönített tesztmappában |
| Szintaktikai check | **43 JS/MJS fájl OK**; nem ESLint, VM Modules ExperimentalWarning várható |
| Build | **13 frontend shell-fájl OK**, privát adat nélkül |
| Mobil | **10/10 oldal**, 390×844; dokumentum scrollWidth=clientWidth, adatlekérések és navigáció |
| Tényleges offline | Mérési és új edzés/sorozat reload+szinkron; új saját étel és függő draft étkezés; egyszeri SQL/API rekordok |
| Biztonság | Auth/CSRF/assignment, idegen account, tényírás, idempotencia-replay jogvisszavonás, privát képek, hibás adatok |
| Mentés-visszaállítás | Fotó bytes, aktuális DB megőrzése, session/receipt törlés, új epoch, sérült backup/futó szerver tiltása, auto-retention; HTTP backup coach/client jogok |
| CSV/XLSX | API-ból valódi export; 7 munkalap, CRC/XML/rels és független openpyxl olvasó igazolta a tesztértékeket |
| PWA-frissítés | Több lapos blokkolás és mentett állapot utáni alkalmazás tényleges böngészőben és egységtesztben |

Javított köztes hibák: hiányzó charts asset-allowlist; zárt dialog miatt blokkolt frissítés; diet/catalógus snapshot és kézi ételreferencia; plan active offline; sync cache/profilvetítés; maximum-streak íráskor; restore DB-generáció; azonos időbélyegű queue-sorrend; background sync által frissített űrlap; Windows kontroll és szabadhely-ellenőrzés. A végső csomagban nincs hibás automatikus teszt.

**Nem végzett tesztek:** fizikai Asztal-duplakattintás natív UI automatizálás; külön Windows 10/11 gép; valós telefonos PWA-install; HTTPS/LAN; hosszú terhelés/böngészőadat-kilakoltatás/gépösszeomlás; Windows restore fájlválasztó grafikus emberi folyamata; Microsoft Excel GUI. A böngészős XLSX download-event capture timeoutolt, ezért a fájlt API-ból, külön olvasóval igazoltuk. A képfeltöltési chooser a környezetben lassú volt, de valóban feltöltött és visszaolvasott.

Részletes reprodukció: `docs/testing.md`, `docs/browser-step4-verification.md`. Az `outputs/` mappában teszt-, build-, kódellenőrzési-, startup- és exportnaplók, mobil JSON és szintetikus képernyőképek vannak.

## E. Fájlok és adatok

Új backend: `nutrition.js`, `idempotency.js`, `export.js`, `backups.js`, `restore.js`. Új frontend: `modules.js`, `charts.js`, `offline.js`, `domain.mjs`, saját ESM package jelölés. Módosult a közös app/repository/styles és backend app/server/store/metrics/validation.

Új migráció: `db/sqlite/004_nutrition_and_sync.sql`, `005_database_epoch.sql`. Új teszt: `step4.test.js`, `offline.test.js`, `restore.test.js`, `pwa.test.js`; meglévő runner/integrációs teszt frissítve.

Új indítók a projekt gyökerében: START, STOP, RESTART, CHECK, INSTALL, RESTORE `.cmd`; `CREATE_DESKTOP_SHORTCUT.ps1`, `icon.ico`. Új scripts: launcher/local-config/local-control/prepare/restore/startup-tests. Frissítve: backup/build/check, `.env.example`, package, SW, INDITAS, `.gitattributes`.

Útmutatók: `README_START_HU.md`, `IMPAVIDUS_LAB_UTMUTATO_HU.md`. Frissült README, AGENTS, architektúra/séma/offline/biztonság/teszt dokumentáció; új átadási és böngészős jegyzőkönyv. A teljes változáslista az átadási `impavidus-step4-valtozott-fajlok.txt` fájlban.

- Éles helyi adat: `data/impavidus.sqlite`, WAL/SHM működési állományokkal; a fotók is itt vannak.
- Automatikus/kézi backup: `backups/`, vagy a beállított BACKUP_DIRECTORY.
- Migráció előtti snapshot: `data/migration-backups/`.
- Restore előtti biztonsági backup: `data/restore-backups/`; checkpointolt eredeti állomány `*.before-restore-UUID` néven szintén megmarad.
- Napló: `data/logs/`.
- Függő helyi mentés: adott böngészőprofil IndexedDB; nem Git/build része.

## F. Verziókezelés és licencek

- `c701098`: a korábban kért username/password átállás, email/meghívó és Alex felirat nélkül.
- `7d36a0c`: egységes táplálkozás, tartós offline/sync, PWA-védelem és Windows/backup/restore működés.
- `b3f091d`: HTTP-backup jogosultság és privát fotó-visszaolvasás tesztje.
- A dokumentáció külön commitban rögzítve; az átadási commitlista tartalmazza ennek azonosítóját. Ág: `feature/client-workout-module`.

Git remote nincs konfigurálva, ezért pull request nem jött létre. A helyi commitok ellenőrizhetők. A csomag Git archive a végső forrásból, `.env`, adatbázis, mentés és control-token nélkül. Új külső alkalmazáskód/asset/licencfüggőség nem került be. A saját wger-adapter CC0/CC-BY és forrás/szerző ellenőrzést kezel; élő teljes wger-import nem történt. FitHub-kódot engedélyező licenc hiányában nem másoltunk. Lásd `docs/licensing.md`.

## Következő fejlesztési lépés — sorrendben

1. Saját első edzői fiók, kis saját próbaadat, asztali dupla kattintás és restore fájlválasztó emberi elfogadása; a megmaradt helyi backupok ellenőrzése.
2. Belső hálózathoz hostname/HTTPS/proxy/tűzfal és többeszközös jogosultságpróba. Becsült munka **1–3 nap**, a hálózat/tanúsítvány hozzáférésétől függően; magas üzemeltetési kockázat, amíg nincs ellenőrizve.
3. Windows 10/11 és valódi Android/iOS PWA-telepítés, megszakított hálózat, több lap, offline logout/session, storage pressure és gép-újraindítás elfogadási csomag. **2–4 nap**, közepes–magas böngésző/tárhely kockázat.
4. Nagy fotótár esetén indexelt helyi cache-olvasás és privát objektumtár/mentés, terhelésmérés és hosszú offline fotópróba. **5–10 nap**, adatmérettől függő magas kapacitási kockázat.
5. Az üzemeltetővel egyeztetett titkosítás, külön eszközre mentés, megőrzés és account-helyreállítás; szükség esetén PostgreSQL-adapter külön migrációs/visszaállítási próbával. **5–15 nap**, választott környezettől függően.

A becslések fejlesztői munkanapok, nem vállalt határidők. A legnagyobb fennmaradó technikai kockázat a többeszközös üzemeltetés és a böngészős/fotós tárhely hosszú távú kezelése.
