'use strict';
const fs=require('node:fs'),path=require('node:path');
const {randomBytes,createHash,timingSafeEqual}=require('node:crypto');
const root=path.resolve(__dirname,'..'),file=path.join(root,'data/local-control.json'),request=path.join(root,'data/stop-request.json');
const instance=createHash('sha256').update(root.toLowerCase()).digest('hex').slice(0,16);
function attach(server,shutdown){let timer,token;
  server.once('listening',()=>{
    token=randomBytes(32).toString('hex');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify({pid:process.pid,token,instance,method:'file'}),{mode:0o600});
    timer=setInterval(()=>{if(!fs.existsSync(request))return;try{const input=JSON.parse(fs.readFileSync(request,'utf8'));if(typeof input.token==='string'&&input.token.length===token.length&&timingSafeEqual(Buffer.from(input.token),Buffer.from(token))){clearInterval(timer);shutdown();}}catch{}finally{fs.rmSync(request,{force:true});}},200);timer.unref();
  });
  server.once('close',()=>{clearInterval(timer);try{if(JSON.parse(fs.readFileSync(file,'utf8')).pid===process.pid)fs.rmSync(file,{force:true});}catch{}});
}
async function stop(){
  if(!fs.existsSync(file)){console.log('Nincs saját futó példány.');return;}
  const state=JSON.parse(fs.readFileSync(file,'utf8'));if(state.instance!==instance||state.method!=='file')throw new Error('A korábbi kézi szervert egyszer le kell állítani; a friss indító már automatikusan kezeli.');
  fs.writeFileSync(request,JSON.stringify({token:state.token}),{mode:0o600});
  for(let i=0;i<120;i++){if(!fs.existsSync(file)){console.log('IMPAVIDUS LAB szabályosan leállt.');return;}await new Promise(r=>setTimeout(r,250));}
  throw new Error('A szerver még nem fejezte be a mentést/leállítást. Nem kényszerítünk adatvesztő leállást.');
}
module.exports={attach,stop,instance};
if(require.main===module)stop().catch(e=>{console.error(e.message);process.exitCode=1;});
