# Utasítások Codexnek – Impavidus Lab

Egy meglévő projekt, vanilla JS frontend (`frontend/`), Node.js 24+ API (`backend/`), SQLite (`db/sqlite/`). Magyar felület. Ne hozz létre párhuzamos alkalmazást vagy új keretrendszert külön kérés nélkül. Nincs függőségtelepítés. Windows: `START_IMPAVIDUS_LAB.cmd`; helyi cím http://127.0.0.1:8082.

## Elfogadott termékszabályok

- Bordó–fekete, minimalista, prémium felület; nincs gamifikáció, AI, chat, fizetés vagy rest timer.
- Felhasználónév és jelszó; nincs e-mail vagy meghívókód. Edző által létrehozott kliensfiók, HttpOnly session, CSRF és szerveroldali hozzárendelés-ellenőrzés. Az `[Alex team]` felirat nem része a felületnek.
- **Terv ≠ tény.** Üres tényadat NULL. Az étrend/előző nap másolása nem fogyasztás. Sorozatcélból nem lesz ténysorozat.
- Tényedzést, kajanaplót, regenerációt és fejlődési fotót a kliens ír. A negyedik lépés kifejezett felhasználói követelménye szerint **mérést a kliens és a hozzárendelt edző is új rekordként rögzíthet**. Korábbi mérés nem írható felül.
- Bemelegítés nem keménysorozat. Súlyzós volumen = tényleges kg × ismétlés. RPE 6–10; kardió és saját testsúly külön kezelődik.
- Teljesített nap = tényleges kajanapló ÉS teljesített edzéssorozat vagy explicit pihenőnap. Gyógyszer/fotó nem számít.
- Hét: hétfő–vasárnap. Hetente egy kihagyás megengedett; második kihagyás megszakítja az aktuális sorozatot. A mai nyitott nap nem kihagyás. A maximum nem csökken. A közös számítás `frontend/domain.mjs`, ugyanazt használja a backend.
- Súlyváltozás = legfrissebb tényleges testsúly − kezdősúly. Heti testsúly kötelező, körméretek opcionálisak. Hét napnál régebbi mérés figyelmeztetést kap.
- Gyógyszer: állandó dózislista és előtte/utána változástörténet. Nincs dózisjavaslat, automatikus dózismódosítás, napi kipipálás vagy beadási mód/hely.
- Vérnyomás, vércukor, vérkép dátuma, víz és kiegészítők opcionális kapcsolók; vérkép alapból KI.
- Étkezésszám 5 vagy 6; katalógus 100 g referenciaérték, grammarányos számítás; étel és terv pillanatfelvétele a tényben megmarad.

## Adatbiztonság és ellenőrzés

IndexedDB outbox és idempotens API már működik; lásd `docs/offline.md`. Függő helyi mentést ne nevezd szervermentésnek. PWA-frissítés csak minden nyitott lap mentett állapota mellett. Visszaállítás új adatbázis-generációt ad és visszavonja a sessionöket; régi outbox nem küldhető automatikusan.

Migráció előtt konzisztens adatbázis-mentés készül. Kézi/automatikus SQLite backup a fotókat is tartalmazza. A mentés és helyi cache nem alkalmazásszinten titkosított. Éles belső hálózati HTTPS-kiszolgálás nincs beállítva. Ne állítsd késznek a nem ellenőrzött telepítést vagy eszköztesztet.

Tesztek: `node tests/run.js`. Szintaktikai ellenőrzés: `node --experimental-vm-modules scripts/check.js` (nem ESLint). Build: `node scripts/build.js`. Indítási hibatesztek: `powershell -File scripts/startup-tests.ps1`, elkülönített tesztmappával. Ne használj éles kliensadatot a tesztekben.

A `legacy/` történeti forrás: ne emelj át fiktív seedadatot vagy ellenőrizetlen localStorage-t. wger/FitHub alkalmazáskód licencdöntés nélkül nem másolható; a saját JSON-adapter külön adatlicencet kezel (`docs/licensing.md`).
