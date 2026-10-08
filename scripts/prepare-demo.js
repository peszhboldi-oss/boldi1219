'use strict';
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..');
function main(){
 if(process.env.NODE_ENV==='production')throw new Error('A demo inicializálás fejlesztési használatra való.');
 const source=path.join(root,'demo/impavidus-demo.sqlite');
 const target=path.join(root,'data/impavidus.sqlite');
 const db=new DatabaseSync(source,{readOnly:true});
 try{
  if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw new Error('A demo adatbázis hibás.');
  const users=db.prepare('SELECT username FROM accounts').all();
  if(users.length!==3||users.some(a=>!/^demo\./.test(a.username))||db.prepare('SELECT count(*) AS n FROM sessions').get().n)throw new Error('Nem a várt munkamenet nélküli demo.');
 }finally{db.close();}
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);
 console.log('A 20 napos demo előkészítve. Indítás: node server.js; belépések: demo/README.md');
}
try{main();}catch(e){console.error(e.code==='EEXIST'?'Már létezik adatbázis; nem írjuk felül. A demót külön, friss projektmásolatban indítsd.':e.message);process.exitCode=1;}
