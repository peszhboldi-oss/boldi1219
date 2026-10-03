# IMPAVIDUS LAB — használati útmutató

## Indítás és belépés

Az Asztalon kattints duplán az **IMPAVIDUS LAB** ikonra. A helyi cím **http://127.0.0.1:8082**. Első telepítéshez lásd `README_START_HU.md`.

Belépéshez felhasználónév és legalább 12 karakteres jelszó szükséges. Nincs e-mail vagy meghívókód. Első alkalommal saját edzői fiókot hozol létre; később a szokásos belépés jelenik meg. Jelszót ne írj a projektfájlokba.

A böngésző bezárása nem állítja le a szolgáltatást. Leállításhoz `STOP_IMPAVIDUS_LAB.cmd`, újraindításhoz `RESTART_IMPAVIDUS_LAB.cmd`. A mentett adatok megmaradnak.

## Kliens hozzáadása — edzőként

1. Kliensek → **Új kliens**.
2. Add meg a sportoló nevét, kezdődátumát, opcionális kezdősúlyát, magasságát, célját és fázisát.
3. Adj meg saját felhasználónevet és jelszót a kliens számára.
4. Létrehozás után a profil hozzád lesz rendelve. Más edző hozzárendelés nélkül nem fér hozzá.
5. Adatlap → **Belépési adatok**: módosíthatod a felhasználónevet vagy új jelszót adhatsz. Üres jelszónál a régi marad. A módosítás kijelentkezteti a klienst.

Az aktuális testsúly tényleges mérésből származik. A kezdősúly nem készít automatikus mérési eredményt. Az archiválás megőrzi az adatokat, és letiltja a kliens írását/belépését; a klienslistában visszaállítható.

## Edzésterv és edzés

**Edző:** Gyakorlatok → saját gyakorlat felvétele, izomcsoport, eszköz és kategória. Ezután a kliens Edzésnaplójában készíts tervet, sorozatcélokkal és jegyzetekkel. Másolható, szerkeszthető és archiválható. A tervváltozás megőrzi a régi edzések adatait.

**Kliens:** Edzésnapló → dátum és terv → **Edzés megnyitása**. A tényleges súly és ismétlés üresen indul. Rögzítsd, amit elvégeztél, majd **SOROZAT KÉSZ**. Opcionálisan RPE 6–10, bemelegítés, pihenő és jegyzet is megadható. Extra sorozat vagy gyakorlat a tényedzéshez adódik, a tervet nem módosítja.

A bemelegítés nem keménysorozat. A súlyzós volumen a tényleges kg × ismétlés; kardió és saját testsúly külön kezelődik. Lezárás, újranyitás és utólagos javítás előzményben megmarad. Pihenőnapot külön, kifejezetten rögzíts; ugyanazon a napon aktív edzéssel nem fér össze.

## Ételkatalógus és étrend — edzőként

Az Étrend és Kajanapló oldal alján található az élelmiszer-katalógus. A tápértékek **100 grammra** vonatkoznak. Üres adat ismeretlent jelent, nem nullát. Az edző központi élelmiszert, a kliens saját, privát élelmiszert vehet fel. Név/kategória keresés és duplikációellenőrzés működik.

Étrend → **Új étrend**: név, kezdődátum, opcionális záródátum, fázis, célkalória és célmakrók, 5 vagy 6 étkezés, ételek, grammok és megjegyzés. Tételenként válassz étkezést és mennyiséget. A rendszer a grammokból számol: 20 g fehérje/100 g esetén 150 g étel 30 g fehérje.

Egy étrend másolható másik hozzád rendelt klienshez. Ha az új kezdés a régi záródátum utánra esik, a másolat nyitott záródátumot kap. Aktuális terv: a kiválasztott napon érvényes, aktív tervek közül a legkésőbbi kezdésű, azonos kezdésnél legutóbb frissített. Az archivált tervek és a változatok megmaradnak.

