# IMPAVIDUS LAB

Magyar, prémium bordó–fekete edző–kliens napló. Egy Node.js 24+ folyamat szolgálja ki a vanilla JS PWA-t és a hitelesített API-t, valódi SQLite-adatbázissal. Új külső csomag telepítése nem szükséges.

## Mindennapi indítás

Windows: dupla kattintás az **IMPAVIDUS LAB** asztali ikonra vagy a `START_IMPAVIDUS_LAB.cmd` fájlra. Cím: **http://127.0.0.1:8082**. A szerver a háttérben fut; leállítás `STOP_IMPAVIDUS_LAB.cmd`, újraindítás `RESTART_IMPAVIDUS_LAB.cmd`, ellenőrzés `CHECK_IMPAVIDUS_LAB.cmd`.

Első használatkor saját edzői felhasználónevet és legalább 12 karakteres jelszót hozz létre. A kliens saját felhasználónévvel/jelszóval lép be; nincs e-mail, meghívókód vagy gyári fiók. Másik gépen `INSTALL_IMPAVIDUS_LAB.cmd` készíti elő a meglévő runtime mellett a konfigurációt, migrációkat és az asztali ikont.

- [Indítás és hibaelhárítás](README_START_HU.md)
- [Magyar használati útmutató](IMPAVIDUS_LAB_UTMUTATO_HU.md)
- [Negyedik lépés átadási jelentése](docs/step4-report.md)

## Működő modulok

| Oldal | Működés |
|---|---|
| Adatlap | Hozzárendelt kliens, valódi mérésből súly, fejlődés, megjegyzések, profil/archiválás, belépési adatok |
| Napi napló | Regeneráció, tényleges edzés, étkezés, aktuális készítmény egy nézetben |
| Heti összesítő | Közös sorozatszámítás, adatalapú grafikonok, makrók/célok, CSV/XLSX |
| Edzésnapló | Gyakorlatkönyvtár, verziózott tervek, üresen induló tények, sorozatok, javítás és előzmény |
| Étrend | Katalógus, 5/6 étkezés, grammok, célok, dátumérvényesség, másolás, archiválás |
| Kajanapló | Tervből csak előkészített tételek; kifejezett fogyasztás, grammjavítás, pillanatfelvétel |
| Gyógyszer | Dátumozott dózislista, megőrzött változások; nincs adagolási javaslat |
| Mérések | Kliens és hozzárendelt edző új mérése, körméretek, súlygrafikon |
| Fotónapló | Privát PNG/JPEG, dátum, nagyítás, összehasonlítás, archiválás |
| Beállítások | Tartós kapcsolók, export, mentés, outbox és tudatos ütközésfeloldás |

## Technikai ellenőrzések

```sh
node tests/run.js
node --experimental-vm-modules scripts/check.js
node scripts/build.js
node scripts/backup.js
```

A `check` szintaktikai ellenőrzés, nem telepített linter; VM Modules figyelmeztetés várható. A build a felületet `dist/` alá csomagolja; az API nélkül nem teljes alkalmazás. A teljes forrás szükséges a helyi futtatáshoz. Nincs hamis vagy éles adatot használó seed.

## Konfiguráció és adattárolás

`.env.example` → opcionális `.env`; meglévőt az installer nem ír felül. `PORT=8082`, `APP_TIMEZONE=Europe/Budapest`, `SQLITE_PATH` opcionális. HTTPS proxy mögött `COOKIE_SECURE=true` és HTTPS `PUBLIC_ORIGIN`; production módban kötelező. `DATABASE_URL` nem támogatott, PostgreSQL nincs bekötve. Nyers session helyett véletlen token hashét tároljuk; `SESSION_SECRET` nem kell.

`BACKUP_INTERVAL_HOURS=24` (0 kikapcsolás), `BACKUP_KEEP=30`, opcionális `BACKUP_DIRECTORY`. A teljes SQLite-mentés a fotókat is tartalmazza. A `RESTORE_IMPAVIDUS_LAB.cmd` ellenőrzött mentésből, a jelenlegi adatbázist megőrizve állít vissza.

A `003_username_auth.sql` megőrzi a korábbi fiókokat/hasheket; a régi e-mail-azonosító továbbra is felhasználónév. `004` táplálkozási és idempotencia-adatok, `005` adatbázis-generáció. Migráció előtt automatikus konzisztens mentés készül.

## Használati határok

A szerver jelenleg **csak ezen a gépen, 127.0.0.1-en** fut. Telefonos/belső hálózati HTTPS-kiszolgálás nincs beállítva. Az IndexedDB offline mentést és későbbi szinkront ad a korábban betöltött adatokhoz; első belépés, fiókkezelés, heti szerverexport és backup online szükséges. Offline munkamenet legfeljebb 12 óra. A fotók nagy mennyisége előtt külön tárhely/terhelésvizsgálat kell.

A SQLite, backup, JSON-export és böngészőcache érzékeny adatot tartalmazhat, nincs alkalmazásszintű titkosítás. Lemez- és Windows-fiókvédelem, külön adathordozós mentés szükséges. Tényleges mobilos PWA-telepítés, külön Windows 10/11 gépek, hosszú terhelés/hibaszimuláció és éles HTTPS-üzemeltetés még külön elfogadási feladat.

Nem került át wger/FitHub alkalmazáskód vagy külső asset. A saját wger JSON-adapter ellenőrzött CC0/CC-BY adatokat kezel. [Licencek](docs/licensing.md). Részletek: [architektúra](docs/architecture.md), [adatbázis](docs/database.md), [biztonság](docs/security.md), [offline](docs/offline.md), [tesztelés](docs/testing.md).
