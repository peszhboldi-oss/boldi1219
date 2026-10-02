# IMPAVIDUS LAB – architektúra

## Egy alkalmazás, egy kliens és egy tervezett adatforrás

- **Frontend:** a mellékelt magyar nyelvű, függőség nélküli HTML/CSS/JavaScript PWA marad a termék kiindulópontja. Nincs külön wger- vagy FitHub-frontend.
- **Backend:** az alkalmazást és az `/api/v1` API-t ugyanaz a Node.js fejlesztői folyamat szolgálja ki. Az API jelenleg állapot- és konfigurációs váz; kliensadatot még nem fogad és nem tárol.
- **Adatbázis cél:** PostgreSQL, egyetlen, verziózott SQL-migrációval induló központi séma. A séma megvan, az adatbázis-kliens, migrációfuttató és élő kapcsolat még nincs beállítva.
- **Jogosultság:** a tervezett szerepek `client`, `coach`, `admin`. A `backend/access.js` tiszta policy-segédfüggvényeket ad, de hitelesített munkamenetet még nem állít elő. Minden privát adatvégpont előtt szerveroldali hitelesítés és kliens-hozzárendelés ellenőrzés kell.
- **Licenc:** nincs wger- vagy FitHub-forráskód beemelve. A meglévő felhasználói projekt fájljai az archívumból kerültek át; a két külső repository licencét a korábbi audit dokumentálja.

## Jelenlegi állapot

Az alkalmazás továbbra is demonstrációs, helyi `localStorage` adatokkal indul. Ezt a felület minden belépési pontján demóként jelöljük. A „helyi mentés” kizárólag a böngésző helyi tárolását jelenti. Nincs hálózati adat-szinkron, szerveroldali bejelentkezés, PostgreSQL-kapcsolat vagy telepítés.

## Tervezett mentési és offline modell

1. A Service Worker csak app-shell fájlokat tárolhat gyorsítótárban; érzékeny kliensadatot, fotót vagy API-választ nem.
2. A valódi offline naplózás IndexedDB-be kerül külön kliensoldali adattárként, idempotens műveletazonosítókkal és látható szinkronállapottal.
3. A szerver minden módosítást a hitelesített felhasználó és a hozzárendelt kliens alapján engedélyez. A böngésző által küldött szerep vagy `clientId` önmagában nem jogosultság.
4. Tervmódosítás, gyógyszer-változás, mérés és törlés verzió- vagy auditnyomot kap; ütközés esetén a szerver nem írja felül csendben a másik fél módosítását.

## Fejlesztői futtatás

Node.js 22.13 vagy újabb verzióval:

```sh
npm start
```

Az `.env.example` dokumentációs minta, a folyamat jelenleg nem tölt be `.env` fájlt. A `PORT` közvetlen környezeti változóként adható meg. Az API állapotvégpontja: `GET /api/v1/health`. A `GET /api/v1/ready` szándékosan 503-at ad, amíg az adatbázis nincs bekötve.
