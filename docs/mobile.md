# Telefonos kipróbálás – ideiglenes HTTPS-elérés

A meglévő alkalmazás és adatbázis fut tovább. Egy loopback reverse proxy továbbítja a HTTPS Cloudflare Tunnel kéréseit a helyi appnak, ellenőrzi az eredetet és a kiszolgálónevet, és Secure jelölést ad a munkamenetsütiknek. Az első edző létrehozása távolról tiltott. Nem nyitunk routerportot.

Ez PWA/böngészős telefonos elérés, **nem APK és nem állandó éles hosting**. A számítógépnek ébren kell maradnia; az appnak és a kapcsolatnak futnia kell. A quick tunnel címe újraindításkor változhat. Más címhez más böngészős helyi tárhely tartozik: minden függő mentést szinkronizálj a kapcsolat leállítása előtt. Az offline Android/iOS telepítést valódi készüléken kell ellenőrizni.

## Indítás

1. Indítsd el a START_IMPAVIDUS_LAB.cmd fájlt.
2. A hivatalos cloudflared Windows amd64 program legyen a `tools/cloudflared.exe` helyen, vagy add meg az `IMPAVIDUS_CLOUDFLARED` környezeti változót. A fejlesztési munkakörnyezetben a `../work/mobile-tools/cloudflared.exe` is használható. Nincs npm-függőség.
3. Indítsd a MOBIL_INDITAS.cmd fájlt. A kapcsolat rejtett ablakban fut; a naplók a data/logs mappában vannak.
4. Nyisd meg a MOBIL_CIM.txt HTTPS-címét a telefonon, és lépj be a meglévő fiókkal.
5. Android Chrome: menü → Telepítés / Hozzáadás a kezdőképernyőhöz. iPhone Safari: Megosztás → Főképernyőhöz adás. A menü megnevezése készülékenként változhat.

Leállítás: MOBIL_LEALLITAS.cmd. A helyi app és az adatbázis megmarad.

## Hibakeresés

Az indítás és az ismételt indítás is ellenőrzi a külső HTTPS-címen a saját backend válaszát. Az URL kiírása önmagában nem siker. A háttérfolyamat rendszeresen ellenőrzi a publikus API-t; DNS/HTTP/azonosító-hiba vagy `Unauthorized: Tunnel not found` esetén a helyi állapot és a MOBIL_CIM.txt hibát jelez. Az ismételt MOBIL_INDITAS új kapcsolatot hoz létre a megszűnt helyett, új URL-lel. Nem módosít vagy töröl kliensadatot.

Kézi ellenőrzés: `powershell -File scripts/mobile-launcher.ps1 -Action check`. Kifejezett újraindítás: ugyanaz `-Action restart` kapcsolóval. Az új URL nem állítja helyre a régi URL offline helyi tárhelyét. A lejárt címen lévő függő adatokat őrizd meg; ne töröld a telefon webhelyadatait. A Quick Tunnel tartós, változatlan linkjét ez a hibajavítás nem tudja garantálni.

## Korlátok és továbblépés

Az URL az interneten elérhető; a kliensadatokat az app hitelesítése és jogosultságai védik. A Cloudflare továbbítja és HTTPS-szinten feldolgozza a forgalmat. A quick tunnel fejlesztési/bemutató eszköz, nincs folyamatos rendelkezésre állási garancia. Tartós klienshasználathoz stabil domain, állandó szerver, ellenőrzött mentés-visszaállítás, üzemeltetés és internetes biztonsági ellenőrzés szükséges. Új helyi módosításokat külön eszközökön ne állíts vissza ellenőrzés nélkül.

Hivatalos leírás: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
