CREATE TABLE app_meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
INSERT INTO app_meta(key,value) VALUES('database_epoch',lower(hex(randomblob(16))));
