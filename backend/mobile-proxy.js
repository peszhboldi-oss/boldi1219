'use strict';
const http=require('node:http');
// HTTPS terminates at Cloudflare. Only this loopback gateway trusts that tunnel.
// The existing application and its database remain the single backend.
function createMobileProxy({targetPort=8082,getOrigin,logger=console}={}){
  return http.createServer((req,res)=>{
    const origin=getOrigin(),localHost=req.headers.host==='127.0.0.1:8084';
    if(req.url==='/__mobile_status'&&localHost){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});return res.end(JSON.stringify({app:'IMPAVIDUS MOBILE',origin:origin||null}));}
    if(!origin){res.writeHead(503);return res.end('A telefonos kapcsolat indul.');}
    const publicHost=new URL(origin).host;
    if(req.headers.host!==publicHost||req.headers['x-forwarded-proto']!=='https'){res.writeHead(421);return res.end('Invalid HTTPS host');}
    if(req.headers.origin&&req.headers.origin!==origin){res.writeHead(403);return res.end('Invalid origin');}
    if(!['GET','HEAD'].includes(req.method)&&req.headers['sec-fetch-site']==='cross-site'){res.writeHead(403);return res.end('Cross-site request denied');}
    const pathname=new URL(req.url,'http://localhost').pathname;
    const normalized=pathname.split('/').filter(Boolean).join('/');
    if(pathname.startsWith('/__mobile_')||normalized==='api/v1/auth/setup'){res.writeHead(403);return res.end('Local operation only');}
    const headers={...req.headers,host:'127.0.0.1:'+targetPort};
    if(headers.origin)headers.origin='http://127.0.0.1:'+targetPort;
    for(const key of ['forwarded','x-forwarded-host','x-forwarded-proto','x-forwarded-for','connection','proxy-authorization'])delete headers[key];
    const upstream=http.request({hostname:'127.0.0.1',port:targetPort,path:req.url,method:req.method,headers},response=>{
      const outgoing={...response.headers,'strict-transport-security':'max-age=86400'};
      delete outgoing.connection;
      if(outgoing['set-cookie'])outgoing['set-cookie']=outgoing['set-cookie'].map(cookie=>/;\s*Secure(?:;|$)/i.test(cookie)?cookie:cookie+'; Secure');
      res.writeHead(response.statusCode,outgoing);response.pipe(res);
    });
    upstream.setTimeout(30000,()=>upstream.destroy());
    upstream.on('error',()=>{logger.error('mobile_upstream_unavailable');if(!res.headersSent){res.writeHead(502,{'content-type':'text/plain; charset=utf-8'});res.end('Az alkalmazás nem érhető el a számítógépen.');}else res.destroy();});
    req.on('aborted',()=>upstream.destroy());req.pipe(upstream);
  });
}
module.exports={createMobileProxy};
