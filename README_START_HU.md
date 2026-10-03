# IMPAVIDUS LAB — indítás Windows alatt

## Ezen a gépen

Az Asztalon elkészült az **IMPAVIDUS LAB** parancsikon. Dupla kattintásra elindul a helyi szolgáltatás, megvárja az adatbázis/API/felület ellenőrzését, majd megnyitja az alapértelmezett böngészőt.

**Állandó cím: http://127.0.0.1:8082**

A napi használathoz nem szükséges terminál vagy külön adatbázis-kezelő. A böngésző bezárása után a háttérben futó alkalmazás megmarad. A leállításhoz a projektmappában kattints a `STOP_IMPAVIDUS_LAB.cmd` fájlra.

## Első telepítés másik gépen

1. Csomagold ki a teljes projektet egy saját, írható mappába. Ne a ZIP-ben indítsd, és ne másold rá ellenőrzés nélkül egy adatokat tartalmazó régi mappára.
2. Szükséges: Windows PowerShell 5.1 vagy újabb, Node.js **24 vagy újabb**, korszerű Chrome vagy Edge. Docker, PostgreSQL és npm csomagtelepítés nem szükséges.
3. Ha nincs megfelelő Node, telepítsd a hivatalos kiadást a [Node.js oldaláról](https://nodejs.org/en/download). A segéd nem telepít automatikusan rendszerprogramot. Ezen a fejlesztői gépen a már meglévő Node-runtime-ot is megtalálja.
4. Duplán kattints az `INSTALL_IMPAVIDUS_LAB.cmd` fájlra. Előkészíti a konfigurációt, az adatbázist és a migrációkat, ellenőrzi az indulást, majd felajánlja az asztali ikon létrehozását. A meglévő `.env` fájlt és parancsikont nem írja felül.
5. A megnyíló alkalmazásban te hozd létre az első edzői felhasználónevet és jelszót. Nincs gyári fiók vagy alapértelmezett jelszó.

## Fájlok

| Fájl | Feladat |
|---|---|
| `START_IMPAVIDUS_LAB.cmd` | Indítás és böngésző megnyitása; futó saját példányt újrahasznál |
| `STOP_IMPAVIDUS_LAB.cmd` | Szabályos leállítás, adatok megtartásával |
| `RESTART_IMPAVIDUS_LAB.cmd` | Leállítás, majd ellenőrzött újraindítás |
| `CHECK_IMPAVIDUS_LAB.cmd` | Futó backend, API, SQLite, frontend, konfiguráció és szabad hely ellenőrzése |
| `INSTALL_IMPAVIDUS_LAB.cmd` | Első telepítés előkészítése |
| `CREATE_DESKTOP_SHORTCUT.ps1` | Valódi Windows `.lnk` létrehozása; az installer hívja |
| `RESTORE_IMPAVIDUS_LAB.cmd` | Mentés kiválasztása, megerősítése, leállítás és visszaállítás |
| `INDITAS.cmd` | A START fájl korábbi, továbbra is használható neve |

A projektmappa áthelyezésekor a régi ikon útvonala elavul. A régi parancsikont ellenőrizd és nevezd át, majd az új mappából az INSTALL segítségével készíts újat.

## Hol vannak az adatok?

- `data/impavidus.sqlite`: fiókok, kliensprofilok, naplók, tervek, mérések, fotók, beállítások és előzmények.
- `data/impavidus.sqlite-wal` / `-shm`: SQLite működési fájlok; futás közben ne töröld őket.
- `backups/`: ellenőrzött, dátumozott mentések. A fotók az adatbázisban vannak, ezért ezekben is szerepelnek.
- `data/migration-backups/`: migráció előtti biztonsági példányok.
- `data/restore-backups/`: visszaállítás előtti adatbázismentések.
- `data/logs/`: indítási és működési naplók.
- A még nem szinkronizált offline módosítások az adott böngészőprofil IndexedDB adattárában vannak. Ezeket a szerver mentése csak szinkronizálás után tartalmazza.

Ne töröld a böngésző webhelyadatait, amíg függő mentés van. Ne másold önmagában a futó SQLite főfájlját biztonsági mentésként.

## Hibák

| Jelzés | Teendő |
|---|---|
| Node hiányzik vagy régi | Telepíts Node 24+ kiadást, majd indíts újra |
| A port foglalt | Másik saját példány esetén a START újrahasználja; idegen szolgáltatásnál nézd meg a naplót, ne állíts le találomra folyamatot |
| Az alkalmazás nem fut | START, majd CHECK |
| Adatbázishiba | Őrizd meg a teljes `data` mappát, válassz ellenőrzött mentést; ne hozz létre üres adatbázist a régi helyére |
| 100 MB alatti szabad hely | Szabadíts fel helyet; az adatbázist és a mentéseket őrizd meg |
| Böngésző nem nyílt meg | Ellenőrizd az alapértelmezett böngészőt, és nyisd meg a fenti címet |
| Szinkronhiba | Beállítások → Függő mentések / hibák; exportáld és vesd össze a helyi változást |

Az alkalmazás ezen a gépen loopback címen működik. Másik gép vagy valódi telefon nem a saját `127.0.0.1` címével éri el. Belső hálózatos többeszközös használathoz külön HTTPS/proxy- és hozzáférési beállítás szükséges; ez nincs automatikusan bekapcsolva.
