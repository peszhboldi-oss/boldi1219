# Egységes architektúra — negyedik lépés

Egy repository, frontend, same-origin API és SQLite-adattár. Nincs új framework, npm runtime-függőség, Docker vagy párhuzamos adatbázis.

```text
Windows .lnk → START.cmd → launcher.ps1
                         ↓ tényleges /ready + frontend ellenőrzés
index.html / app.js / modules.js / charts.js / styles.css
                         ↓ Repository
                IndexedDB cache + tartós outbox
                         ↓ fetch + CSRF + UUID Idempotency-Key
backend/server.js → app.js → auth / nutrition / közös domain
                         ↓ idempotencia + tranzakció + revízió
               Store → data/impavidus.sqlite (WAL)
                         ↓ online backup + integritásellenőrzés
                  dátumozott backups/*.sqlite
```

## Modulhatárok

- `app.js`: hitelesítés, hozzárendelt kliens, profil, gyakorlat/terv/edzés, közös navigáció és űrlapkezelés.
- `modules.js`: étrend, kajanapló, regeneráció, készítmény, mérés, privát fotó, heti összesítő és beállítások.
- `domain.mjs`: naptári aritmetika, időzónás mai nap, streak és edzésstatisztika; a backend ugyanazokat a függvényeket tölti be.
- `repository.js`/`offline.js`: tartós mentés a hálózati kérés előtt, saját fiókhoz kötött cache, optimista vetítés, FIFO-szinkron, kifejezett ütközésfeloldás.
- `nutrition.js`: központi/privát katalógus, étrend, érvényesség, grammarányos számítás, pillanatfelvételek, fogyasztás és összesítés.
- `idempotency.js`: account+kulcs egyedi nyugta, kérésdigest, ugyanabban a tranzakcióban tárolt eredmény. Újraküldés előtt a jelenlegi jogosultságot ellenőrzi.
- `backups.js`/`restore.js`: natív SQLite online backup, integritás, megőrzés, leállított szolgáltatásba visszaállítás, jelenlegi állomány megőrzése.
- `launcher.ps1`/`local-control.js`: rejtett Node-folyamat, projektazonosító, egészségellenőrzés, hitelesített helyi leállítási fájl, kényszerített kill nélkül.

## Adat és jogosultság

A kliensprofil, verziózott terv és tényleges napló külön rekord. Edzésindításkor a tervből új sorozatok jönnek létre NULL tényértékekkel. Étrendmásoláskor fogyasztás=0. Későbbi terv/katalógus módosítása nem írja át a múltat. Kliens saját tényt ír; hozzárendelt edző tervet, dózislistát, megjegyzést, profilt és új mérést. Idegen kliens 404; session és assignment minden API-kérésnél szerveroldali.

## SQLite döntés

A Node 24 beépített `node:sqlite` modullal függőségtelepítés nélkül ellenőrizhető, tartós adatbázis jött létre. A runtime-migrációk kizárólag `db/sqlite/001…005.sql`. A korábbi PostgreSQL-célterv `db/migrations/001_initial_schema.sql` történeti dokumentum, nem második élő adatbázis.

Több gépes, nagy terhelésű üzemhez aszinkron PostgreSQL-adapter, új célmigráció, ellenőrzött adatátvitel és privát objektumtár kell. A mostani szinkron SQLite Store nem állítható át pusztán egy DATABASE_URL megadásával.

## Frissítés és helyreállítás

A Service Worker csak verziózott felületet cache-el; privát API soha nem kerül CacheStorage-ba. A waiting frissítés minden megnyitott lap mentett állapotát ellenőrzi. Nem válaszoló/régi lap blokkol: adatmentés után be kell zárni.

Migráció előtt `VACUUM INTO` ad konzisztens biztonsági példányt. Visszaállítás előtt teljes jelenlegi backup, session/nyugta törlése és új adatbázis-generáció; régi böngészős outbox külön konfliktus. A data/backups nincs a buildben vagy forráscsomagban.

## Üzemeltetési határ

Loopback helyi kiadás. HTTPS/belső hálózat, központi titkosítás, MFA/önkiszolgáló fiókhelyreállítás, privát objektumtár és nagy terhelés még nincs beállítva. A működő helyi modult nem tekintjük ezek ellenőrzésének.
