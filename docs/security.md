# Biztonsági állapot és hiányzó konfiguráció

## Ami jelenleg működik

- A fejlesztői HTTP-szerver JSON API-válaszokat ad egységes problémaformátumban, request ID-t állít be és strukturált, személyes adatot nem tartalmazó kérésnaplót ír.
- Alap biztonsági HTTP-fejlécek vannak beállítva.
- A publikus statikus fájlok allowlistje nem szolgálja ki a forráskódot, SQL migrációkat, `.env`-fájlt vagy `legacy/` tartalmat.
- A szerep- és objektumhozzáférési policy segédfüggvények egységteszteltek.

## Ami még nincs bekapcsolva

- Fióklétrehozás, jelszóhash-elés, MFA, session cookie, refresh/rotation, CSRF-védelem és session visszavonás.
- PostgreSQL-driver/kapcsolat, migrációfuttatás és API-adatvégpontok.
- Szerveroldali auditadat-rögzítés és fájlfeltöltési védelem.
- Valódi export, mentés és visszaállítás.

Ezért a PWA jelenlegi névválasztós belépése **csak demónavigáció**, szerveroldali védelmet nem ad. Ne használj benne éles személyes adatot. A `.env.example` szándékosan nem tartalmaz titkot; a `SESSION_SECRET` jelenleg nincs használatban.
