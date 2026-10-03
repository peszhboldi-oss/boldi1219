# Offline PWA és szinkronizáció

## Megvalósítás

A Service Worker kizárólag a verziózott felületet cache-eli. Az API CacheStorage-t nem használ. A privát cache és mentési sor IndexedDB-ben, fiókonként külön kulccsal van. Első belépés online; korábbi session legfeljebb 12 órás offline használatot enged. Nincs helyben jelszó/CSRF tárolva.

Business írás sorrendje:

1. Atomikus, tartós sorszám és UUID műveletkulcs, POST-nál stabil rekordazonosító; edzésnél tervverzió és stabil sorozatazonosítók.
2. Tartós outbox-írás **a hálózati kérés előtt**. Sikertelen tárhelyírásból nem lesz hálózati mentés vagy sikerüzenet.
3. Online API-kérés CSRF + Idempotency-Key. Elveszett válasz után ugyanaz a kérés biztonságosan újraküldhető.
4. Offline helyi vetítés és „helyben mentve / szinkronra vár” állapot. A szervermentés külön állapot.
5. FIFO automatikus szinkron kapcsolatvisszatéréskor és 15 másodpercenként. Érvényes ugyanazon account session szükséges. Első hibánál megáll, az adat megmarad.

A támogatott útvonalak: saját/engedélyezett foods; kliens plans/workouts/sets/rest-days/notes/measurements/food-logs/daily-logs/records/diets/preferences. A szerver minden küldésnél újra ellenőrzi a tényleges jogosultságot. Terv/étkezés-másolás stabil UUID-kkal történik; függő új edzés sorozatai az új edzés után szinkronizálódnak.

A hálózati timeout a teljes JSON-válasz beérkezéséig aktív. Részleges válasz után a tartós művelet újraküldhető. Az elvárt account fejléc a több lapos fiókváltást 401-gyel jelzi még az adatlekérés előtt; a másik fiók válasza nem cache-elődik a régi fiókhoz.

## Konfliktusok

Verzióütközés 409, egyéb 4xx is látható hibasor. A helyi módosítás nem tűnik el. A felhasználó exportálhat, megnézheti a szerververziót, vagy tudatosan az egyik változatot választhatja. Helyi PATCH új szerververzióval és új kulccsal küldhető; szerverváltozat választásakor a helyi művelet külön `resolved` rekordban marad.

Új rekord/hiányzó függőség nem mindig erőltethető: export és megfelelő online űrlap szükséges. Nincs csendes last-write-wins. Függő sor mellett kijelentkezés blokkolt. Szerver-heti export előbb üres outboxot kér.

Visszaállításkor a `database_epoch` változik. Régi generációhoz tartozó outbox nem küldődik automatikusan; a felhasználónak össze kell vetnie. Idempotencia-nyugták és munkamenetek a visszaállított adatbázisból törlődnek.

## Frissítés

Az új shell waiting állapotban marad. Kifejezett frissítési gomb előtt a lap ellenőrzi a mentési sort és űrlapokat, a waiting Service Worker pedig **minden megnyitott laptól** biztonságos állapot-választ kér. Mentetlen/nem válaszoló lap blokkol. Régi kiadás lapjait mentés után be kell zárni. A controller csak jóváhagyás után cserélődik; a privát IndexedDB-t nem töröljük. Háttérszinkron nem rajzolja újra a nyitott vagy mentetlen űrlapot.

## Ténylegesen ellenőrzött

- Szerver leállítása → PWA reload → 88,4 kg mérés → helyi sor=1 → reload megőrizte → szerver újraindítása → automatikus sor=0 → SQL/API egyetlen rekord.
- Szerver leállítása → cached tervből új edzés → tényértékek üresek → 52,5 kg × 10 sorozat → reload megőrizte → újraindítás → egy edzés/egy szett, 525 kg volumen.
- Offline saját étel és rá hivatkozó 150 g draft étkezés reload után megmaradt, sorrendben 1–1 rekordként szinkronizálódott. A közben nyitott, mentetlen űrlap változatlan maradt.
- Automatikus teszt: hálózati hiba, friss Repositoryból outbox, sorrend, idegen account tiltás, 409 megőrzés, tudatos feloldás, régi database epoch, tárhelyírás-hiba.
- PWA update egységteszt: több lap közül egy blokkol; minden jóváhagyás enged. A böngészős ellenőrzés részletei az átadási jelentésben.

## Korlátok

Korábban nem betöltött oldal/terv/történet offline nem használható. A háttérprime a naplókat és edzésrészleteket tölti le, a teljes revíziós történetet nem. Fotóupload helyi böngészős feldolgozásból queue-zható, de tömeges offline fotó/tárhelynyomás külön próbát igényel. Fiókkezelés, első belépés, sessionmegújítás, backup és szerverexport online.

A helyi cache nem titkosított; a gép/böngészőprofil védendő. Böngészőadat-törlés, privát mód vagy böngésző általi tárhelykilakoltatás adatvesztést okozhat. Nem állítunk korlátlan, minden eszközön bizonyított offline garanciát. Valódi telepítés iOS/Android/Windows PWA-ként, több gépes HTTPS, háttérben bezárt alkalmazás szinkronja és tartós terhelés további elfogadási teszt.
