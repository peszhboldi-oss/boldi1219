# Utasítások Codexnek – Impavidus Lab

Futtatás: Node.js 24+, `node server.js` → http://127.0.0.1:8082 vagy Windows alatt `INDITAS.cmd`. Egy vanilla JS frontend (`frontend/`), egy Node API (`backend/`), valódi SQLite (`db/sqlite/`). Magyar UI. Ne vezess be keretrendszert, amíg nem kérik. Tesztek: `node tests/run.js`, kódellenőrzés: `node --experimental-vm-modules scripts/check.js`, build: `node scripts/build.js`.

## Termékszabályok (nem módosíthatók)
- Sötét, bordó akcentusú, minimalista design; nincs gamifikáció, AI, chat, értesítés, rest timer.
- A harmadik lépés szerveroldali hitelesítési követelménye felváltotta a régi jelszó nélküli demóbelépést: edzői fiók, egyszer használható kliensmeghívó, HttpOnly session, CSRF és adatbázisból ellenőrzött hozzárendelés szükséges.
- **Terv ≠ tény.** Üres tényadatot soha nem becslünk a tervből. Az edző nem írhatja át a kliens tényadatait.
- Bemelegítő sorozat nem számít nehéz szettnek. Tonna = tény kg × tény ismétlés. RPE 6–10.
- **Kitöltött nap** = van kajanapló-bejegyzés ÉS van edzésbejegyzés (explicit „Pihenőnap" is az). Gyógyszer és fotó nem számít.
- **Streak:** hét hétfő–vasárnap. Egy kimaradt nap/hét nem nulláz, a második kimaradt nap ugyanabban a héten nullázza az aktuális streaket. A mai (le nem zárt) nap nem kimaradás. A leghosszabb streak nem csökken. Implementáció: `backend/metrics.js` → `streak()`. Egy üresen megnyitott edzés nem teljesített nap.
- Mérőszám = aktuális testsúly − induló testsúly (csak a testsúlyból). Heti mérés kötelező mezője a testsúly, kerületek opcionálisak; előzmény sosem íródik felül.
- Gyógyszer: álló dózislista, változásnapló (`mlog`), nincs napi bevétel-jelölés, beadási mód/hely, dózisjavaslat.
- Vérkép alapból KI; bekapcsolva csak dátummező. Vérnyomás/vércukor opcionális beállítás.
- Étkezések száma kliensenként 5 vagy 6. Étel-katalógus per gramm értékekkel (a UI 100 g-ra kér be).

## Következő fejlesztések
1. IndexedDB outbox, idempotens API-mentés és valódi szinkron; lásd `docs/offline.md`. A jelenlegi mentést ne nevezd offline szinkronnak.
2. Üzemeltetés: HTTPS, fiókhelyreállítás/MFA, PostgreSQL-adapter és privát objektumtár, titkosított és ütemezett mentés.
3. Részletes ételkatalógus, grammonkénti étrendterv és XLSX/PDF-export. A mostani étrend szöveges; a kézi kajanapló valódi tényadat.
4. Több edző hozzárendeléseinek adminfelülete, többnyelvűség, 7/30/90 napos egységes nézet.
5. A demó régi forrása `legacy/step2-index.html`; ne importálj belőle fiktív seedadatot vagy előzetesen nem ellenőrzött localStorage tartalmat.
6. wger/FitHub alkalmazáskódot licencdöntés nélkül ne másolj. A saját wger JSON-adapter külön adatlicencet és forrást kezel.
