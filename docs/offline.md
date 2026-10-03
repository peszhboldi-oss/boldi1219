# Offline mentési határ

A rendszer jelenleg online API-mentést használ. Az alkalmazásfelület offline app-shellje cache-elhető, de offline belépés, teljes kliensadat-betöltés, tartós sorozatmentés és automatikus szinkron nem készült el, és nincs késznek jelölve.

## Aktív interfész

`frontend/repository.js`:

```js
await repository.saveSet(clientId, workoutId, setId, {
  version, actual_weight, actual_reps, rpe, completed, warmup, note
});
```

Csak a sikeres szerverválasz után jelenik meg a „Mentve” állapot, az összesítő és a következő sorozat. Hálózati hibánál az aktuális űrlapmezők nem törlődnek; a felület egyértelműen jelzi, hogy nincs szervermentés. Oldalfrissítés vagy bezárás ezeket a még el nem küldött mezőket elveszítheti. A válasz nélkül megszakadt kérés eredménye bizonytalan lehet: újratöltéssel ellenőrizni kell. Ismételt írásnál az elavult verzió 409-et ad.

## Negyedik lépés

1. IndexedDB-beli, fiókhoz kötött outbox; helyi titkosítás és kijelentkezéskor védett eltávolítás.
2. Műveletenként UUID és szerveroldali idempotenciakulcs, egyedi constrainttel.
3. Állapotok: helyi piszkozat / küldésre vár / szerverre mentve / ütközés. A „mentve” és a „szinkronizálva” nem azonos.
4. Sorozatonkénti verzió, visszavont fiók/kapcsolat kezelése, látható 409-feloldás. Tényadatot a terv és az edzői szerep offline sem írhat felül.
5. Reconnect, újraindulás, több eszköz, elveszett válasz, dupla kérés, visszavont session, betelt tárhely és törölt cache automatizált tesztjei.

Az API-válaszokat, profilképeket és fejlődési fotókat a jelenlegi Service Worker nem cache-eli.
