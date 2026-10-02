# Utasítások Codexnek – Impavidus Lab

Futtatás: `node server.js` → http://localhost:8080. Az app egyetlen fájl: `index.html` (vanilla JS, build lépés nélkül). Magyar UI. Ne vezess be keretrendszert, amíg nem kérik.

## Termékszabályok (nem módosíthatók)
- Sötét, bordó akcentusú, minimalista design; nincs gamifikáció, AI, chat, értesítés, rest timer.
- Belépés első verzióban jelszó nélkül: kliens a nevét választja, edző a klienslistát látja.
- **Terv ≠ tény.** Üres tényadatot soha nem becslünk a tervből. Az edző nem írhatja át a kliens tényadatait.
- Bemelegítő sorozat nem számít nehéz szettnek. Tonna = tény kg × tény ismétlés. RPE 6–10.
- **Kitöltött nap** = van kajanapló-bejegyzés ÉS van edzésbejegyzés (explicit „Pihenőnap" is az). Gyógyszer és fotó nem számít.
- **Streak:** hét hétfő–vasárnap. Egy kimaradt nap/hét nem nulláz, a második kimaradt nap ugyanabban a héten nullázza az aktuális streaket. A mai (le nem zárt) nap nem kimaradás. A leghosszabb streak nem csökken. (Implementáció: `streak()`.)
- Mérőszám = aktuális testsúly − induló testsúly (csak a testsúlyból). Heti mérés kötelező mezője a testsúly, kerületek opcionálisak; előzmény sosem íródik felül.
- Gyógyszer: álló dózislista, változásnapló (`mlog`), nincs napi bevétel-jelölés, beadási mód/hely, dózisjavaslat.
- Vérkép alapból KI; bekapcsolva csak dátummező. Vérnyomás/vércukor opcionális beállítás.
- Étkezések száma kliensenként 5 vagy 6. Étel-katalógus per gramm értékekkel (a UI 100 g-ra kér be).

## Ami még hiányzik (priorizált)
1. **Valódi backend + adatbázis** (pl. Supabase/Postgres vagy Firebase) és valódi szinkron; jelenleg csak `localStorage` van, a „Szinkronizálva" jelző csak helyi mentést jelent.
2. **Szerveroldali jogosultságellenőrzés** (kliens csak a sajátját, edző csak a saját kliensei) – jelenleg csak UI-szintű.
3. XLSX export (most CSV szöveg jelenik meg másolásra) és PDF export.
4. Edzői desktop háromoszlopos nézet (klienslista | adatok | heti kulcsmetrikák).
5. 7/30/90 napos statisztikai nézet; grafikonok: napi makró (tény vs cél) külön ábra.
6. Víz és kiegészítők opcionális modul; haladó periodizáció.
7. Étrend: kényelmesebb szerkesztő (étel módosítása/sorrend); edzésterv szerkesztése (sorrend, inaktiválás).
8. Valódi kliensfiók-létrehozás és később account/magic link; több edző, többnyelvűség (a szövegek jelenleg a kódban vannak, érdemes kiszervezni).
9. Tesztek a `streak()` és `wagg()` függvényekre (határesetek: hétváltás, második kimaradás, mai nap, pihenőnap).
