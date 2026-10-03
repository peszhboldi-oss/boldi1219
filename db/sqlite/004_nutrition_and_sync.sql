CREATE TABLE foods(id TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL DEFAULT '',owner_id TEXT REFERENCES accounts(id),created_by TEXT NOT NULL REFERENCES accounts(id),calories REAL,protein REAL,carbs REAL,fat REAL,reference_grams REAL NOT NULL DEFAULT 100 CHECK(reference_grams=100),unit TEXT NOT NULL DEFAULT 'g' CHECK(unit='g'),active INTEGER NOT NULL DEFAULT 1,version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE UNIQUE INDEX food_identity ON foods(lower(name),lower(category),coalesce(owner_id,''));
CREATE TABLE diets(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id),coach_id TEXT NOT NULL REFERENCES accounts(id),name TEXT NOT NULL,start_date TEXT NOT NULL,end_date TEXT,phase TEXT NOT NULL DEFAULT '',calories REAL,protein REAL,carbs REAL,fat REAL,meals INTEGER NOT NULL CHECK(meals IN (5,6)),items_json TEXT NOT NULL DEFAULT '[]',note TEXT NOT NULL DEFAULT '',active INTEGER NOT NULL DEFAULT 1,version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
ALTER TABLE food_logs ADD COLUMN food_id TEXT REFERENCES foods(id);
ALTER TABLE food_logs ADD COLUMN consumed INTEGER NOT NULL DEFAULT 1 CHECK(consumed IN (0,1));
ALTER TABLE food_logs ADD COLUMN reference_json TEXT;
ALTER TABLE food_logs ADD COLUMN note TEXT NOT NULL DEFAULT '';
ALTER TABLE food_logs ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE food_logs ADD COLUMN diet_id TEXT REFERENCES diets(id);
ALTER TABLE food_logs ADD COLUMN diet_version INTEGER;
CREATE TABLE mutation_receipts(account_id TEXT NOT NULL REFERENCES accounts(id),request_key TEXT NOT NULL,method TEXT NOT NULL,path TEXT NOT NULL,request_hash TEXT NOT NULL,status INTEGER NOT NULL,response_json TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(account_id,request_key));
-- Preserve previous textual dietary guidance as an editable structured plan.
INSERT INTO diets(id,client_id,coach_id,name,start_date,phase,meals,note,active,version,created_at,updated_at)
SELECT r.id,r.client_id,a.coach_id,json_extract(r.data_json,'$.name'),c.start_date,c.phase,json_extract(r.data_json,'$.meals'),coalesce(json_extract(r.data_json,'$.note'),''),CASE WHEN r.archived_at IS NULL THEN 1 ELSE 0 END,r.version,r.created_at,r.updated_at FROM records r JOIN clients c ON c.id=r.client_id JOIN assignments a ON a.client_id=c.id WHERE r.kind='diet' GROUP BY r.id;
UPDATE clients SET preferences_json=json_set(preferences_json,'$.meals',5,'$.water',json('false'),'$.supplements',json('false'));
