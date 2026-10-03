'use strict';
const fs=require('node:fs'),path=require('node:path'),{restore}=require('../backend/restore');
const root=path.resolve(__dirname,'..'),env=path.join(root,'.env');if(fs.existsSync(env))process.loadEnvFile(env);
async function main(){const source=process.argv[2];if(!source)throw new Error('Válassz .sqlite biztonsági mentést.');if(process.argv[3]!=='--confirm')throw new Error('A visszaállításhoz --confirm szükséges. A jelenlegi adatbázist előbb megőrizzük.');
  const isRunning=()=>{try{const state=JSON.parse(fs.readFileSync(path.join(root,'data/local-control.json'),'utf8'));process.kill(state.pid,0);return true;}catch(e){return e.code==='EPERM';}};
  const result=await restore(source,process.env.SQLITE_PATH||path.join(root,'data/impavidus.sqlite'),{isRunning});console.log('Visszaállítás ellenőrizve. Adatbázis: '+result.target);if(result.safety)console.log('Korábbi adatok mentése: '+result.safety);console.log('Új belépés szükséges. A böngésző régi offline mentéseit előbb exportáld és rendezd.');
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
