'use strict';
const {Store}=require('../backend/store'),{passwordHash}=require('../backend/auth'),V=require('../backend/validation'),{randomUUID}=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const env=path.resolve(__dirname,'../.env');if(fs.existsSync(env))process.loadEnvFile(env);
// Credentials enter through environment, never command-line arguments or source.
let store;try{const email=V.email(process.env.NEW_COACH_EMAIL),password=V.password(process.env.NEW_COACH_PASSWORD);store=new Store();store.run('INSERT INTO accounts VALUES(?,?,?,?,1,?)',randomUUID(),email,passwordHash(password),'coach',new Date().toISOString());console.log('Edzői fiók létrehozva. Klienshozzárendelés még nincs.');}catch(e){console.error(e.message);process.exitCode=1;}finally{if(store)store.close();}
