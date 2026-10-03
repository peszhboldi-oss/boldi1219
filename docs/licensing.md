# Külső források és licencek

Nem történt wger- vagy FitHub-alkalmazáskód másolása. A saját felhasználói projekt folytatása ugyanabban a repositoryban történt. Nincs új külső futásidejű csomag.

## wger

A [wger README](https://github.com/wger-project/wger/blob/master/README.md) az alkalmazást AGPL-3.0-or-later alatt adja ki, az edzés-/ételadatokhoz külön Creative Commons licenceket jelez. A [gyakorlatmodell](https://github.com/wger-project/wger/blob/master/wger/exercises/models/base.py) gyakorlat-UUID-t, izom- és eszközkapcsolatot, illetve változástörténetet kezel. E fogalmakhoz saját IMPAVIDUS-megvalósítás készült; Django-osztályt vagy algoritmust nem emeltünk át.

A [nyilvános exerciseinfo serializer](https://github.com/wger-project/wger/blob/master/wger/exercises/api/serializers.py) alapján **saját JSON-adapter** készült `backend/wger-import.js` alatt. UUID, fordítás, izomcsoport, eszköz, licenc és szerzői előzmény kerül a saját importformátumba. Kódot, leírást, képet és videót nem másol. Az adaptert szintetikus sémaadatokkal teszteltük; teljes, aktuális élő wger-export letöltése/importja nem történt.

Feltétel: a gyakorlat alapadatának és a kiválasztott fordításának licence külön ellenőrzött CC0-1.0 vagy CC-BY-4.0 legyen. A [LicenseSerializer](https://github.com/wger-project/wger/blob/master/wger/core/api/serializers.py) URL-mezője alapján ismert Creative Commons URI-kat fogadunk. Az ismeretlen, ShareAlike és egyéb verziókat kihagyjuk; ez termékpolitika, nem annak állítása, hogy minden más licenc jogilag használhatatlan.

Az eszközkategóriát kézzel kell megadni UUID-nként: a wger kategóriája nem feleltethető meg automatikusan a szabad súly / gép / saját testsúly / kardió kategóriáknak. Az importforrás UUID egyedi; ismételt import nem duplikál. A forrás, szerző és licenc a gyakorlatkönyvtárban megjelenik, exportban megmarad. A felhasználó által megadott licenc valódiságát a rendszer nem tudja jogilag bizonyítani; forrásellenőrzés kell.

Feldolgozás:

```sh
node scripts/convert-wger.js exerciseinfo.json mapping.json import.json
```

A `mapping.json` szerkezete:

```json
{
  "languageId": 2,
  "categoryByUuid": {"ellenorzott-gyakorlat-uuid": "machine"},
  "licenses": [{"id": 1, "url": "https://creativecommons.org/licenses/by/4.0/"}]
}
```

Az azonosítók itt **formátumminta**, nem a wger nyelv-/licencazonosítóinak állítása. A tényleges, az exporthoz tartozó nyelv- és licencadatokat kell használni. A létrejövő `import.json` a Gyakorlatok / Licencelt JSON import mezőjébe kerülhet.

## FitHub

A [FitHub repository](https://github.com/QuiK000/FitHub) korábbi auditjában nem volt megadott, újrafelhasználást engedélyező licenc. Ezért nem került át forráskód, asset vagy üzleti komponens. Későbbi átvehető kódhoz licenc vagy a jogosult kifejezett engedélye kell. A klienslista és coach/client kapcsolatok itt saját kóddal készültek.

## Az IMPAVIDUS LAB kiadása

Az alkalmazás jelenlegi `private` projektje nem kapott automatikusan nyilvános MIT/AGPL licencet. A saját kód licenceléséről a jogosult dönt. Az adattartalom licence az alkalmazás licencétől külön marad. AGPL-forrás jövőbeli beemelése előtt az egész származékos rendszer és a hálózati forráskiadási kötelezettség vizsgálata szükséges.
