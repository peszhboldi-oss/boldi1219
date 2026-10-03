'use strict';
const {backup}=require('node:sqlite'),{Store}=require('../backend/store'),fs=require('node:fs'),path=require('node:path');
async function main(){const env=path.resolve(__dirname,'../.env');if(fs.existsSync(env))process.loadEnvFile(env);const store=new Store();try{const dest=path.resolve(__dirname,'../backups');fs.mkdirSync(dest,{recursive:true});const file=path.join(dest,`impavidus-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`);await backup(store.db,file);console.log(`Konzisztens adatbázismentés: ${file}`);}finally{store.close();}}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
