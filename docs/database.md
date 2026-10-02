# Adatbázis-séma

Az induló, üres PostgreSQL-séma definíciója: `db/migrations/001_initial_schema.sql`. A migráció **nincs lefuttatva**; nem tartalmaz kliens- vagy demóadatot.

## Táblák

| Tartomány | Táblák | Megjegyzés |
|---|---|---|
| Fiók és szerep | `accounts`, `client_profiles`, `coach_profiles`, `coach_client_assignments` | Egy fiók egy szerep; edző–kliens kapcsolat külön táblában. Jelszót csak hashként lehet menteni. |
| Napi napló | `daily_logs` | Egy rekord / kliens / nap, validált alvás-, stressz-, energia- és fájdalomértékekkel. |
| Edzés | `exercises`, `workout_plans`, `workout_plan_exercises`, `workout_sessions`, `workout_sets` | Tervadat és tényadat külön mező; bemelegítő sorozat külön jelölve; explicit pihenőnap. |
| Étrend és kajanapló | `meal_plans`, `meal_plan_meals`, `foods`, `meal_plan_items`, `food_log_entries` | Ételadat 100 g-ra; a napló rekord pillanatfelvételt tartalmaz az étel tápértékéről. Licencforrás rögzíthető. |
| Gyógyszer | `medications`, `medication_changes` | Aktuális lista és dózisváltozás-napló; nincs napi bevétel-jelölés vagy dózisajánlás. |
| Mérés, fotó, megjegyzés | `measurements`, `progress_photos`, `client_notes` | A fotó tartalma privát objektumtárban van; az adatbázis csak privát objektumkulcsot és metaadatot tárol. |
| Audit | `audit_events` | Szerep- és adatváltozás eseményei. Érzékeny mezőértéket nem kell ide másolni. |

## Alap invariantok

- Edzés ténye nem következtethető ki edzéstervből.
- A tervezett és tényleges súly/ismétlés külön mezőben van.
- Mérési előzmény új rekord; múltbeli adat nem frissül felül.
- A bemelegítő szett jelölése nem befolyásolja automatikusan a nehéz szettek aggregálását.
- Az FK-k `ON DELETE CASCADE` szabálya kliensfiók törlésekor az összes kapcsolt személyes napló törlését írja le; éles törlés előtt visszaállítható mentési és megőrzési szabály szükséges.
