'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
// Vercel's runtime does not support require(ESM). Generate the module format
// from the single canonical implementation; no calculation is duplicated.
const domain=fs.readFileSync(path.join(root,'frontend/domain.mjs'),'utf8');
const exportStatement=domain.match(/export \{ ([a-zA-Z0-9_, ]+) \};?\s*$/);
if(!exportStatement||/\bimport\s/.test(domain))throw new Error('Demo build: shared domain module format changed');
const generated=path.join(root,'generated');fs.mkdirSync(generated,{recursive:true});
fs.writeFileSync(path.join(generated,'demo-domain.cjs'),"'use strict';\n"+domain.replace(exportStatement[0],'module.exports={'+exportStatement[1]+'};\n'));
require('./build');
fs.copyFileSync(path.join(root,'frontend/demo-ui.js'),path.join(dist,'frontend/demo-ui.js'));
const repository=path.join(dist,'frontend/repository.js');
const marker="async request(path,method='GET',data){";
let repositorySource=fs.readFileSync(repository,'utf8');
if(!repositorySource.includes(marker))throw new Error('Demo build: Repository request boundary changed');
repositorySource=repositorySource.replace(marker,marker+"if(method!=='GET'&&!['/auth/login','/auth/logout'].includes(path))throw new ApiError(403,'A nyilvános bemutató csak megtekinthető; a kliensadatok módosítása és törlése le van tiltva.','demo-read-only');");
repositorySource=repositorySource.replace("today:new Intl.DateTimeFormat('en-CA',{timeZone:saved.timeZone||'Europe/Budapest',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())","today:'2026-10-03'");
fs.writeFileSync(repository,repositorySource);
const index=path.join(dist,'index.html');
fs.writeFileSync(index,fs.readFileSync(index,'utf8').replace('<title>IMPAVIDUS LAB</title>','<title>IMPAVIDUS LAB · Nyilvános demó</title>').replace('</head>','  <script type="module" src="/frontend/demo-ui.js"></script>\n</head>'));
const sw=path.join(dist,'sw.js');
fs.writeFileSync(sw,fs.readFileSync(sw,'utf8').replace("impavidus-shell-v15","impavidus-shell-public-demo-v1").replace("FILES=['./'","FILES=['./frontend/demo-ui.js','./'"));
const css=`\n/* Public demo status; source app styles are unchanged. */\n.public-demo-banner{position:relative;z-index:70;display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;padding:10px 20px;background:#33111e;border-bottom:1px solid #70334c;font-size:12px;color:#eadbe1}.public-demo-banner strong{letter-spacing:.12em}.shell{min-height:calc(100dvh - 44px)}.auth{min-height:calc(100dvh - 44px)}.demo-accounts{padding:16px;margin:20px 0;border:1px solid #53303f;border-radius:12px;background:#151116}.demo-accounts h2{font-size:18px;margin:0 0 8px}.demo-accounts p{font-size:12px;color:#b9abb2;line-height:1.6}.demo-accounts>button{display:flex;justify-content:space-between;gap:12px;width:100%;margin:7px 0;text-align:left}.demo-accounts details{margin-top:12px;font-size:12px}.demo-accounts code{overflow-wrap:anywhere}button[data-demo-disabled]{opacity:.45;cursor:not-allowed}@media(max-width:650px){.public-demo-banner{padding:10px 14px;font-size:11px}.public-demo-banner span{line-height:1.5}.demo-accounts>button{flex-wrap:wrap}}\n`;
fs.appendFileSync(path.join(dist,'frontend/styles.css'),css);
fs.appendFileSync(path.join(dist,'frontend/styles.css'),'\n.public-demo-banner{position:sticky;top:0}.shell,.auth{min-height:calc(100dvh - var(--demo-banner-height,44px))}@media(min-width:761px){.sidebar{top:var(--demo-banner-height,44px);height:calc(100dvh - var(--demo-banner-height,44px))}}@media(max-width:760px){.topbar{top:var(--demo-banner-height,44px)}.sidebar{top:calc(var(--demo-banner-height,44px) + 68px);height:calc(100dvh - var(--demo-banner-height,44px) - 68px)}}\n');
console.log('Public read-only demo build OK: original UI + demo account selector; SQLite fixture stays private to API bundle.');
