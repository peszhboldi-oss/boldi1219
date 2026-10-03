# Aktív adatbázisséma — SQLite

**Runtime:** Node 24 `node:sqlite`, alapértelmezett fájl `data/impavidus.sqlite`. Foreign key ellenőrzés ON, WAL naplózás, 5 másodperces busy timeout. A `Store` induláskor tranzakcióban futtatja az új `db/sqlite/*.sql` migrációkat; a verziók a `schema_migrations` táblába kerülnek. Nincs seed vagy éles kliensadat a migrációban.

| Tábla | Tartalom és kapcsolat |
|---|---|
| `accounts` | UUID, egyedi e-mail, scrypt-hash, client/coach/admin szerep, aktív állapot |
| `clients` | Egy kliensfiókhoz egy profil; alap-/célsúly, magasság, cél, fázis, kezdés, archiválás, profilkép BLOB, preferenciák, monoton maximum-streak, verzió |
| `assignments` | Edzői account UUID + kliens UUID, aktív kapcsolat; objektumjogosultság alapja |
| `sessions` | Opaque token SHA-256 hashe, account, CSRF token, lejárat; nincs nyers session token |
| `invitations` | Meghívó SHA-256 hashe, kliens, lejárat, felhasználási idő |
| `exercises` | Név, elsődleges izomcsoport szövege, eszköz, kategória, aktív állapot, importforrás/UUID/licenc/szerző/URL, verzió |
| `plans` | Kliens/edző, név, kezdődátum, ciklus, jegyzet, rendezett exercise/set JSON, aktív állapot, verzió |
| `workouts` | Kliens/terv/verzió, nap, név, kezdés/vég, jegyzet, in_progress/completed/archived, verzió |
| `workout_sets` | Edzés + gyakorlat, történeti név/izom/eszköz/kategória/jegyzet, sorrend/sorszám, tervezett célok, tényleges mezők, RPE, bemelegítés, kardió perc/km, teljesítési állapot, verzió |
| `rest_days` | Kliens + nap, jegyzet, archiválás; külön adat, nincs sorozat |
| `daily_logs` | Kliens/nap egyedi; napzárás, alvás/energia/panasz/jegyzet és opcionális egészségmezők JSON, verzió |
| `food_logs` | Tényleges ételnév, mennyiség, étkezéssorszám, opcionális teljes elfogyasztott tápértékek, archiválás |
| `measurements` | Új mérési rekord, dátum és kötelező testsúly, opcionális kerületek JSON; nem írjuk felül |
| `notes` | Klienshez tartozó edzői fejlődési megjegyzés, szerző és archiválás |
| `records` | A további modulok átmeneti közös tárolója: szöveges étrend, állandó gyógyszerdózis és privát fejlődési fotó; JSON, verzió, archiválás |
| `revisions` | Entitás + UUID + szerző + idő + előtte/utána JSON; csak a kliens vagy hozzárendelt edző olvassa |

## Migrációk

1. `001_core.sql`: az aktív táblák, indexek, szerep-/kategória-/RPE-korlátok, egyedi aktív edzés/nap és pihenő/nap.
2. `002_snapshots_and_preferences.sql`: tervverzió az edzésben, gyakorlatjegyzet pillanatfelvétele, alapból kikapcsolt vérnyomás/vércukor/vérkép kapcsolók.

A történeti PostgreSQL séma `db/migrations/001_initial_schema.sql` alatt változatlanul megmaradt. Nem futott PostgreSQL-en, és nem ez hozza létre az aktuális SQLite táblákat.

## Invariantok

- A kliens profilja, terve és edzése külön rekord. Ténysorozat kötelező súlya/ismétlése nem származhat a tervből.
- A gyakorlat inaktiválása nem töröl, és a múltbeli sorozat pillanatfelvétele megmarad.
- Tényadatot kizárólag a saját kliens rögzít. Az edző nem módosíthat tényedzést, étkezést, mérést, napi állapotot vagy fejlődési fotót.
- Ugyanazon a napon az aktív workout és rest_day kölcsönösen kizárja egymást; API és SQLite trigger védi. Az archivált workout megmarad, de nem számít statisztikába.
- A mérési előzmény append-only; ugyanarra a napra egy javító új mérés is felvihető. A legutóbbi dátum, azonos napon a legutóbb rögzített rekord az aktuális.
- Mentéskor verzióütközés 409. Adatmódosítás és revízió egy tranzakció.
- A profilkép BLOB és a fotónapló base64 adattartalma privát SQLite-fájlban marad. Ez helyi megoldás; az objektumtár célmodellje nincs élesítve. Nagy fotómennyiség előtt külön privát objektumtár kell.
- Nincs végleges kliens-/edzés-/tervtörlési API. A revíziók érzékeny adatot is tartalmaznak, ezért a teljes adatbázist és a mentéseket egyformán védeni kell.
