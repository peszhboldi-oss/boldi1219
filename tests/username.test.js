'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite'),{Store}=require('../backend/store');
const {createServer}=require('../backend/server'),{createAuth,passwordHash,hash}=require('../backend/auth');
const {today}=require('../backend/metrics');
const password='Synthetic-password-2026!';

test('korábbi adatbázis átállása megőrzi a jelszót, munkamenetet és profilt',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'impavidus-migrate-')),file=path.join(dir,'old.sqlite');
  const old=new DatabaseSync(file);
  old.exec('CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT NOT NULL)');
  for(const migration of ['001_core.sql','002_snapshots_and_preferences.sql']){
    old.exec(fs.readFileSync(path.join(__dirname,'../db/sqlite',migration),'utf8'));
    old.prepare('INSERT INTO schema_migrations VALUES(?,?)').run(migration,new Date().toISOString());
  }
  const stored=passwordHash(password),timestamp=new Date().toISOString();
  old.prepare('INSERT INTO accounts VALUES(?,?,?,?,1,?)').run('coach','old@example.test',stored,'coach',timestamp);
  old.prepare('INSERT INTO accounts VALUES(?,?,?,?,1,?)').run('client',null,null,'client',timestamp);
  old.prepare('INSERT INTO clients(id,account_id,name,start_date,created_at,updated_at) VALUES(?,?,?,?,?,?)').run('profile','client','Régi tesztprofil',today(),timestamp,timestamp);
  old.prepare('INSERT INTO assignments VALUES(?,?,1)').run('coach','profile');
  const token='ab'.repeat(32);
  old.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hash(token),'coach','old-csrf',new Date(Date.now()+3600000).toISOString());
  old.close();
  const store=new Store(file);t.after(()=>store.close());
  assert.equal(store.get('SELECT username,password_hash FROM accounts WHERE id=?','coach').password_hash,stored);
  assert.equal(store.get('SELECT name FROM clients WHERE id=?','profile').name,'Régi tesztprofil');
  assert.ok(store.get('SELECT 1 FROM assignments WHERE coach_id=?','coach'));
  assert.equal(store.get("SELECT name FROM sqlite_master WHERE name='invitations'"),undefined);
  const auth=createAuth(store);let cookie;
  assert.equal(auth.session({headers:{cookie:'il_session='+token}}).csrf,'old-csrf');
  const user=auth.login({socket:{remoteAddress:'test'}},{setHeader(k,v){cookie=v;}},{username:'old@example.test',password});
  assert.equal(user.username,'old@example.test');
  assert.equal(auth.session({headers:{cookie}}).id,'coach');
});

test('közvetlen kliensfiók, egyedi név és csak hozzárendelt edzői jelszókezelés',async t=>{
  const store=new Store(':memory:'),errors=[];
  const server=createServer({store,logger:{info(){},error:e=>errors.push(e)}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  t.after(async()=>{await new Promise(r=>server.close(r));store.close();});
  const base=`http://127.0.0.1:${server.address().port}/api/v1`;
  function actor(){return {cookie:'',csrf:'',async call(route,method='GET',data={},status=200){
    const response=await fetch(base+route,{method,headers:{cookie:this.cookie,...(method==='GET'?{}:{'content-type':'application/json','x-csrf-token':this.csrf})},body:method==='GET'?undefined:JSON.stringify(data)});
    const result=await response.json();assert.equal(response.status,status,JSON.stringify(result));
    if(response.headers.get('set-cookie'))this.cookie=response.headers.get('set-cookie').split(';')[0];
    if(result.csrf)this.csrf=result.csrf;return result;
  }};}
  const coach=actor(),client=actor(),anonymous=actor(),other=actor();
  await coach.call('/auth/setup','POST',{username:'trainer',password},201);
  const profile={name:'Szintetikus Sportoló',start_date:today(),username:'athlete',password};
  const c=await coach.call('/clients','POST',profile,201),access='/clients/'+c.id+'/access';
  await coach.call('/clients','POST',{...profile,username:'ATHLETE'},409);
  assert.equal(store.get('SELECT count(*) AS n FROM clients').n,1);
  await client.call('/auth/login','POST',{username:'ATHLETE',password});
  await client.call(access,'GET',{},403);await client.call(access,'POST',{username:'hacked',password,version:1},403);
  store.run('INSERT INTO accounts VALUES(?,?,?,?,1,?)','other','other',passwordHash(password),'coach',new Date().toISOString());
  await other.call('/auth/login','POST',{username:'other',password});
  await other.call(access,'GET',{},404);await other.call(access,'POST',{username:'hacked',password,version:1},404);
  assert.deepEqual(await coach.call(access),{username:'athlete',has_password:true,version:1});
  await coach.call(access,'POST',{username:'renamed',password:'',version:1});
  await client.call('/auth/session').then(s=>assert.equal(s.user,null));
  client.cookie='';client.csrf='';await client.call('/auth/login','POST',{username:'renamed',password});
  await coach.call(access,'POST',{username:'stale',password,version:1},409);
  const newPassword='Synthetic-new-password-2026!';
  await coach.call(access,'POST',{username:'renamed',password:newPassword,version:2});
  await client.call('/clients','GET',{},401);
  await anonymous.call('/auth/login','POST',{username:'renamed',password},401);
  client.cookie='';client.csrf='';await client.call('/auth/login','POST',{username:'renamed',password:newPassword});
  assert.equal((await client.call('/clients/'+c.id)).name,c.name);
  const revisions=store.all("SELECT before_json,after_json FROM revisions WHERE entity='account'");
  assert.equal(revisions.length,2);assert.doesNotMatch(JSON.stringify(revisions),/Synthetic|password_hash|salt/);
  await anonymous.call('/auth/redeem','POST',{},404);assert.deepEqual(errors,[]);
});
