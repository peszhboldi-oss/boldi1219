'use strict';
const {createHash}=require('node:crypto'),V=require('./validation');
const digest=b=>createHash('sha256').update(JSON.stringify(b)).digest('hex');
function begin(store,user,req,res,body,access){
  const key=req.headers['idempotency-key'];if(!key)return null;
  if(!/^[a-f0-9-]{36}$/.test(key))V.fail('Hibás mentésazonosító.');
  const route=new URL(req.url,'http://localhost').pathname,parts=route.split('/');
  if(parts[3]==='clients'&&parts[4])access(user,parts[4]);
  const old=store.get('SELECT * FROM mutation_receipts WHERE account_id=? AND request_key=?',user.id,key),hash=digest(body);
  if(old){if(old.method!==req.method||old.path!==req.url||old.request_hash!==hash)V.fail('A mentésazonosító eltérő kéréshez tartozik.',409,'idempotency-conflict');res.writeHead(old.status,{'content-type':'application/json; charset=utf-8','x-idempotency-replayed':'true'});res.end(old.response_json);return {replayed:true};}
  store.db.exec('BEGIN IMMEDIATE');store.depth++;
  const end=res.end.bind(res);let active=true;
  function rollback(){if(active){active=false;store.depth--;store.db.exec('ROLLBACK');res.end=end;}}
  res.end=(data,...args)=>{
    if(active){if(res.statusCode>=400){rollback();return end(data,...args);}
      try{store.run('INSERT INTO mutation_receipts VALUES(?,?,?,?,?,?,?,?)',user.id,key,req.method,req.url,hash,res.statusCode,String(data),new Date().toISOString());store.db.exec('COMMIT');store.depth--;active=false;res.end=end;}catch(e){rollback();throw e;}}
    return end(data,...args);
  };
  return {replayed:false,rollback};
}
module.exports={begin};
