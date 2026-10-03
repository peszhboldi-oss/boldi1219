# Tesztelési követelmények és reprodukció

## Automatikus tesztek

`npm test` → `tests/run.js` egy folyamatban tölti be a Node beépített tesztjeit. Nincs worker-process vagy új függőség. A tesztek memória-/ideiglenes SQLite adatbázissal, szintetikus e-mail-címekkel, jelszavakkal és kliensadatokkal futnak; nem használják a `data/impavidus.sqlite` állományt.

| Előírt ellenőrzés | Bizonyíték |
|---|---|
| Új kliens | HTTP create → adatbázisprofil + assignment |
| Módosítás megmarad | HTTP patch → új GET, továbbá mentésből új Store és böngészős reload |
| Új gyakorlat | HTTP create; duplikáció/hibás kategória elutasítás; böngészős űrlap |
| Új terv / hozzárendelés | HTTP create, client FK; böngészős tervszerkesztő két sorozattal |
| Kliens saját terve | Közvetlen felhasználónév/jelszó belépés, saját plans olvasás; idegen kliens 404 |
| Ténysorozat / adatbázis | HTTP set patch, SQL-visszaolvasás, GET, backupból visszaolvasás; mobilos mentés |
| Korábbi tényértékek | Második edzés previous mező és böngészős előző eredmény |
| Heti statisztika | 20×10 bemelegítő + 60×8 munkasorozat → 680 kg, 1 keménysorozat, RPE (6+8)/2 = 7 |
| Bemelegítő kizárása | Egységteszt és HTTP statisztika; a volumenbe beleszámít |
| Pihenőnap | Külön tábla, aktív edzéssel 409, archiválás után rögzíthető |
| Jogosultság | Másik kliens / nem hozzárendelt edző / edzői tényírás / kliens tervírás tiltása |
| Korábbi modulok | Tíz menücél, kézi étkezés, mérés, dózismódosítás és napi napló API; archivált demó megőrizve |
| Mobil | Valódi böngészőben 360/390 px viewport; tervűrlap, menü, sorozatmentés, grafikon és túlcsordulásellenőrzés |

További invariánsok: hétváltás, második hiány, nyitott/lezárt mai nap, hiányzó kajanapló, monoton maximum, RPE 6–10, valódi nulla súly, hiányzó érték NULL, cardio/bodyweight elkülönítés, version 409, gyakorlat inaktiválás után történeti név, tervmódosítás után történeti célok, extra ténysorozat nem módosít tervet, CSRF/origin, privát PNG és tiltott SVG, licencelt import duplikáció, szintetikus wger sémaadapter.

## Build és kódellenőrzés

`npm run check`: JavaScript szintaxis VM Script/SourceTextModule segítségével; nem telepített linter. Az eredeti spawn-alapú ellenőrzés ebben a Windows sandboxban EPERM hibát adott, ezért végleges megoldásként folyamatindítás nélküli ellenőrzés készült.

`npm run build`: kilenc frontend-fájl másolása + buildmanifest a `dist/` alatt. Nincs minifikáló vagy külső buildeszköz. A backend továbbra is a teljes projektből indul. A build nem bizonyít éles telepítést.

## Böngészős ellenőrzés

A végrehajtott böngészős ellenőrzések a Codex böngészőjével, elkülönített `work/browser-test.sqlite` adattáron és `127.0.0.1:8081` tesztpéldányon történtek. Ezek nem az `npm test` automatikus futás részei. Újrafuttatáskor a fenti tesztmátrixot végig kell járni, saját fiktív fiókokkal. A tényleges telefonos hardver és Safari nincs ellenőrizve.

A build, a szintaktikai vizsgálat és a backend integrációs tesztek külön-külön ellenőrizhetők. A mentés-visszaolvasás integrációs tesztelt; éles gép teljes helyreállítási gyakorlatát nem helyettesíti.

## Felhasználónév-alapú belépés

`tests/username.test.js`: a régi SQLite adatbázis adat-, jelszóhash- és munkamenetmegőrző átállása; kis-/nagybetűtől független egyediség; tranzakciós klienslétrehozás; hozzárendelés és szerepellenőrzés; üres jelszómező megtartása; jelszócsere utáni session-visszavonás; verzióütközés; jelszómentes revíziók.
