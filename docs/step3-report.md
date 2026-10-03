# IMPAVIDUS LAB — harmadik lépés fejlesztési jelentés

Dátum: 2026-10-03. Az eredeti `impavidus-lab` repository folytatása. Kiinduló commit: `a175aa3`. Fejlesztési ág: `feature/client-workout-module`. A forrás a meglévő projektben maradt; a ZIP kiadási másolat, nem külön fejlesztési projekt.

## 1. Elkészült funkcionális modul

| Terület | Tényleges működés |
|---|---|
| Edzői klienslista | Saját hozzárendelt kliensek; név/kép/valós aktuális mérés/utolsó aktivitás/aktuális terv/heti teljesített napok; keresés, archiváltak szűrése |
| Profil | Név, kezdősúly, magasság, cél, célsúly, ciklus, kezdődátum; edzői szerkesztés, privát profilkép, fejlődési megjegyzések, archiválás/visszaállítás |
| Fiók | Első edzői setup, felhasználónév/jelszavas belépés, közvetlen edzői kliensfiók-létrehozás, logout és session visszavonás |
| Gyakorlat | Saját katalógus; keresés, létrehozás, szerkesztés, inaktiválás; licencelt JSON import duplikációellenőrzéssel |
| Edzésterv | Klienshez rendelve; név/dátum/ciklus/jegyzet; gyakorlatok sorrendje, sorozatonkénti célok, sorozatok hozzáadása/törlése, másolás másik saját klienshez, archiválás, történet |
| Edzésnapló | Terv pillanatfelvétele, üres ténymezők; dátum/név/időpontok/időtartam/jegyzet/állapot; ténysorozat, extra gyakorlat/sorozat, RPE, bemelegítés, opcionális pihenőadat; lezárás/újranyitás/archiválás |
| Mobilos rögzítés | Előző tényleges eredmény és terv külön; nagy számmezők és 60 px magas SOROZAT KÉSZ gomb; adatbázis-visszaigazolás, azonnali összesítő, következő üres sorozat fókusza |
| Pihenőnap | Külön rest_days rekord; aktív edzéssel ütközés esetén 409; archiválás után rögzíthető; napi nézetben explicit jelölés |
| Statisztika | Valós keménysorozat, izomcsoport, súlyzós volumen, átlagos tényleges RPE, lezárt edzések, heti és történeti adatok; négy grafikon |
| Kapcsolódó naplók | Valódi kézi étkezésnapló, napi állapot/napzárás, append-only testsúly/kerületmérés, edzői megjegyzések, szöveges étrend, dózislista revíziókkal, privát fotónapló, JSON-export |
| Biztonság/mentés | Szerveroldali szerep és klienskapcsolat, scrypt-hash, HttpOnly/SameSite munkamenet, CSRF/origin/Host védelem, privát feltöltés, verzióütközés, SQL tranzakció és revízió, konzisztens SQLite backup |

Az edző tényadatot nem módosíthat. A kliens kizárólag saját naplóit írhatja. Profilképet a tulajdonos kliens és a hozzárendelt edző kezelhet. A profil alapmezőit jelenleg az edző szerkeszti.

## 2. Technikai döntések

- Egyetlen vanilla HTML/CSS/JS frontend, ugyanazon Node API-val. A korábbi bordó–fekete vizuális irány, IMPAVIDUS LAB márkajelzés és tíz menücél megmaradt; mobilmenü és nagy érintési mezők készültek.
- Node **24+**, beépített `node:sqlite`, új függőség telepítése nélkül. A helyi gépen nincs beállított PostgreSQL, ezért a korábbi Store/API határán működő SQLite-adapter készült. A PostgreSQL-séma megmaradt tervként; PostgreSQL-kapcsolatot nem állítunk működőnek.
- A terv rendezett JSON, a tényedzés és sorozatok külön relációs rekordok. A snapshot tervverziót, nevet, izomcsoportot, eszközt és gyakorlatjegyzetet őriz. Az üres ténysúly/ismétlés/RPE NULL.
- Explicit `completed` sorozatok számítanak. Nem bemelegítő, ténysúlyt és ismétlést tartalmazó súlyzós/saját testsúlyos sorozat keménysorozat. Súlyzós volumen = tényleges kg × ismétlés, bemelegítéssel együtt; saját testsúly/kardió nem növeli. Saját testsúlynál 0 kg hozzáadott súly explicit valós adat, testtömeget nem következtetünk. Kardió perc/km külön. Átlag-RPE csak rögzített RPE-kből, a bemelegítő RPE-jével együtt.
- Hétfő–vasárnap, konfigurálható Europe/Budapest időzóna. Teljesített nap = tényleges étkezés és legalább egy teljesített sorozat vagy explicit pihenőnap. Üresen megnyitott edzés nem teljesítés. A mai nyitott nap nem hiány, heti első hiány megengedett, második nulláz. A profilban tárolt maximum nem csökken.
- A Service Worker csak app-shellt cache-el. Az online mentést külön Repository interfész kezeli; nincs késznek jelölt offline szinkron.

## 3. wger és FitHub felhasználása

