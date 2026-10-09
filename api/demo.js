'use strict';
// Public showcase only. The original app continues to use backend/server.js.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createHash,createHmac,timingSafeEqual}=require('node:crypto');
const {Store}=require('../backend/store');
const {createApi,sendProblem}=require('../backend/app');
const SNAPSHOT_DATE='2026-10-03';
const ALLOWED_USERS=new Set(['demo.edzo','demo.kliens1','demo.kliens2']);
const hash=value=>createHash('sha256').update(value).digest('hex');
let runtime;
function getRuntime(){
  if(runtime)return runtime;
  const secret=process.env.DEMO_SESSION_SECRET;
  if(!secret||secret.length<48)throw new Error('DEMO_SESSION_SECRET must contain at least 48 characters');
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'impavidus-public-demo-'));
  const filename=path.join(directory,'demo.sqlite');
  fs.copyFileSync(path.join(__dirname,'../demo/impavidus-demo.sqlite'),filename,fs.constants.COPYFILE_EXCL);
  const store=new Store(filename);
  const accounts=store.all('SELECT id,username FROM accounts');
  if(accounts.length!==3||accounts.some(a=>!ALLOWED_USERS.has(a.username)))throw new Error('Unexpected demo fixture accounts');
  store.run('DELETE FROM sessions');
  const api=createApi({store,secure:true,dateProvider:()=>SNAPSHOT_DATE});
  runtime={store,api,secret,accountIds:new Set(accounts.map(a=>a.id))};
  return runtime;
}
function sign(payload,secret){
  const data=Buffer.from(JSON.stringify(payload)).toString('base64url');
  return data+'.'+createHmac('sha256',secret).update(data).digest('base64url');
}
function verify(value,secret){
  if(!value||value.length>1800)return null;
  const parts=value.split('.');if(parts.length!==2)return null;
  const expected=createHmac('sha256',secret).update(parts[0]).digest();
  const actual=Buffer.from(parts[1],'base64url');
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
  try{
    const p=JSON.parse(Buffer.from(parts[0],'base64url').toString());
    if(!/^[a-f0-9]{64}$/.test(p.token)||!/^[a-f0-9]{48}$/.test(p.csrf)||typeof p.account!=='string'||!Number.isSafeInteger(p.exp)||p.exp<=Date.now()||p.exp>Date.now()+43200000)return null;
    return p;
  }catch{return null;}
}
const cookie=value=>`il_demo=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`;
module.exports=async function handler(req,res){
  res.setHeader('cache-control','no-store');
  res.setHeader('x-content-type-options','nosniff');
  res.setHeader('x-impavidus-mode','public-read-only-demo');
  try{
    const url=new URL(req.url,'https://demo.invalid');
    const route=typeof req.query?.route==='string'?req.query.route:url.searchParams.get('route');
    const pathname=route||url.pathname;
    url.searchParams.delete('route');
    if(!pathname.startsWith('/api/v1/'))return sendProblem(res,404,'Nincs ilyen API','A demó API-útvonala érvénytelen.','not-found');
    req.url=pathname+(url.searchParams.size?'?'+url.searchParams.toString():'');
    const isLogin=pathname==='/api/v1/auth/login',isLogout=pathname==='/api/v1/auth/logout';
    if(req.method!=='GET'&&!(req.method==='POST'&&(isLogin||isLogout)))return sendProblem(res,403,'Megtekinthető demó','A nyilvános bemutató teljes kliensadatai megtekinthetők. Módosítás és törlés nem engedélyezett.','demo-read-only');
    const {store,api,secret,accountIds}=getRuntime();
    const cookies=new Map((req.headers.cookie||'').split(';').map(x=>x.trim().split(/=(.*)/s).slice(0,2)));
    const proof=verify(cookies.get('il_demo'),secret);
    if(proof&&accountIds.has(proof.account)&&cookies.get('il_session')===proof.token){
      store.run('INSERT OR REPLACE INTO sessions(token_hash,account_id,csrf,expires_at) VALUES(?,?,?,?)',hash(proof.token),proof.account,proof.csrf,new Date(proof.exp).toISOString());
    }else{
      // An opaque cookie without the signed companion cannot restore a demo session.
      req.headers.cookie='';
    }
    const originalSetHeader=res.setHeader.bind(res);
    res.setHeader=(name,value)=>{
      if(name.toLowerCase()==='set-cookie'){
        if(isLogout)value=[value,'il_demo=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'];
        else if(isLogin){
          const token=String(value).match(/^il_session=([a-f0-9]{64});/)?.[1];
          const session=token&&store.get('SELECT * FROM sessions WHERE token_hash=?',hash(token));
          if(session&&accountIds.has(session.account_id))value=[value,cookie(sign({token,account:session.account_id,csrf:session.csrf,exp:Date.parse(session.expires_at)},secret))];
        }
      }
      return originalSetHeader(name,value);
    };
    // Vercel can provide an already parsed body; the native API reads a stream.
    if(req.method==='POST'&&req.body!==undefined){
      const payload=Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body));
      req[Symbol.asyncIterator]=async function*(){yield payload;};
    }
    await api(req,res);
  }catch(error){
    console.error(JSON.stringify({event:'public_demo_error',message:error.message}));
    if(!res.headersSent)sendProblem(res,503,'A demó átmenetileg nem érhető el','Próbáld újra néhány másodperc múlva.','demo-unavailable');
    else if(!res.writableEnded)res.end();
  }
};
