# Megőrzött, mesterséges bemutatóadatok

A demo adatbázis az eredeti, 2026. szeptember 14. – október 3. közötti 20 napos
bemutató elkülönített másolata: egy edző, két kliens, naplók, edzések, étrendek,
étkezések, mérések, megjegyzések, fiktív készítményadatok és 40 illusztrációs fotó.
Nem valódi személyek egészségügyi adatai és nem személyre szabott ajánlások.
A tesztfájlok a `tests/` mappában szintén megmaradnak.

## Indítás friss projektmásolatból

Node.js 24 szükséges. Külső npm függőségek telepítése nem kell.

```sh
node scripts/prepare-demo.js
node server.js
```

Megnyitás: http://127.0.0.1:8082/

A demo inicializáló kizárólag hiányzó `data/impavidus.sqlite` fájlt hoz létre;
meglévő adatbázist nem ír felül. Friss másolatban használd, helyi `.env` és
egyedi SQLITE_PATH nélkül. A gyári demo adatbázist ne használd éles kliensadatokhoz.

| Fiók | Felhasználónév | Demo jelszó |
|---|---|---|
| Edző | demo.edzo | ImpavidusDemo-Edzo-2026! |
| Kliens 1 | demo.kliens1 | ImpavidusDemo-Kliens1-2026! |
| Kliens 2 | demo.kliens2 | ImpavidusDemo-Kliens2-2026! |

Ezek a csomag saját, nyilvánosan dokumentált demo jelszavai; eltérnek a jelenlegi
helyi bemutató fiókok jelszavaitól. Munkamenetek és idempotencia-tokenek nincsenek
a csomagban. A helyi alkalmazás adatait és fiókjait az export nem módosítja.

A heti összesítőben a 2026-09-14, 2026-09-21 és 2026-09-28 kezdetű hetek láthatók.
A történeti napok a napló dátumválasztójával érhetők el; az aktuális nap üres lehet.
GitHubon a forrás és letölthető demo található. A teljes alkalmazás Node API-t igényel,
ezért önmagában GitHub Pages nem futtatja.