## Kajanapló — kliensként

Válaszd ki a napot. Az étrend vagy az előző nap átmásolása **előkészített**, még nem elfogyasztott tételeket készít. Csak **Elfogyasztottam** vagy az étkezési űrlap kifejezett fogyasztásjelölése teszi tényadattá.

Kereshetsz ételt, változtathatsz grammot, felvehetsz saját ételt, megjegyzést adhatsz és visszavonhatsz tételt. Kézi bejegyzésnél a teljes mennyiség tápértékét add meg. A napi bevitel, cél és eltérés frissül. A régi fogyasztás megőrzi a használt étel és terv pillanatfelvételét: későbbi katalógus- vagy tervváltozás nem írja át.

## Napi napló

Négy szekció: regeneráció, edzés, kaja és készítmények. Az állapot űrlapja alvást, alvásminőséget, energiát, stresszt, tervkövetést, emésztést, fájdalom helyét/intenzitását és megjegyzést kezel. Az opcionális egészség-, víz- és kiegészítőmezőket a Beállításokban kapcsolhatod be.

A nap lezárása külön döntés. A mai nyitott nap nem minősül kihagyottnak. A napi megjegyzés és a gyógyszer/fotó önmagában nem teljesít napot.

## Gyógyszer, mérések, fotók

- **Gyógyszer:** az edző készítménynevet, rögzített dózist, egységet, gyakoriságot, fázist, dátumokat és megjegyzést kezel. Minden módosításhoz dátumozott előzmény tartozik. Nincs adagolási javaslat vagy napi kipipálás.
- **Mérések:** a kliens és a hozzá rendelt edző is új mérést rögzíthet. Testsúly kötelező; körméretek és megjegyzés opcionálisak. Javításként új mérést adj hozzá, az előző megmarad. A legfrissebb dátum, azonos napon a legutóbbi rögzítés az aktuális. Hét napnál régebbi mérésre az Adatlap figyelmeztet.
- **Fotónapló:** kliensként tölts fel PNG/JPEG képet, dátummal és megjegyzéssel. A felület átméretezi és JPEG-re kódolja; a szerver 1 MB és 4096×4096 határt ellenőriz. Dátum szerint rendezve látható, nagyítható és két időpont összevethető. A fotó privát; a kliens és a hozzárendelt edző fér hozzá. Archiváláskor az adatbázisban megmarad.

## Heti összesítő és export

A hét hétfő–vasárnap. Teljesített naphoz tényleges kajanapló **és** tényleges edzéssorozat vagy explicit pihenőnap szükséges. Hetente egy kihagyott nap megengedett; a második megszakítja az aktuális sorozatot. A mai nap csak lezárás után lehet kihagyott. A korábbi maximum megmarad.

Az összesítő valós sorozatot, volument, RPE-t, testsúlyt, kalóriát, makrókat, célkülönbséget, készítménylistát és heti megjegyzéseket mutat. Üres/ismeretlen érték „—”. A testsúlygrafikon a mérési történetet, a táplálkozási és edzésgrafikon a kiválasztott hetet mutatja.

**CSV/XLSX** a kiválasztott hétre exportál. **Beállítások → JSON-export** a jogosultan megnyitott kliens részletes adatait exportálja. Az export érzékeny adatot tartalmazhat. A szerveroldali heti export a már szinkronizált adatokból készül: előbb rendezd a függő mentéseket.

## Offline használat és szinkron

Először ezen a böngészőprofilon, elérhető szerver mellett lépj be, és nyisd meg a kliens adatlapját. A kliens naplóadatai háttérben helyi adattárba kerülnek. Offline csak az előzőleg elérhető adatok használhatók. Új belépés/fiók/jelszókezelés online szükséges.

