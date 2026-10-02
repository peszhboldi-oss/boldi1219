# IMPAVIDUS LAB — [Alex team]

Magyar nyelvű, prémium edző–kliens napló PWA. Ez az archívumban kapott saját alkalmazás kibővített, egyprojektes alapja; a wger és FitHub kódjából nem került át komponens.

## Állapot

Az alkalmazás jelenleg **demó**: a kliensválasztás nem hitelesítés, a mintarekordok fiktívek, és az adatok a böngésző `localStorage`-ában maradnak. A látható jelző ezt mutatja. Ne tárolj benne éles kliensadatot. PostgreSQL, valódi fiók, szerveroldali jogosultság és szinkron még nincs bekötve. Az API health végpontja ezeket konfigurálatlanként jelzi, az adatvégpontok nem írnak adatot.

## Futtatás

Node.js 22.13 vagy újabb, további csomag telepítése nélkül:

```sh
npm start
```

Nyisd meg: <http://127.0.0.1:8080>. PWA telepítéshez localhost vagy HTTPS kell. Csak az app-shell fájlok kerülnek a Service Worker cache-be; az API- és személyes adatokat a service worker nem cache-eli.

## Ellenőrzések

```sh
npm test
npm run check
```

Az integrációs adatbázis célja PostgreSQL. A `db/migrations/001_initial_schema.sql` létrehozza az üres adatmodellt; automatikus migrációfuttató és Postgres-kapcsolat még nincs.

## Fő fájlok

| Útvonal | Feladat |
|---|---|
| `index.html` | Jelenlegi magyar PWA felület és demófunkciók |
| `server.js`, `backend/` | Egy folyamatban futó statikus kiszolgáló és API-váz |
| `backend/access.js` | Kliens/edző/admin hozzáférési policy-segédek; nincs aktív auth provider |
| `db/migrations/` | PostgreSQL induló séma, demórekordok nélkül |
| `tests/` | Node beépített tesztfuttatójával futó API-, útvonal- és policy-tesztek |
| `docs/` | Architektúra, adatmodell és biztonsági hiánylista |
| `legacy/pre-foundation/` | A ZIP-ből kicsomagolt, módosítás előtti projektfájlok megőrzött másolata |
| `legacy/v1-impavidus-lab.html` | Az archívumban kapott első verzió |

## Konfiguráció

`.env.example` tartalmazza a tervezett változókat, titok nélkül; a jelenlegi szerver még nem tölt be `.env` fájlt. A `PORT` környezeti változót közvetlenül olvassa. `DATABASE_URL` és `SESSION_SECRET` még nincs használatban; PostgreSQL és hitelesítés nincs beállítva.
