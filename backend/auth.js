'use strict';
const { randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash }=require('node:crypto');
const V=require('./validation');
const hash=value=>createHash('sha256').update(value).digest('hex');
function passwordHash(password) { const salt=randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password,salt,64).toString('hex')}`; }
function verify(password,stored) { if (!stored) { scryptSync(password,'missing-account',64); return false; } const [salt,h]=stored.split(':'); const expected=Buffer.from(h,'hex'); const actual=scryptSync(password,salt,64); return expected.length===actual.length && timingSafeEqual(expected,actual); }
function createAuth(store,{secure=false,sessionHours=12,allowSetup=true}={}) {
  const attempts=new Map();
  function session(req) { const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('il_session=')); if (!cookie) return null; const token=cookie.slice(11); if(!/^[a-f0-9]{64}$/.test(token)) return null; return store.get('SELECT a.id,a.email,a.role,s.csrf,s.token_hash,c.id AS client_id FROM sessions s JOIN accounts a ON a.id=s.account_id LEFT JOIN clients c ON c.account_id=a.id WHERE s.token_hash=? AND s.expires_at>? AND a.active=1',hash(token),new Date().toISOString()); }
  function issue(res,account) { const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex'); store.run('DELETE FROM sessions WHERE expires_at<?',new Date().toISOString()); store.run('INSERT INTO sessions VALUES(?,?,?,?)',hash(token),account.id,csrf,new Date(Date.now()+sessionHours*3600000).toISOString()); res.setHeader('set-cookie',`il_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionHours*3600}${secure?'; Secure':''}`); return {id:account.id,email:account.email,role:account.role,client_id:account.client_id||null,csrf}; }
  function mutation(req,user) {
    const origin=req.headers.origin;
    if (origin && origin!==`${secure?'https':'http'}://${req.headers.host}`) V.fail('Idegen eredetű kérés.',403,'origin');
    if (req.headers['sec-fetch-site']==='cross-site') V.fail('Idegen eredetű kérés.',403,'origin');
    if (user && req.headers['x-csrf-token']!==user.csrf) V.fail('Érvénytelen biztonsági token. Lépj be újra.',403,'csrf');
    if (!String(req.headers['content-type']||'').startsWith('application/json')) V.fail('JSON-kérés szükséges.',415,'content-type');
  }
  function login(req,res,b) { const key=`${req.socket.remoteAddress}:${V.email(b.email)}`; const now=Date.now(); const attempt=attempts.get(key)||{count:0,until:now+900000}; if(attempt.until<now) {attempt.count=0;attempt.until=now+900000;} if(attempt.count>=10) V.fail('Túl sok belépési kísérlet. Próbáld újra 15 perc múlva.',429,'rate-limit'); const pass=V.password(b.password);
    const account=store.get('SELECT a.*,c.id AS client_id FROM accounts a LEFT JOIN clients c ON c.account_id=a.id WHERE email=? AND active=1',V.email(b.email));
    const valid=verify(pass,account?.password_hash);
    if(!account || !valid) { attempt.count++; attempts.set(key,attempt); if(attempts.size>5000) attempts.delete(attempts.keys().next().value); V.fail('Hibás e-mail vagy jelszó.',401,'login'); } attempts.delete(key); return issue(res,account); }
  function setup(res,b) { if(!allowSetup)V.fail('Éles módban az elsőfiók-létrehozás tiltott. Inicializáld az edzőt a szerveren.',403,'setup-disabled');if(store.get('SELECT 1 FROM accounts WHERE role IN (\'coach\',\'admin\')')) V.fail('Az első edző már létrejött.',409,'setup-complete'); const account={id:randomUUID(),email:V.email(b.email),role:'coach'}; store.run('INSERT INTO accounts VALUES(?,?,?,?,?,?)',account.id,account.email,passwordHash(V.password(b.password)),account.role,1,new Date().toISOString()); return issue(res,account); }
  function redeem(res,b) { const invitation=store.get('SELECT i.*,c.account_id FROM invitations i JOIN clients c ON c.id=i.client_id WHERE token_hash=? AND used_at IS NULL AND expires_at>? AND c.archived_at IS NULL',hash(V.text(b.code,'Meghívó',100,true)),new Date().toISOString()); if(!invitation) V.fail('A meghívó lejárt vagy nem érvényes.',422,'invitation'); const email=V.email(b.email),pass=passwordHash(V.password(b.password)); store.transaction(()=>{store.run('UPDATE accounts SET email=?,password_hash=? WHERE id=?',email,pass,invitation.account_id);store.run('UPDATE invitations SET used_at=? WHERE token_hash=?',new Date().toISOString(),invitation.token_hash);store.run('DELETE FROM sessions WHERE account_id=?',invitation.account_id);}); return issue(res,{id:invitation.account_id,email,role:'client',client_id:invitation.client_id}); }
  return {session,issue,mutation,login,setup,redeem,hash};
}
module.exports={createAuth,passwordHash,hash};
