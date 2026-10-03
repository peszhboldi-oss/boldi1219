'use strict';
const fs=require('node:fs'),path=require('node:path'),{backup,DatabaseSync}=require('node:sqlite');
const {randomUUID}=require('node:crypto');
const root=path.resolve(__dirname,'..');
function settings(){const hours=Number(process.env.BACKUP_INTERVAL_HOURS||24),keep=Number(process.env.BACKUP_KEEP||30);if(!Number.isFinite(hours)||hours<0||hours>720)throw new Error('BACKUP_INTERVAL_HOURS 0–720 legyen (0 = kikapcsolva).');if(!Number.isInteger(keep)||keep<1||keep>1000)throw new Error('BACKUP_KEEP 1–1000 legyen.');return {hours,keep};}
async function save(store,{automatic=false,directory=process.env.BACKUP_DIRECTORY||path.join(root,'backups')}={}){
  const {keep}=settings();fs.mkdirSync(directory,{recursive:true});const filename=`${automatic?'auto':'manual'}-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID()}.sqlite`,target=path.join(directory,filename);
  await backup(store.db,target);const check=new DatabaseSync(target,{readOnly:true});try{if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('A mentés ellenőrzése sikertelen.');}finally{check.close();}
  if(automatic){const files=fs.readdirSync(directory).filter(f=>/^auto-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z(?:-[0-9a-f-]{36})?\.sqlite$/.test(f)).sort().reverse();for(const file of files.slice(keep))fs.unlinkSync(path.join(directory,file));}
  return {filename,path:target,includesPhotos:true};
}
function schedule(store,logger){const {hours}=settings();if(hours===0)return ()=>{};let pending=null;
  const run=async()=>{if(pending)return pending;pending=(async()=>{try{await save(store,{automatic:true});logger.info(JSON.stringify({event:'backup',status:'ok'}));}catch(e){logger.error(JSON.stringify({event:'backup',status:'failed',code:e.code||'backup-error'}));}finally{pending=null;}})();return pending;};
  const timer=setInterval(run,hours*3600000);timer.unref();run();return async()=>{clearInterval(timer);if(pending)await pending;};
}
module.exports={save,schedule,settings};
