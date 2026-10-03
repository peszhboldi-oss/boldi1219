'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{randomBytes}=require('node:crypto');
const {createMobileProxy}=require('../backend/mobile-proxy');
const {MobileHealth}=require('./mobile-health');
const root=path.resolve(__dirname,'..'),data=path.join(root,'data'),infoFile=path.join(data,'mobile-access.json'),stopFile=path.join(data,'mobile-access-stop');
async function main(){
  if(fs.existsSync(path.join(root,'.env')))process.loadEnvFile(path.join(root,'.env'));
  const port=Number(process.env.PORT||8082);
  if(process.env.COOKIE_SECURE==='true')throw Error('Ez az ideiglenes átjáró a helyi HTTP indításhoz készült.');
  const status=await fetch('http://127.0.0.1:'+port+'/api/v1/ready').then(r=>r.json());
  if(status.instance!==require('./local-control').instance||status.status!=='ok')throw Error('Indítsd el előbb a saját IMPAVIDUS LAB alkalmazást.');
  const auth=await fetch('http://127.0.0.1:'+port+'/api/v1/auth/session').then(r=>r.json());
  if(auth.setupRequired)throw Error('Az első edzőt előbb helyben hozd létre.');
  const binary=process.env.IMPAVIDUS_CLOUDFLARED||[path.join(root,'tools/cloudflared.exe'),path.resolve(root,'../work/mobile-tools/cloudflared.exe')].find(f=>fs.existsSync(f));
  if(!binary||!fs.existsSync(binary))throw Error('Hiányzik a cloudflared.exe. Lásd docs/mobile.md.');
  fs.mkdirSync(data,{recursive:true});let child,stopping=false;const token=randomBytes(24).toString('hex'),started=new Date().toISOString();
  const health=new MobileHealth({instance:status.instance,probe:async origin=>{
    const response=await fetch(origin+'/api/v1/ready',{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error('external-http-'+response.status);return response.json();
  },onChange:state=>{
    fs.writeFileSync(infoFile,JSON.stringify({app:'IMPAVIDUS MOBILE',...state,pid:process.pid,token,started},null,2));
    const content=state.ready?'Telefonon nyisd meg:\r\n'+state.origin+'\r\n':'A mobilkapcsolat meg nem elerheto. Allapot: '+state.status+'\r\nInditsd ujra a MOBIL_INDITAS.cmd fajllal.\r\n';
    fs.writeFileSync(path.join(root,'MOBIL_CIM.txt'),content+'\r\nA gepnek es a mobil kapcsolatnak futnia kell.\r\nUjrainditas utan mas cim lehet; a regi cim helyi offline adatai nem koltoznek at.\r\n');
    console.log(JSON.stringify({event:'mobile_health',status:state.status,reason:state.reason,origin:state.origin,checkedAt:state.checkedAt}));
  }});
  const server=createMobileProxy({targetPort:port,getOrigin:()=>health.state.origin,getStatus:()=>({...health.state})});
  const shutdown=()=>{if(stopping)return;stopping=true;if(child&&!child.killed)child.kill();server.close();clearInterval(timer);clearInterval(healthTimer);clearTimeout(startupTimeout);if(fs.existsSync(infoFile)&&JSON.parse(fs.readFileSync(infoFile)).token===token)fs.unlinkSync(infoFile);fs.writeFileSync(path.join(root,'MOBIL_CIM.txt'),'A mobilkapcsolat leallt. Inditas: MOBIL_INDITAS.cmd\r\n');setTimeout(()=>process.exit(process.exitCode||0),500).unref();};
  const startupTimeout=setTimeout(()=>{if(!health.state.ready){console.error('A telefonos kapcsolat 60 masodpercen belul nem valt elerhetove.');process.exitCode=1;shutdown();}},60000);
  const healthTimer=setInterval(()=>{if(!stopping)health.check();},5000);
  const timer=setInterval(()=>{if(fs.existsSync(stopFile)){const request=fs.readFileSync(stopFile,'utf8').trim();if(request===token){fs.unlinkSync(stopFile);shutdown();}}},500);
  server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'A telefonos átjáró már fut, vagy a 8084 port foglalt.':e.message);shutdown();process.exitCode=1;});
  server.listen(8084,'127.0.0.1',()=>{
    child=spawn(binary,['tunnel','--no-autoupdate','--protocol','http2','--url','http://127.0.0.1:8084'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
    const read=chunk=>{process.stdout.write(chunk);health.receive(chunk);};
    child.stdout.on('data',read);child.stderr.on('data',read);
    child.on('error',e=>{console.error(e.message);shutdown();});child.on('exit',code=>{if(!stopping){console.error('A telefonos kapcsolat leállt: '+code);shutdown();}});
  });
  process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
