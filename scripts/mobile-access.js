'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{randomBytes}=require('node:crypto');
const {createMobileProxy}=require('../backend/mobile-proxy');
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
  fs.mkdirSync(data,{recursive:true});let origin=null,child,stopping=false;const token=randomBytes(24).toString('hex');
  const server=createMobileProxy({targetPort:port,getOrigin:()=>origin});
  const shutdown=()=>{if(stopping)return;stopping=true;if(child&&!child.killed)child.kill();server.close();clearInterval(timer);clearTimeout(startupTimeout);if(fs.existsSync(infoFile)&&JSON.parse(fs.readFileSync(infoFile)).token===token)fs.unlinkSync(infoFile);setTimeout(()=>process.exit(process.exitCode||0),500).unref();};
  const startupTimeout=setTimeout(()=>{if(!origin){console.error('A telefonos cim 45 masodpercen belul nem erkezett meg.');process.exitCode=1;shutdown();}},45000);
  const timer=setInterval(()=>{if(fs.existsSync(stopFile)){const request=fs.readFileSync(stopFile,'utf8').trim();if(request===token){fs.unlinkSync(stopFile);shutdown();}}},500);
  server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'A telefonos átjáró már fut, vagy a 8084 port foglalt.':e.message);shutdown();process.exitCode=1;});
  server.listen(8084,'127.0.0.1',()=>{
    child=spawn(binary,['tunnel','--no-autoupdate','--protocol','http2','--url','http://127.0.0.1:8084'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
    const read=chunk=>{const text=chunk.toString();process.stdout.write(text);const match=text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);if(match&&!origin){origin=match[0];fs.writeFileSync(infoFile,JSON.stringify({app:'IMPAVIDUS MOBILE',origin,pid:process.pid,token,started:new Date().toISOString()},null,2));fs.writeFileSync(path.join(root,'MOBIL_CIM.txt'),'Telefonon nyisd meg:\r\n'+origin+'\r\n\r\nA gepnek es a mobil kapcsolatnak futnia kell.\r\nUjrainditas utan mas cim lehet; a regi cim helyi offline adatai nem koltoznek at.\r\n');console.log('MOBIL CÍM: '+origin);}};
    child.stdout.on('data',read);child.stderr.on('data',read);
    child.on('error',e=>{console.error(e.message);shutdown();});child.on('exit',code=>{if(!stopping){console.error('A telefonos kapcsolat leállt: '+code);shutdown();}});
  });
  process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
