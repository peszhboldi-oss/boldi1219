# Nyilvános IMPAVIDUS LAB demó

A Vercel-konfiguráció a meglévő frontend és backend bemutatótelepítése. Nem éles tárhely: kizárólag a `demo/impavidus-demo.sqlite` három demófiókja és két mesterséges kliensének 20 napja (2026-09-14–2026-10-03) kerül ki. A helyi `data/` könyvtár nem része a csomagnak.

## Megtekintés és adatok

- Az összes meglévő modul, edzés, sorozat, étrend, kajanapló, napi napló, mérés, fotóillusztráció, megjegyzés és grafikon megnyitható.
- A belépésnél három demófiók választható. A jelszavak nyilvános bemutatójelszavak; lásd `demo/README.md`.
- Az API minden üzleti módosítást és törlést tilt. A bejelentkezés és kijelentkezés működik. A szerveroldali kliens-hozzárendelések megmaradnak.
- A bemutató nézeti dátuma 2026-10-03, hogy a kitöltött utolsó hét és nap látható legyen; ezt a felület jelzi. A munkamenet valódi idő alapján 12 órás, utána újra be lehet lépni.
- A bemutató adatok változatlan forrásként Gitben maradnak. A szerver egy ideiglenes példányt használ a sessionökhöz és a meglévő számításokhoz. Újrainduláskor ugyanaz a teljes mintadatbázis töltődik vissza.

## Futtatás

Node.js 24, függőségtelepítés nélkül. Build: `node scripts/build-public-demo.js`. A Vercel projektben szükséges a legalább 48 karakteres, véletlen `DEMO_SESSION_SECRET` titkos környezeti változó. A kliens ezt nem kapja meg. A szerverfüggvény natív SQLite-ot használ; nem Edge runtime.

A saját gépes alkalmazás továbbra is `node server.js` alatt fut a saját adatbázisával. A demó dátumának és írási tiltásának konfigurációja csak az `api/demo.js` belépési pontban aktív. A `dist/` generált könyvtár.

A felhős build a közös `frontend/domain.mjs` tiszta számításait CommonJS modulformában is előállítja (`generated/demo-domain.cjs`), mert a Vercel Node környezete nem engedi az ESM szinkron `require()` betöltését. A számítások forrása továbbra is egyetlen fájl; a saját gépes backend az eredeti modult használja.

## Elérhetőség és korlátok

A felhős demóhoz nincs helyi alagút, bekapcsolva hagyott PC vagy 36 órás lejárat beállítva. A szolgáltató üzemzavara és fiókkorlátja az elérést befolyásolhatja. Megtekinthető bemutató; új, tartós kliensadat rögzítéséhez adatbázist és fotótárhelyet biztosító éles telepítés szükséges.

A demómunkamenet aláírt HttpOnly cookie segítségével új szerverpéldányon is helyreáll. Az eredeti CSRF- és felhasználónév/jelszó-ellenőrzés aktív. A login sebességkorlátja a meglévő backend példányonkénti korlátja, nem globális terheléskorlát.
