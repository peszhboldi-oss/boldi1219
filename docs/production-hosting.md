# Tartós, a helyi géptől független üzemeltetés

Állapot: előkészített Linux-konfigurációk, még nem telepített és nem ellenőrzött éles szerver.
Nincs megvásárolt tárhely, beállított domain vagy végleges publikus cím.

## Architektúra

Telefon/böngésző → HTTPS Caddy → 127.0.0.1:8082 Node.js 24 → tartós SQLite.
Egyetlen alkalmazáspéldány; a jelenlegi felhasználónév/jelszó rendszer megmarad.
A Node API nem kap közvetlen nyilvános portot. A domain és a PUBLIC_ORIGIN egyezzen.
Caddy megtartja a Host/Origin fejléceket; itt nem a mobil-tunnel fejléceket átíró proxyját használjuk.

Induló méretezési javaslat kis klienskörhöz: 2 vCPU, 4 GB RAM, 40–80 GB SSD,
EU-s helyszín, Ubuntu 24.04 LTS, nyilvános IPv4. Ez becslés, nem terhelésmérési eredmény.
Sok fotóhoz a tényleges adatméret és növekedés alapján kell több lemez.
Egy szerver nem magas rendelkezésre állású klaszter; karbantartáskor lehet kiesés.

## Telepítési sorrend – a szerver rendelkezésre állása után

1. Tulajdonosi fiók és számlázás a szolgáltatónál; SSH-kulcsos adminhozzáférés.
2. Linux biztonsági frissítések, támogatott Node.js 24 és Caddy telepítése a szerverre.
   Ellenőrizni kell a Node tényleges helyét: a service minta `/usr/bin/node`-ot használ.
3. Külön `impavidus` rendszerfelhasználó létrehozása. A forrás `/opt/impavidus-lab`
   alá kerüljön, root tulajdonnal, az alkalmazás számára olvashatóan.
   Teljes futtatási forrás kell, nem csak a frontend `dist/` mappája.
   A helyi `.env`, adatok, mentések, demo belépési dokumentumok és tunnel eszközök
   ne kerüljenek a forráscsomagba; az adatátvitel külön, ellenőrzött lépés.
4. `/var/lib/impavidus-lab` és `/var/backups/impavidus-lab` létrehozása,
   `impavidus:impavidus` tulajdonnal, 0700 jogosultsággal.
   `/opt/impavidus-lab/data` legyen szimbolikus link a `/var/lib/impavidus-lab`
   mappára, mert a helyi folyamatvezérlő is ebbe ír. Meglévő data mappát előbb
   ellenőrizni és megőrizni kell; azt nem szabad vakon felülírni.
5. `deploy/linux/production.env.example` másolata `/etc/impavidus-lab.env`,
   valódi domainnel, root tulajdonnal és 0600 jogosultsággal.
   A szerver forrásmappájában ne legyen a helyi fejlesztési `.env`.
6. A saját domain DNS A rekordja a szerver IPv4-címére mutasson.
   AAAA rekord csak ténylegesen beállított IPv6 esetén legyen.
   Tűzfal: 80/443 a webhez; SSH csak az admin számára. A 8082 ne legyen nyilvános.
7. `deploy/linux/Caddyfile` domainjének cseréje, beillesztése az ellenőrzött
   Caddy-konfigurációba. Meglévő Caddyfile-t előbb menteni kell.
   `caddy validate --config /etc/caddy/Caddyfile`, majd szolgáltatás indítása.
   A DNS és elérhető portok szükségesek az automatikus HTTPS-hez.
8. Adatköltöztetés az alábbi szabályok szerint, a célalkalmazás indulása előtt.
9. Service másolása `/etc/systemd/system/impavidus-lab.service` alá;
   `systemctl daemon-reload`, majd `systemctl enable --now impavidus-lab`.
   Hibák: `journalctl -u impavidus-lab`. A naplókhoz hozzáférés korlátozandó.

## Adatköltöztetés és átállás

- A felhasználók előbb szinkronizálják vagy exportálják a függő offline mentéseket.
  Másik domain másik böngészőtárhely: a régi outbox nem kerül át automatikusan.
- Egyeztetett átállási időben leállítjuk a régi írási lehetőséget, konzisztens
  SQLite-mentést készítünk a meglévő backup paranccsal. A fotók az adatbázisban vannak.
  Futó SQLite nyers másolata a WAL fájl kihagyásával nem elfogadható migráció.
- Az eredeti adatbázist és mentést megtartjuk. A mentés SSH-n kerül a szerverre,
  integritás- és rekordszám-ellenőrzéssel; a forrás és cél sémaverziója egyezzen.
- Egy időben csak az egyik példány fogadjon éles írásokat. Az átállás utáni
  szerveradatok nélkül nem szabad egyszerűen visszakapcsolni a régi példányra.
- Új címen új belépés szükséges. A másolt munkamenetek visszavonását és a régi
  offline eszközök rendezését az átállás részeként kell megtervezni.
- Demo fiókok ismert jelszavait éles közzététel előtt cserélni kell.
  Ha üres adatbázissal indulunk, első edző csak a szerver CLI-jével hozható létre;
  production módban a nyilvános setup tiltott.

## Mentés és felügyelet

Az app naponta ellenőrzött SQLite-mentést készít, fotókkal, 30 példány megőrzésével.
Ez ugyanazon szerveren marad, ezért önmagában nem véd a teljes szerver elvesztésétől.
Kell külön, hozzáféréssel védett, lehetőleg titkosított külső mentési cél;
az offsite másolás még nincs beállítva. A szolgáltatói lemezkép is kiegészítő mentés.
Az alkalmazás mentéseit tesztkörnyezetben ténylegesen vissza kell állítani.
Külső elérhetőségi felügyelet: `/api/v1/health`; a teljes `/ready` integritásvizsgálat
ritkábban fusson. Lemeztelítettség, mentési hibák, szolgáltatásleállás kapjon riasztást.

## Közzététel előtti elfogadás

- Elkülönített tesztadatokon projekt tesztek, szintaktikai ellenőrzés és build.
- HTTPS, belépés, Secure/HttpOnly cookie, CSRF és coach/client adatszigetelés.
- Mobilhálózatról valódi telefonos naplózás, fotó és offline → online szinkron.
- Szerver-újraindítás után automatikus indulás és korábbi adatok megmaradása.
- Mentés-visszaállítás elkülönített környezetben; lemez- és memóriahasználat mérés.
- A helyi PC kikapcsolása mellett a végleges domain működése.

Források:
- https://caddyserver.com/docs/automatic-https
- https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
- https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html
