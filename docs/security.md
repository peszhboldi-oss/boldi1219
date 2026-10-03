# Biztonsági alapok és használati határok

## Megvalósított védelem

- Username/password, scrypt és véletlen opaque session; csak tokenhash az adatbázisban. HttpOnly, SameSite=Strict; production Secure cookie + HTTPS PUBLIC_ORIGIN kötelező.
- CSRF, same-origin ellenőrzés, szerveroldali szerep + aktív assignment. Idegen kliens 404, nem hitelesített API 401. Archivált kliens nem írhat, session visszavonva.
- A Repository az elvárt account UUID-t is küldi; a szerver eltérő session esetén 401-et ad még adatlekérés előtt. Másik lapon váltott fiók adata nem kerül a régi account helyi cache-ébe.
- Az edző nem írhatja a kliens edzés/étkezés/napi állapot/fotó tényét; új mérés kifejezetten megengedett a negyedik lépés szerint.
- Paraméterezett SQL, tranzakció, verzióütközés, idempotencia. A nyugta újraküldése előtt is jogosultságellenőrzés.
- Statikus fájl-allowlist: `.env`, source backend, SQLite, backups és legacy nem webes letöltés. CSP, no-sniff, frame tiltás, API no-store és request ID.
- Request méretkorlát; fotó csak PNG/JPEG, 1 MB, maximum 4096×4096, aláírás/formátumellenőrzés. SVG tiltott; frontend canvas újrakódolás. Teljes szerveroldali képdekóder/malware-szűrés nincs.
- Revíziók előtte/utána adatokkal. Hitelesítési jelszó/hash nem kerül revízióba vagy normál logba. A strukturált HTTP-log útvonalakat rövidít, nem naplózza body/cookie-t.
- Privát IndexedDB fiókszétválasztás, 12 órás offline session, függő mentés mellett logout tiltás. Szinkronnak érvényes ugyanazon session kell.
- Visszaállítás: integritás, futó szolgáltatás tiltása, jelenlegi adatbázis megőrzése, session/receipt törlés, új database epoch. Automatikus backup ellenőrzött és dátumozott, fotókkal.

## Helyi üzemeltetés

A backend 127.0.0.1-en figyel. A belső hálózat nem indok a jelszó vagy szerveroldali jogosultság elhagyására; ezeket megtartottuk a felhasználó kérte username/password belépéssel.

A SQLite, backup, export és IndexedDB **nem alkalmazásszinten titkosított**. Másik Windows-felhasználó, böngészőprofil és backup-hozzáférés megfelelően elválasztandó. A helyi control-token adatfájlban van; OS-fájljogosultság védi, hálózati endpoint nem adja ki. A fotók/revíziók archiválás után is megmaradnak; megőrzési/törlési eljárás külön üzemeltetési döntés.

Az edzői teljes backup az egész helyi adatbázist menti, nem csak a kiválasztott klienst; a felület nem adja ki a backup tartalmát vagy privát elérési útját. A helyi gép üzemeltetőjének fájlhozzáférése ettől külön jogosultság.

## Még nem beállított vagy nem ellenőrzött

LAN HTTPS/reverse proxy, tűzfalszabály, központi audit/riasztás, alkalmazásszintű titkosítás, MFA, önkiszolgáló jelszó-visszaállítás, külön privát objektumtár, több írós üzem és szervezeti adatmegőrzés. Tényleges egészségjellegű többfelhasználós szolgáltatás előtt ezek beállítása/elfogadása szükséges. A mostani működő helyi kiadás nem bizonyítja az éles konfigurációt.

## Adatvédelem fejlesztés alatt

A tesztek memória vagy külön ideiglenes SQLite-ot és szintetikus kliensadatot használnak. A böngészős teszt 8083-on, külön `work` adatbázissal futott; a tényleges 8082-es adatbázisba nem került tesztfiók vagy kitalált mérés. A Git és kiadási ZIP kizárja `.env`, data, backups, session/control-token és adatbázis fájlokat.
