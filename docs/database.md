# Aktív adatbázisséma — SQLite

Node.js 24 `node:sqlite`. Alapértelmezés: `data/impavidus.sqlite`. Foreign keys ON, WAL, 5 másodperc busy timeout. A verziózott migrációk egyszer, tranzakcióban futnak, a meglévő adatbázisról előzetes konzisztens mentéssel. Nincs seed vagy valódi tesztkliens.

| Tábla | Tartalom |
|---|---|
| accounts | UUID, normalizált egyedi felhasználónév, scrypt-hash, szerep, aktív állapot |
| clients | Fiókhoz egy profil, kezdősúly/cél/magasság, privát avatar BLOB, preferenciák JSON, maximum-streak, verzió/archiválás |
| assignments | Edző + kliens, aktív kapcsolat; szerveroldali objektumjogosultság |
| sessions | Token SHA-256 hashe, account, CSRF, lejárat |
| exercises | Gyakorlat/izom/eszköz/kategória, importforrás+licenc, aktív/verzió |
| plans | Kliens/edző, név, kezdés/fázis, rendezett célgyakorlat/sorozat JSON, verzió |
| workouts | Kliens/terv és tervverzió, dátum, időpontok, státusz, jegyzet, verzió |
| workout_sets | Gyakorlat és terv pillanatfelvétele, külön cél/tény, RPE, bemelegítés, kardió, teljesítési állapot, verzió |
| rest_days | Kifejezett pihenőnap, jegyzet, archiválás |
| daily_logs | Kliens+nap egyedi, regeneráció/egészség opcionális JSON, napzárás, verzió |
| foods | Központi vagy account privát katalógus, kategória, 100 g referencia kcal/F/CH/Zs, NULL=ismeretlen, verzió/inaktiválás |
| diets | Kliens/edző, dátumérvényesség/fázis, célok, 5/6 étkezés, tétel JSON és étel-pillanatfelvétel, verzió/aktív |
| food_logs | Kliens/nap/étkezés, grammok, elfogyasztás állapota, tényleges tápértékek, referencia JSON, étrend UUID/verzió, megjegyzés, archiválás/verzió |
| measurements | Új mérési rekord dátummal, kötelező testsúllyal, körméret/megjegyzés JSON; megőrzött történet |
| notes | Edzői fejlődési megjegyzés, szerző/idő/archiválás |
| records | Készítmény dózislista és privát fotó JSON/base64, dátumok, verzió, archiválás; korábbi szöveges étrend megőrizve |
| revisions | Entitás/UUID/szerző/idő/előtte-utána JSON |
| mutation_receipts | Account+UUID egyedi mentési nyugta, method/path/kérésdigest/státusz/eredmény; ismétlés megelőzése |
| app_meta | Adatbázis-generáció UUID; visszaállításkor új érték |
| schema_migrations | Alkalmazott migráció és időpont |

## Migrációk

1. `001_core.sql`: alapmodell, foreign keys, egyedi/index és napütközés-triggerek.
2. `002_snapshots_and_preferences.sql`: tervverzió/gyakorlatjegyzet, opcionális egészségkapcsolók.
3. `003_username_auth.sql`: email → username, eredeti account/hash/client megtartása, invitations eltávolítása.
4. `004_nutrition_and_sync.sql`: foods/diets, fogyasztás és pillanatfelvétel mezők, idempotens nyugták. Régi tényleges kézi kajanapló `consumed=1`; korábbi szöveges étrend editable tervbe kerül, tételszám/értékek kitalálása nélkül.
5. `005_database_epoch.sql`: helyreállítási generáció.

`db/migrations/001_initial_schema.sql` a régi PostgreSQL-terv, nem fut az aktív kiadásban.

## Invariánsok

- Terv és tény külön. Csak teljesített sorozat és elfogyasztott étel számít. Hiányzó érték NULL; nem a célból becslés.
- Étel tápértéke = rögzítéskori referencia × gramm / 100, 6 tizedesre kerekítve; katalógusváltozás nem írja át.
- Aktív workout és pihenőnap azonos kliens/nap esetén kizárja egymást; SQLite-trigger és API védi.
- A kliens saját edzést/étkezést/állapotot/fotót ír. Mérést a kliens és hozzárendelt edző is új rekordként írhat.
- Mérési dátum DESC, létrehozás DESC, rowid DESC határozza meg az aktuális súlyt. Javítás új mérés.
- Elavult verzió 409; művelet és revízió ugyanabban a tranzakcióban. Idempotens kérés eredménye a válaszküldés előtt commitolódik.
- Nincs végleges kliens/edzés/terv/fotó törlési API. Archivált adat, fotó és revízió a teljes backupban megmarad.
- Fotoszűrés: PNG/JPEG aláírás/méret/dimenzió; a frontend átméretez/újrakódol. Nagy tároláshoz objektumtár kell.
- Session, revízió, fotó és mentés érzékeny. A SQLite nincs alkalmazásszinten titkosítva. A mentések megőrzése az automatikus prefixre korlátozott.
