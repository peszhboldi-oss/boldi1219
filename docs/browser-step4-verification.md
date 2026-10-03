# Böngészős elfogadási jegyzőkönyv — 2026-10-03

Elkülönített http://127.0.0.1:8083 tesztkörnyezet; szintetikus accountok és adatok. A tényleges felhasználói alkalmazás 8082-es SQLite-adatbázisa külön maradt. Nincs éles mérés/fotó a tesztben; a képfeltöltés saját alkalmazásikonból történt.

| Próba | Megfigyelt eredmény |
|---|---|
| Kliens belépés | Felhasználónév/jelszó után csak saját profil |
| Edző belépés | Hozzárendelt tesztkliens, tervkezelés |
| Étrend létrehozása | „Böngészős tesztterv”, 6 étkezés, 2300 kcal cél, 150 g katalógustétel szerverre mentődött |
| Terv/fogyasztás | Másolt tétel csak előkészített; Elfogyasztottam után 300 kcal, 30 g fehérje, 15 g CH, 7,5 g zsír |
| Napi állapot | 8 óra alvás, stressz=2 mentés és reload |
| Preferenciák | 6 étkezés és víz bekapcsolva, reload és PWA-frissítés után megmaradt |
| Offline mérés | Szerver leállítva, offline PWA reload, 88,4 kg rögzítve, pending=1; második reload megőrizte |
| Mérés szinkron | Szerver indítása után automatikus pending=0; API/SQL pontosan 1 mérés |
| Offline új edzés | Cached tervből nyitva, célok mellett ténymezők üresek; pending=1 |
| Offline sorozat | 52,5 kg × 10, pending=2; reload megőrizte; szerverindítás után automatikusan 1 edzés/1 sorozat, 525 kg |
| Új offline saját étel | 20 g fehérje/100 g, helyben választható katalógustétel; pending=1 |
| Függő étkezés | A még nem szinkronizált ételből 150 g előkészített tétel, 30 g fehérje, consumed=0, pending=2; reload megőrizte |
| Étel/étkezés szinkron | Automatikusan 1 saját étel, 1 helyesen hivatkozó draft étkezés; pending=0; tényleges napi bevitel maradt 300 kcal/30 g |
| Nyitott űrlap | Szinkron közben a „Mentetlen mező megőrzési próbája” érték változatlanul megmaradt; tesztérték nem lett beküldve |
| Fotó | Saját PNG ikon feltöltése, reload megőrizte, nagyítás, két dátum összehasonlítása |
| Heti összesítő | Hétfő–vasárnap; 1 teljesített nap, 1 keménysorozat, 525 kg, 300 kcal, 30 g F, aktuális mérés 88,4 kg |
| PWA waiting | Új verzió nem lépett automatikusan a folyamatban lévő adatbevitelre |
| Több lap frissítése | Második lapon nyitott és kitöltött mérési űrlap blokkolta; Mégse után minden lap jóváhagyott, frissítés sikerült |
| Mobil navigáció | Mind a 10 oldal 390×844 viewporton, menün keresztül betöltött; nincs dokumentumszintű horizontális túlcsordulás |
| Asztali felület | Navigáció, űrlapok, grafikonok, címek, státuszok ténylegesen megnyitva |
| Konzol | Az utolsó online heti ellenőrzésben nincs rögzített JavaScript error |

A mobilnézet pontos eredménye `outputs/impavidus-step4-mobil-ellenorzes.json`, a visszaolvasás `outputs/impavidus-step4-api-visszaellenorzes.txt`. A képernyőképek szintetikus tesztnézetet mutatnak.

Az XLSX böngészős download-event megfigyelése timeoutot adott a környezetben. A tényleges hétre és jogosultan kért API-exportfájl elkészült: 7 munkalap, ZIP CRC és összes XML/rels valid, openpyxl független olvasóval 300 kcal/30 g F/525 kg/88,4 kg visszaolvasva. Microsoft Excel grafikus alkalmazás megnyitása nem történt.

Ez a jegyzőkönyv tényleges próbákat rögzít, nem minden böngészőre/eszközre automatizált regressziós suite. Mobilos telepítési dialógus, hosszú terhelés, tárhely-kilakoltatás és külön Windows 10/11 gép további elfogadási teszt.