**Átmásolt alkalmazáskomponens: nincs.** A wger AGPL-forráskódjához és a FitHub korábban hiányzó újrafelhasználási licencéhez nem választottunk automatikusan új licencet az IMPAVIDUS számára.

A wger gyakorlat-UUID/izom/eszköz/előzmény fogalma saját implementációban jelenik meg. A tényleges nyilvános serializer ellenőrzése alapján saját `wger-import.js` adapter készült az exerciseinfo JSON-formátumhoz. Csak külön ellenőrzött CC0-1.0/CC-BY-4.0 alapadat és fordítás vehető át, a szerző és forrás megőrzésével. Ismeretlen/ShareAlike licenc és kézi kategóriabesorolás nélküli adat kimarad. Az adaptert szintetikus sémaadatokkal teszteltük; élő wger adatcsomag nem került a termékbe. A FitHubból kód vagy asset nem került át. Források és feldolgozás: `docs/licensing.md`.

## 4. Fájlok

Módosítva:

- `.env.example`, `.gitignore`, `AGENTS.md`, `README.md`;
- `index.html`, `package.json`, `sw.js`;
- `backend/app.js`, `backend/server.js`;
- `docs/architecture.md`, `docs/database.md`, `docs/security.md`;
- `tests/run.js`, `tests/server.test.js`.

Létrehozva:

- `INDITAS.cmd` — Windows indító;
- `.gitattributes` — egységes forrássortörések, Windows indító CRLF-kivétele;
- `frontend/app.js`, `frontend/styles.css`, `frontend/repository.js` — egységes felület, design és mentési határ;
- `backend/auth.js`, `backend/store.js`, `backend/validation.js`, `backend/metrics.js`, `backend/wger-import.js`;
- `db/sqlite/001_core.sql`, `db/sqlite/002_snapshots_and_preferences.sql`;
- `scripts/check.js`, `scripts/build.js`, `scripts/backup.js`, `scripts/create-coach.js`, `scripts/convert-wger.js`;
- `tests/integration.test.js`, `tests/metrics.test.js`, `tests/wger-import.test.js`, `tests/auth.test.js`;
- `docs/offline.md`, `docs/licensing.md`, `docs/testing.md`, `docs/step3-report.md`;
- `legacy/step2-index.html` — a teljes korábbi felület megőrzött másolata.

A korábbi `legacy/pre-foundation/`, `legacy/v1-impavidus-lab.html`, `backend/access.js`, PostgreSQL tervmigráció és az ikonok megmaradtak. A régi localStorage állományokat nem módosítottuk vagy importáltuk automatikusan. Fiktív rekordok mellett saját adatokat is tartalmazhatnak, ezért ellenőrzött export/import külön feladat.

## 5. Migráció és működő tárolás

`001_core.sql` hozza létre a fiókot, profilt, hozzárendelést, sessiont, meghívót, gyakorlatot, tervet, edzést/sorozatot, külön pihenőnapot, naplókat és revíziókat. `002_snapshots_and_preferences.sql` tervverziót, gyakorlatjegyzet-snapshotot és alapból kikapcsolt opcionális egészségmezőket ad.

Mindkét migráció valódi SQLite-ban lefutott a tesztek és a helyi indítás során. Újraindításkor nem futnak duplán. A backupból új Store nyílt, és a tesztkliens, ténysúly/ismétlés, valamint migrációverziók visszaolvashatók voltak. A felhasználói alapadatbázis üres, saját fiók inicializálására vár; a szintetikus böngészőtesztek külön `work/browser-test.sqlite` fájlt használtak.

## 6. Ellenőrzési eredmények

- **53 / 53 automatikus teszt sikeres**, 0 hibás, 0 kihagyott.
- **25 JavaScript-fájl szintaktikai ellenőrzése sikeres**. Ez szintaktikai kódellenőrzés, nem ESLint vagy statikus biztonsági elemzés.
- **Build sikeres:** kilenc frontend-fájl + buildmanifest a dist alatt. A backend nem része egy önálló statikus weboldalnak; a teljes projektet kell futtatni.
- Valódi böngészős edzői profil-/gyakorlat-/tervlétrehozás és profilszerkesztés újratöltés után sikeres.
- Mobilos kliensaktiválás, tervolvasás, bemelegítő és munkasorozat mentése, lezárás és következő alkalom előző tényeinek megjelenése sikeres.
- Tesztadat: 20×10 bemelegítő (RPE 6) + 60×8 munkasorozat (RPE 8) → **680 kg**, **1 keménysorozat**, **RPE 7**. A felület és az API azonos eredményt adott.
- Böngészős tényleges mérés 89 kg, induló 90 kg → **−1 kg / −1,1%**. Étkezés + pihenőnap → 1 teljesített nap; üres edzés + étkezés → nincs teljesítés.
- Pihenőnap-ütközés felületi hibaüzenete, edzés archiválása után külön pihenőnap sikeres.
- Mind a tíz menücél mobilnézetben megnyílt. 360/390 px nézet, tervűrlap és napló túlcsordulásvizsgálata sikeres; nagy mentőgomb 60 px magas. Asztali nézet 1440 px méreten ellenőrizve. Böngészős JavaScript-hiba nem jelentkezett.

