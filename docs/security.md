# Biztonsági állapot

## Megvalósult és ellenőrzött

- Jelszó: véletlen 16 bájtos só + scrypt 64 bájtos hash; összehasonlítás timingSafeEqual-lal. 12–128 karakteres jelszó; hibás vagy nem létező fióknál azonos hiba.
- Munkamenet: véletlen 32 bájtos token, csak SHA-256 hashe kerül a SQLite-ba, 12 órás lejárat; HttpOnly, SameSite=Strict cookie. HTTPS módban Secure. Kijelentkezés és kliensarchiválás visszavonja.
- Írások: JSON content type, eredetellenőrzés, cross-site Fetch Metadata elutasítás és munkamenethez tartozó CSRF token. Privát API nem ad CORS-hozzáférést.
- Fiók és klienskapcsolat az adatbázisból; a kérés szerepmezője nem dönt jogosultságról. Kliens saját adatot, edző saját hozzárendelést ér el. Tényadatok az edzőnek csak olvashatók.
- Paraméterezett SQL, bemeneti mező- és tartományvalidáció, 1,8 MB kéréslimit, személyes adatok nélküli hibanapló, request ID, archiválás és revíziók.
- Profilkép: autentikált feltöltés/olvasás, base64 → bináris, max. 1 MB, PNG/JPEG signature és szerkezeti méretellenőrzés, max. 4096×4096. SVG/HTML elutasítva. Nem fogadunk fájlnevet vagy tárolási útvonalat. A normál felület canvasban újrakódol JPEG-re, így metaadatot nem küld. A szerver nem teljes képdekóder vagy víruskereső.
- CSP csak saját scripteket enged; nincs inline handler, külső font vagy analitika. A UI escape-eli a felhasználói szöveget. Privát adat nem kerül a Service Worker cache-be.
- Statikus allowlist kizárja a backend, SQL, `.env`, adatbázis, backup és legacy tartalmat. API-válaszok `Cache-Control: no-store`.
- Belépési próbák: account/IP páronként 10 hibás kísérlet / 15 perc, memóriában. Újraindításkor ez a számláló törlődik; éles többpéldányos szolgáltatáshoz központi rate limit kell.

## Helyi használat és élesítés

Alapból csak loopback HTTP-t használunk. A localhost PWA környezet nem egyenlő egy telepített, interneten biztonságosan elérhető szolgáltatással. A Host allowlist localhost/127.0.0.1/[::1] értékeket enged, illetve a konfigurált `PUBLIC_ORIGIN` domainjét. Az első-edző bootstrap production módban letiltott; éles forgalom előtt az edzőt helyben vagy a szerver CLI-jével kell inicializálni.

Élesítéshez: HTTPS reverse proxy változatlan Host-tal, Secure cookie, megfelelő tűzfal és szerverfiók-jogok, teljes lemeztitkosítás, titkosított külső mentés és visszaállítási gyakorlat, adatmegőrzési/törlési folyamat, naplókezelés. Többgépes íráshoz PostgreSQL-adapter és privát objektumtár. Jelenleg nincs MFA, jelszóhelyreállítás, e-mail-verifikáció vagy automatizált mentés. Ezek nem kész funkciók.

## Mentés és visszaállítás

`npm run backup` a SQLite online backup API-jával konzisztens, külön fájlt készít a `backups/` alatt. Nem másoljuk önmagában az élő WAL-os adatbázisfájlt. A mentés teljes személyes adatot és jelszóhasheket tartalmaz, **nem titkosított**.

Visszaállítás: állítsd le a szervert; őrizd meg a jelenlegi DB és esetleges WAL/SHM fájlok külön másolatát; új könyvtárba másold a backupot; ellenőrizd `PRAGMA integrity_check` és a migrációverziókat; `SQLITE_PATH` átállítással az új fájlból indíts. Ne keverd egy régi backupot egy másik DB korábbi WAL/SHM fájljaival. Az integrációs teszt külön mentésből új `Store` példányt nyit, ellenőrzi a klienst és a ténysorozatot.
