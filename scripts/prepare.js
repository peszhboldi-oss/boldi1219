'use strict';
const fs=require('node:fs'),path=require('node:path'),{Store}=require('../backend/store');
const env=path.resolve(__dirname,'../.env');if(fs.existsSync(env))process.loadEnvFile(env);
try{const store=new Store();try{if(store.get('PRAGMA integrity_check').integrity_check!=='ok')throw new Error('Az adatbázis ellenőrzése hibát talált.');console.log('SQLite, migrációk és integritás: OK');}finally{store.close();}}catch(e){console.error(e.message);process.exitCode=1;}