Felderített és javított hibák: a folyamatindítós kódellenőrzést a környezet EPERM hibával blokkolta → egyfolyamatos VM szintaxisvizsgálat; az aktív oldalra kattintva nyitva maradó mobilmenü → javított bezárás; túl apró mobilos grafikonfeliratok → nagyobb címkék és reszponzív izomcsoport-oszlopok. A 8080-as port már foglalt volt → az alkalmazás alapportja **8082**, a meglévő másik szolgáltatás nem lett leállítva. Sikertelen végső automatikus teszt nincs.

Fizikai telefon, iOS Safari, app-store telepítés, teljes offline szinkron, PostgreSQL és éles internetes telepítés nem volt tesztelve, és nincs működőnek minősítve.

## 7. Indítás és konfiguráció

Windows: `INDITAS.cmd` dupla kattintás → **http://127.0.0.1:8082**. Az ablak maradjon nyitva, leállítás Ctrl+C. A fájl a meglévő Codex Node-runtime-ot is használni tudja ezen a gépen. Más gépen Node.js 24+ kell; nincs npm install.

Terminál:

```sh
npm start
npm test
npm run check
npm run build
npm run backup
```

Opcionális `.env`: `PORT=8082`, `SQLITE_PATH`, `APP_TIMEZONE=Europe/Budapest`, `NODE_ENV=development`, `COOKIE_SECURE=false`. Éles HTTPS proxyhoz `NODE_ENV=production`, `COOKIE_SECURE=true` és `PUBLIC_ORIGIN=https://sajat-domain` kell, előzetesen létrehozott edzői fiókkal. A kód csak loopbacken figyel; az éles proxy/üzemeltetés nincs telepítve. `DATABASE_URL` nem támogatott ebben a kiadásban, `SESSION_SECRET` nem kell. Valódi titok a forrásban nincs.

## 8. Nyitott feladatok és kockázatok

| Feladat | Jelenlegi határ / becslés |
|---|---|
| Offline outbox/szinkron | Nincs tartós offline mentés. Idempotencia, többeszközös konfliktus és visszavont fiók kezelése: magas kockázat, kb. 6–10 fejlesztőnap + 3–5 tesztnap |
| PostgreSQL + privát fotótár | Az adapter jelenleg SQLite; több író példány és sok fotó előtt átállás kell. Adatmigráció és jogosultsági megfelelés: közepes–magas kockázat, 4–7 nap + 2–3 tesztnap |
| Fiókhelyreállítás/MFA/éles auth | A helyi jelszavas belépés működik, e-mail- és recovery infrastruktúra nincs. 3–5 nap + 2–3 tesztnap |
| Részletes étrend/ételkatalógus | A szöveges étrend és kézi étkezési tények működnek, a régi demó grammonkénti terve még nem került a hitelesített modulba. 4–7 nap |
| Üzemeltetés/mentés | Lokális konzisztens backup működik, titkosítás/ütemezés/külső tárolás/éles teljes restore nincs. 2–4 nap + helyreállítási gyakorlat |
| Eszköz- és UI-regresszió | Mobil viewport ellenőrzött, valódi iOS/Android hardver nem. Automatikus browser E2E és akadálymentességi mátrix: 2–4 nap |
| Karbantarthatóság | A közös API/frontend modul nagy; további üzleti modulok előtt tartományonkénti szétbontás és integrációs szerződések szükségesek. 2–3 nap |

A napok egy fejlesztő durva becslései, nem határidőígéretek. A pontosításhoz tárhely, felhasználószám, offline adatvédelmi és auth-szolgáltatói döntések kellenek.

## 9. Következő fejlesztési sorrend

1. A mostani helyi modult saját, nem éles adatokkal átvételi tesztelni; az edző/kliens szerepeket külön fiókban használni.
2. API-idempotencia + fiókhoz kötött IndexedDB outbox, látható piszkozat/szervermentés/ütközés állapotok.
3. Offline reconnect és két eszköz konfliktustesztek; mentési bizonytalanság és visszavont session kezelése.
4. PostgreSQL/privát objektumtár adapter, tesztelt migráció és titkosított backup/restore folyamat.
5. HTTPS-es tesztkörnyezet, recovery/MFA, központi rate limit, tényleges telefonos és Safari tesztek.
6. Részletes ételkatalógus, grammonkénti étrend, XLSX/PDF-export; a további modulok tartományonkénti bővítése.

Pull request nem hozható létre automatikusan: a helyi repositoryhoz nincs Git remote beállítva. A külön ág és commit helyben ellenőrizhető; kiadási ZIP és részletes jelentés készül.

## Belépési mód frissítése

A legújabb módosítás megszünteti a meghívókódos aktiválást és az e-mail-mezőt. A `003_username_auth.sql` adatmegőrző migráció bevezeti a felhasználónév-alapú hitelesítést. Az edző a saját kliensei belépési adatait az adatlapon állíthatja. Az új állapothoz a README és az aktuális teszteredmény tartozik; a fenti korábbi ellenőrzési beszámoló történeti feljegyzés.
