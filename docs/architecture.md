# A harmadik lépés architektúrája

Egy meglévő projekt, egy frontend, egy same-origin API, egy adattár. Keretrendszer vagy új csomag nem került be.

```text
index.html + frontend/app.js + styles.css
        ↓ Repository.request / saveSet (same-origin fetch)
backend/server.js → app.js → auth.js / validation.js / metrics.js
        ↓ Store (paraméterezett lekérdezés, tranzakció, revízió)
data/impavidus.sqlite ← db/sqlite/001,002,003 migrációk
```

## Adatbázis-döntés

A második lépésben a PostgreSQL célmodellje megvolt, élő kapcsolat és driver nem volt. Ezen a gépen nincs PostgreSQL/Docker. A Node 24 beépített SQLite-adaptere függőségtelepítés nélkül valódi, tartós adatbázist ad. A `Store` határába később PostgreSQL-adapter kerülhet; az SQL-dialektust és a szinkron hozzáférést akkor át kell dolgozni aszinkron tranzakciókra. Nem fut két backend, és nincs kettős írás.

A `db/migrations/001_initial_schema.sql` a korábbi PostgreSQL terv, nem az aktuális runtime-séma; a két sémát nem szabad egyszerre élesnek tekinteni. PostgreSQL-re áttéréshez új célmigráció és ellenőrzött adatexport/import kell. SQLite egy helyi Node-folyamathoz megfelelő; több író példányhoz és nagy fotótárhoz PostgreSQL + privát objektumtár javasolt.

## Fiókok és jogosultságok

Az első edző a helyi üres adatbázisban létrehozza saját fiókját. Az edző a kliens létrehozásakor megadja a felhasználónevet és jelszót: a profil, használható kliensfiók és edzői kapcsolat egyetlen tranzakcióban keletkezik. A kliens közvetlenül belép, az edző a hozzá rendelt kliens belépési adatait később is módosíthatja. A szerep és a kapcsolat minden adatvégponton szerveroldali ellenőrzést kap. Idegen kliensre 404 válasz érkezik; az edző a kliens tényadatait nem írhatja.

A régi jelszó nélküli névválasztást a harmadik lépés kifejezett hitelesítési követelménye felváltotta. Az archiválás adatot nem töröl, de a kliens munkameneteit visszavonja. A visszaállítás ismét engedi a belépést, korábbi cookie-t nem aktivál újra.

## Terv, edzés és statisztika

A terv verziózott, rendezett JSON-struktúrában tárol sorozatcélokat. Edzésindításkor új workout és relációs workout_sets sorok jönnek létre, a terv és gyakorlat akkori adataival. Tényleges súly, ismétlés és RPE NULL. A későbbi terv-/gyakorlatmódosítás nem érinti a pillanatfelvételt.

Csak explicit `completed` sorozat számít teljesítettnek. Hiányzó tényadat NULL, nem tervből képzett vagy automatikus nulla. Extra ténysorozat külön naplóbejegyzés, nem módosítja a tervet. Módosítások ugyanabban a tranzakcióban kapnak előtte/utána revíziót. A verziószám elavult mentéskor 409-et eredményez.

## Korábbi modulok

A tíz navigációs cél megmaradt. Napi napló, kézi étkezésnapló, mérés, privát fotó, szöveges étrend és dózislista a közös adatbázishoz kapcsolódik. A korábbi demó részletes ételtervezője archivált forrásként megmaradt; az új hitelesített étrendmodulban a strukturált ételkatalógus nincs kész. Ezt a felület jelzi.

## Üzemeltetés

Fájl-allowlist, CSP, request ID és strukturált napló; API-válaszok `no-store`. A log nem tartalmaz e-mailt, cookie-t, kliensazonosítót, jegyzetet, jelszót vagy képtartalmat. A SQLite-migráció induláskor atomikusan, egyszer fut. A backup a SQLite online backup API-jával készül; a visszaolvasás külön fájlból integrációs tesztelt.
