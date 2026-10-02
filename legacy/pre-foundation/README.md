# Impavidus Lab – [Alex team]

Prémium, sötét edző–kliens napló (edzés, étrend, kajanapló, mérések, gyógyszer, fotó, heti összesítő). Magyar nyelvű PWA.

## Futtatás
```
node server.js        # http://localhost:8080
# vagy: python3 -m http.server 8080
```
Nyisd meg a böngészőben (telefonon a gép IP-címén). A service worker és a telepíthetőség miatt `http://localhost` vagy HTTPS kell, a `file://` megnyitás nem elég.

## Demó fiókok (nincs jelszó)
A belépőképernyőn: **Szabó Bence**, **Nagy Réka** (egyenként 30 nap adattal) és **Edző**.
Demó adatok visszaállítása: Beállítások → „Demó adatok visszaállítása".

## Szerkezet
| Fájl | Szerepe |
|---|---|
| `index.html` | A teljes alkalmazás (CSS + JS egy fájlban, függőség nélkül) |
| `sw.js` | Offline cache |
| `manifest.webmanifest`, `icon.svg`, `icon-*.png` | PWA telepítés |
| `server.js` | Függőség nélküli helyi szerver |
| `legacy/v1-impavidus-lab.html` | Az első verzió (referencia) |
| `AGENTS.md` | Utasítások Codexnek / más AI-ügynöknek |

## Hogyan épül fel az `index.html`
- **Adat:** egyetlen `db` objektum a `localStorage`-ban (`il2` kulcs). Seed: `seed()`.
- **Műveletek:** az `A` objektum (pl. `A.sdone`, `A.mm`). A kliens tényadatait író műveletek az edzői nézetben le vannak tiltva.
- **Oldalak:** `ad` Adatlap, `nap` Napi napló, `hf` Heti összesítő, `ed` Edzésnapló, `et` Étrend, `kj` Kajanapló, `gy` Gyógyszer, `me2` Mérések, `fo` Fotónapló, `be` Beállítások, `dbd` edzői dashboard, `kat` katalógus.
- **Számítások:** `streak()`, `wagg()` (heti aggregáció), `tot()` (napi makrók), `curW()` (aktuális súly).
- **Szinkron-jelző:** `save()` – offline esetén sorba állít (`db.pend`), online állapotban csak jelzi a mentést.

## Ismert hiányok (következő lépések)
Lásd az `AGENTS.md` fájlt.
