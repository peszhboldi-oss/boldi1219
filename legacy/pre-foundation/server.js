// Függőség nélküli helyi szerver: node server.js  ->  http://localhost:8080
const http=require('http'),fs=require('fs'),path=require('path');
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
http.createServer((q,r)=>{let f=path.join(__dirname,decodeURIComponent(q.url.split('?')[0]));if(f.endsWith(path.sep)||q.url=='/')f=path.join(__dirname,'index.html');
if(!f.startsWith(__dirname)){r.writeHead(403);return r.end()}
fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('Nincs ilyen fájl')}r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(8080,()=>console.log('Impavidus Lab: http://localhost:8080'));
