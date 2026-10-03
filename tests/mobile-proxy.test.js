'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {createMobileProxy}=require('../backend/mobile-proxy');
test('Mobile gateway enforces HTTPS host/origin and preserves CSRF and secure cookies',async()=>{
  const upstream=http.createServer((req,res)=>{res.setHeader('set-cookie','il_session=test; HttpOnly; SameSite=Strict; Path=/');res.end(JSON.stringify({host:req.headers.host,origin:req.headers.origin,csrf:req.headers['x-csrf-token']}));});
  await new Promise(r=>upstream.listen(0,'127.0.0.1',r));let origin='https://demo.trycloudflare.com';
  const gateway=createMobileProxy({targetPort:upstream.address().port,getOrigin:()=>origin,logger:{error(){}}});await new Promise(r=>gateway.listen(0,'127.0.0.1',r));
  const request=(headers={},route='/api/v1/auth/login')=>new Promise((resolve,reject)=>{const q=http.request({host:'127.0.0.1',port:gateway.address().port,path:route,method:'POST',headers:{host:'demo.trycloudflare.com','x-forwarded-proto':'https',...headers}},r=>{let body='';r.on('data',b=>body+=b);r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,body}));});q.on('error',reject);q.end('{}');});
  try{
    const good=await request({origin,'x-csrf-token':'preserved'});assert.equal(good.status,200);assert.match(good.headers['set-cookie'][0],/; Secure$/);assert.deepEqual(JSON.parse(good.body),{host:'127.0.0.1:'+upstream.address().port,origin:'http://127.0.0.1:'+upstream.address().port,csrf:'preserved'});
    assert.equal((await request({origin:'https://attacker.example'})).status,403);
    assert.equal((await request({'sec-fetch-site':'cross-site'})).status,403);
    assert.equal((await request({host:'attacker.example'})).status,421);
    assert.equal((await request({'x-forwarded-proto':'http'})).status,421);
    assert.equal((await request({},'/api/v1/auth/setup')).status,403);
    assert.equal((await request({},'/api/v1//auth/setup')).status,403);
    assert.equal((await request({},'/__mobile_status')).status,403);
    origin=null;assert.equal((await request()).status,503);
  }finally{await new Promise(r=>gateway.close(r));await new Promise(r=>upstream.close(r));}
});
