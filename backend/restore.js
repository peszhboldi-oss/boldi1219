'use strict';
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync,backup}=require('node:sqlite'),{randomUUID}=require('node:crypto');
// The caller must stop this app first. Every existing database is preserved.
async function restore(source,target,{isRunning=()=>false}={}){
  source=path.resolve(source);target=path.resolve(target);
  if(source===target)throw new Error('A mentés és a céladatbázis nem lehet ugyanaz.');
  if(isRunning())throw new Error('Visszaállítás előtt állítsd le az alkalmazást.');
  const original=new DatabaseSync(source,{readOnly:true});let stage;
  try{
    if(original.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('A mentés sérült.');
    for(const table of ['accounts','clients','schema_migrations','records'])if(!original.prepare('SELECT 1 FROM sqlite_master WHERE type=? AND name=?').get('table',table))throw new Error('Nem IMPAVIDUS LAB adatbázismentés.');
    fs.mkdirSync(path.dirname(target),{recursive:true});stage=target+'.restore-'+randomUUID();await backup(original,stage);
  }finally{original.close();}
  let safety=null;
  try{
    const staged=new DatabaseSync(stage);try{if(staged.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('A visszaállított másolat sérült.');staged.exec('DELETE FROM sessions;');if(staged.prepare('SELECT 1 FROM sqlite_master WHERE name=?').get('app_meta'))staged.prepare('UPDATE app_meta SET value=? WHERE key=?').run(randomUUID().replace(/-/g,''),'database_epoch');if(staged.prepare('SELECT 1 FROM sqlite_master WHERE name=?').get('mutation_receipts'))staged.exec('DELETE FROM mutation_receipts;');}finally{staged.close();}
    if(isRunning())throw new Error('Az alkalmazás időközben elindult; a visszaállítás leállt.');
    if(fs.existsSync(target)){
      safety=path.join(path.dirname(target),'restore-backups','before-restore-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite');fs.mkdirSync(path.dirname(safety),{recursive:true});
      const current=new DatabaseSync(target);try{if(current.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('A jelenlegi adatbázis sérült; előbb külön mentsd a data mappát.');await backup(current,safety);current.exec('PRAGMA wal_checkpoint(TRUNCATE);');}finally{current.close();}
      // Preserve the checkpointed original and its sidecars, instead of deleting them.
      const preserved=target+'.before-restore-'+randomUUID();fs.renameSync(target,preserved);for(const suffix of ['-wal','-shm'])if(fs.existsSync(target+suffix))fs.renameSync(target+suffix,preserved+suffix);
      try{fs.renameSync(stage,target);}catch(e){fs.renameSync(preserved,target);throw e;}
    }else fs.renameSync(stage,target);
    return {target,safety};
  }finally{if(stage&&fs.existsSync(stage))fs.unlinkSync(stage);}
}
module.exports={restore};
