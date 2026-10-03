'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');let failed=false,count=0;
const files=['server.js','sw.js'];
for(const dir of ['backend','frontend','scripts','tests'])for(const file of fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.js')))files.push(dir+'/'+file);
for(const file of files){const source=fs.readFileSync(path.join(root,file),'utf8');count++;try{if(file.startsWith('frontend/'))new vm.SourceTextModule(source,{identifier:file});else new vm.Script(source,{filename:file});}catch(e){failed=true;console.error(e.message);}}
console.log(`${count} JavaScript-fájl szintaktikai ellenőrzése: ${failed?'SIKERTELEN':'OK'}`);process.exitCode=failed?1:0;
