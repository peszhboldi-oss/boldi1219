'use strict';
const {Store}=require('../backend/store'),{save}=require('../backend/backups'),fs=require('node:fs'),path=require('node:path');
async function main(){const env=path.resolve(__dirname,'../.env');if(fs.existsSync(env))process.loadEnvFile(env);const store=new Store();try{const result=await save(store);console.log('Ellenőrzött adatbázismentés, fotókkal: '+result.path);}finally{store.close();}}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
