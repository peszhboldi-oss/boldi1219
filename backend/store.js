'use strict';
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
class Store {
  constructor(filename = process.env.SQLITE_PATH || path.join(__dirname, '../data/impavidus.sqlite')) {
    this.filename = filename;
    this.depth=0;
    const existed=filename!==':memory:'&&fs.existsSync(filename);
    if (filename !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    this.db.exec('CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT NOT NULL)');
    const dir = path.join(__dirname, '../db/sqlite');
    const migrations=fs.readdirSync(dir).filter(x=>x.endsWith('.sql')).sort();
    if(existed&&migrations.some(file=>!this.get('SELECT 1 FROM schema_migrations WHERE version=?',file))){
      const backupDir=path.join(path.dirname(path.resolve(filename)),'migration-backups');fs.mkdirSync(backupDir,{recursive:true});
      const destination=path.join(backupDir,'before-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite');
      this.db.exec("VACUUM INTO '"+destination.replace(/'/g,"''")+"'");
    }
    for (const file of migrations) {
      if (!this.get('SELECT 1 FROM schema_migrations WHERE version=?', file)) this.transaction(() => {
        this.db.exec(fs.readFileSync(path.join(dir, file), 'utf8'));
        this.run('INSERT INTO schema_migrations VALUES(?,?)', file, new Date().toISOString());
      });
    }
  }
  get(sql, ...values) { return this.db.prepare(sql).get(...values); }
  all(sql, ...values) { return this.db.prepare(sql).all(...values); }
  run(sql, ...values) { return this.db.prepare(sql).run(...values); }
  transaction(fn) { const nested=this.depth>0,label='nested_'+this.depth;this.db.exec(nested?'SAVEPOINT '+label:'BEGIN IMMEDIATE');this.depth++;try{const result=fn();this.depth--;this.db.exec(nested?'RELEASE '+label:'COMMIT');return result;}catch(error){this.depth--;this.db.exec(nested?'ROLLBACK TO '+label:'ROLLBACK');if(nested)this.db.exec('RELEASE '+label);throw error;} }
  revision(entity, id, actor, before, after) { this.run('INSERT INTO revisions VALUES(?,?,?,?,?,?,?)', randomUUID(), entity, id, actor, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, new Date().toISOString()); }
  close() { this.db.close(); }
}
module.exports = { Store };
