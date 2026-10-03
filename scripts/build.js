'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'dist');
// Deterministic local packaging, no dependency download or bundler required.
const files=['index.html','sw.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','frontend/app.js','frontend/styles.css','frontend/repository.js','frontend/modules.js','frontend/offline.js','frontend/domain.mjs','frontend/charts.js'];
for(const file of files){const output=path.join(dest,file);fs.mkdirSync(path.dirname(output),{recursive:true});fs.copyFileSync(path.join(root,file),output);}
fs.writeFileSync(path.join(dest,'build.json'),JSON.stringify({version:require('../package.json').version,files},null,2));
console.log(`Build OK: ${files.length} alkalmazásfájl → dist (kizárólag frontend; API külön fut).`);
