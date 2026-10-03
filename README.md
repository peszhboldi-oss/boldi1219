# IMPAVIDUS LAB

Magyar, bordó–fekete edző–kliens PWA, valódi helyi adatbázissal. Egy Node.js folyamat szolgálja ki a vanilla JS felületet és az API-t. Nincs szükség függőségtelepítésre.

## Indítás Windows alatt

1. A projekt gyökerében indítsd el az `INDITAS.cmd` fájlt. A gépen már elérhető Codex Node-runtime-ot is felismeri, ha a `node` nincs a PATH-ban.
2. Nyisd meg: **http://127.0.0.1:8082**. A parancssori ablak maradjon nyitva.
3. Első indításkor hozz létre saját edzői fiókot: felhasználónév és legalább 12 karakteres jelszó.
4. Hozz létre klienst saját felhasználónévvel és jelszóval, a Gyakorlatok oldalon saját gyakorlatot, majd az Edzésnaplóban tervet.
5. A kliens közvetlenül felhasználónévvel és jelszóval lép be. Az edző az adatlap „Belépési adatok” gombjával módosíthatja ezeket; üres jelszómezőnél a meglévő jelszó megmarad.
6. Tényleges sorozatot **kliensként** rögzíts; az edző csak olvassa a tényadatokat.

Általános indítás Node.js **24 vagy újabb** verzióval:

```sh
npm start
```

Leállítás: Ctrl+C. Újraindítás után a mentett adatok megmaradnak. Az adatbázis első indításkor automatikusan létrejön: `data/impavidus.sqlite`; a verziózott SQLite-migrációk automatikusan lefutnak. Nincs előre létrehozott fiók, jelszó, kliens vagy demóadat.

## Működő funkciók

- Edzői klienslista, profil létrehozása/módosítása, privát profilkép, belépési adatok kezelése, archiválás/visszaállítás.
- Kliens saját profilja; aktuális súly kizárólag tényleges mérésből; súlyváltozás, megjegyzések és aktivitási sorozatok.
- Központi gyakorlatkönyvtár, keresés, szerkesztés, inaktiválás, licencelt JSON import duplikációellenőrzéssel.
- Klienshez rendelt tervek: sorozatonkénti célok, sorrend, jegyzetek, másolás másik saját klienshez, archiválás és verzióelőzmények.
- Edzésindítás tervből; a tényleges mezők üresek. Nagy mobilos „SOROZAT KÉSZ” gomb, RPE, bemelegítés, pihenőidő szöveges adatként, korábbi tényeredmények, extra tényleges gyakorlat/sorozat.
- Lezárás/újranyitás, időpontok, tényleges időtartam, utólagos javítás előzményekkel; külön pihenőnap, edzéssel való ütközésvédelem.
- Heti statisztikák és négy adatalapú grafikon. A saját testsúlyos és kardióeredmények nem növelik a súlyzós volument.
- Tényleges napi napló, kézi étkezésnapló, mérési előzmények, fejlődési fotók, edzői szöveges étrend és dózislista változástörténettel, JSON-export.
- Szerveroldali jogosultság, HttpOnly munkamenet, CSRF-védelem, verzióütközések, scrypt-jelszóhash.

## Ellenőrzések

```sh
npm test
npm run check
npm run build
npm run backup
```

`check`: szintaktikai kódellenőrzés (nem ESLint), egy folyamatban, külön VM-modullal. A Node „ExperimentalWarning: VM Modules” figyelmeztetése várható. `build`: a frontend csomagolása a `dist/` mappába; nem egy statikus backend nélküli termék. Az API és az adatbázis futtatásához a teljes projekt szükséges.

## Konfiguráció

Az opcionális `.env` fájlt a szerver betölti. A `.env.example` nem tartalmaz titkot.

| Változó | Alapérték | Használat |
|---|---|---|
| `PORT` | `8082` | Helyi port |
| `SQLITE_PATH` | `data/impavidus.sqlite` | SQLite-fájl; üres érték az alapértéket jelenti |
| `APP_TIMEZONE` | `Europe/Budapest` | „Mai nap”, heti statisztikák és napzárás |
| `NODE_ENV` | fejlesztés | `production` esetén kötelező a Secure cookie |
| `COOKIE_SECURE` | `false` | HTTPS proxy mögött `true` |
| `PUBLIC_ORIGIN` | üres | Éles HTTPS-domain; Host allowlist, production módban kötelező |

`DATABASE_URL` használata konfigurációs hibával leáll: nincs PostgreSQL-adapter. `SESSION_SECRET` nem szükséges: véletlen session token hashét tároljuk az adatbázisban. További edzőt a `scripts/create-coach.js` hozhat létre `NEW_COACH_USERNAME` és `NEW_COACH_PASSWORD` egyszeri környezeti változókból; nem rendel automatikusan idegen klienst hozzá. Production módban az elsőfiók-létrehozó HTTP bootstrap tiltott; a fiókot a szerveren kell inicializálni.

## Határok és következő lépés

- Ez működő **helyi modul**, nem ellenőrzött éles telepítés. A szerver csak `127.0.0.1` címen figyel. Egy valódi telefonról elérhető szolgáltatáshoz HTTPS proxy, üzemeltetés és hozzáférési konfiguráció szükséges.
- A Service Worker csak a felületet cache-eli. Offline tényrögzítés, tartós outbox, automatikus szinkron és konfliktusfeloldás még nincs. Hibás mentés nem kap „Mentve” állapotot.
- Étrend jelenleg szöveges útmutatás 5/6 étkezéssel; részletes ételkatalógus/grammonkénti tervszámítás, XLSX/PDF-export következő fejlesztés.
- MFA, felületi edzői hozzárendelés-átadás, központi titkosított fotótár, titkosított/ütemezett mentés még nincs.
- A korábbi demó teljes forrása `legacy/step2-index.html` alatt megmaradt. A régi böngészős `localStorage` adatokat nem töltjük be automatikusan: fiktív rekordokat is tartalmazhatnak. Migráció előtt külön export és ellenőrzés szükséges.
- Nem másoltunk át wger vagy FitHub alkalmazáskódot. A wger formátumához saját importadapter készült; licencellenőrzés nélkül nem töltünk adatot. Lásd `docs/licensing.md`.

A `003_username_auth.sql` migráció megőrzi a fiókokat, jelszóhasheket és kliensadatokat. A korábbi e-mail-azonosító változatlan felhasználónévként működik tovább; az edző a kliens adatlapján egyszerű névre cserélheti. Új fióknál nincs e-mail vagy meghívókód.

Részletek: `docs/architecture.md`, `docs/database.md`, `docs/security.md`, `docs/offline.md`, `docs/testing.md`, `docs/step3-report.md`.