A támogatott naplók, mérések, sorozatok, tervek és beállítások tartós helyi mentési sorba kerülnek. A felső sáv jelzi a függő darabszámot; **helyben mentve** még nem egyenlő a szerverre mentéssel. Elérhető kapcsolat mellett kb. 15 másodpercenként, illetve visszakapcsolódáskor indul a szinkron. Szerverindítás után rövid ideig várhatsz vagy Beállítások → Szinkronizálás.

A műveletazonosítók megelőzik a válasz nélküli kérés ismételt feldolgozását. Ütközésnél a sor megáll. **Függő mentések / hibák** alatt exportálhatod a helyi adatot és összevetheted a szerverrel. A helyi változatot csak tudatos választással küldi újra; a szerverváltozat megtartása a helyi műveletet külön megőrzött feloldási rekordba teszi. Nem minden új rekord/hiányzó kapcsolat erőltethető újra: ilyen esetben JSON-export után a megfelelő online űrlapon rögzítsd újra.

Offline munkamenet az utolsó sikeres online ellenőrzéstől legfeljebb 12 óráig használható. Szinkronhoz ugyanazzal a fiókkal érvényes szerveroldali belépés szükséges. Függő mentésekkel a kijelentkezés blokkolt. Privát böngészőmód, tárhelytörlés vagy betelt tárhely nem megbízható adattárolás; az alkalmazás jelez hibát, de a böngésző által törölt adatot nem tudja visszahozni.

A PWA a támogatott böngésző Telepítés menüpontjával telepíthető. A felületfrissítés külön gombbal, minden megnyitott lapon mentett űrlapok és üres mentési sor mellett alkalmazható. Ha egy régi lap nem válaszol, mentés után zárd be a többi alkalmazáslapot. A tényleges eszközre telepítést külön elfogadási próbában kell ellenőrizni.

## Mentés és visszaállítás

Edzőként **Beállítások → Teljes helyi biztonsági mentés**. A mentés teljes SQLite-adatbázist és fotókat tartalmaz. Automatikusan indításkor, majd futás közben alapból 24 óránként készül mentés. `.env`: `BACKUP_INTERVAL_HOURS` (0 kikapcsolja), `BACKUP_KEEP` (alapból 30 automatikus mentés), `BACKUP_DIRECTORY` (opcionális másik mappa). A kézi és migráció előtti mentéseket az automatikus megőrzés nem törli.

Visszaállítás előtt szinkronizálj, vagy exportáld és rendezd a böngésző függő változásait. Dupla kattintás a `RESTORE_IMPAVIDUS_LAB.cmd` fájlra → válassz `.sqlite` mentést → megerősítéshez írd be: **IGEN**. A szolgáltatás leáll, a kiválasztott mentés ellenőrzést kap, a jelenlegi adatbázis megmarad külön példányban. Ezután a START-tal indítsd el és lépj be újra. Régi offline változásokat a megváltozott adatbázis-azonosító miatt a rendszer ellenőrzés nélkül nem küld be.

A mentések és a helyi böngészőadatok nem alkalmazásszinten titkosítottak. A gépet és a böngészőprofilt védd saját Windows-fiókkal és lemeztitkosítással; a mentéseket másik, védett adathordozóra is másold. A gép saját lemezén lévő backup nem véd annak meghibásodása ellen.

## Határok és hibaelhárítás

Az átadott kiadás helyben fut; belső hálózati HTTPS-kiszolgálás, több gépes adatbázis és önkiszolgáló fiókhelyreállítás nincs beállítva. Nincs késznek állítva általános éles egészségadat-szolgáltatásként. Nagy fotótár és sok egyidejű kliens előtt terhelésmérés és külön üzemeltetési beállítás kell.

Indítási hibákhoz: `README_START_HU.md`, `CHECK_IMPAVIDUS_LAB.cmd`, `data/logs`. Adatbázishibánál mindig őrizd meg az eredeti fájlokat. Sikertelen mentésnél olvasd el az űrlap hibaüzenetét; ne tekintsd szervermentésnek a helyi függő állapotot.
