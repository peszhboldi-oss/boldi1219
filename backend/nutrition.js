'use strict';
const {randomUUID}=require('node:crypto');
const V=require('./validation');
const KEYS=['calories','protein','carbs','fat'];
const round=n=>Math.round((n+Number.EPSILON)*1e6)/1e6;
function scaled(reference,grams){return Object.fromEntries(KEYS.map(k=>[k,reference[k]==null?null:round(reference[k]*grams/100)]));}
function totals(rows){return Object.fromEntries(KEYS.map(k=>[k,rows.length&&rows.every(r=>r[k]!=null)?round(rows.reduce((n,r)=>n+r[k],0)):null]));}
function createNutrition({store,coach,access,editable,day,now,rev}){
  const foodView=f=>({...f,scope:f.owner_id?'private':'central'});
  function visible(user,food){return !!food&&(food.owner_id===null||food.owner_id===user.id||user.role==='admin'||(user.role==='coach'&&store.get('SELECT 1 FROM clients c JOIN assignments a ON c.id=a.client_id WHERE c.account_id=? AND a.coach_id=? AND a.active=1',food.owner_id,user.id)));}
  function food(user,id,active=false){const f=store.get('SELECT * FROM foods WHERE id=?',id);if(!visible(user,f))V.fail('Az élelmiszer nem található.',404,'not-found');if(active&&!f.active)V.fail('Az élelmiszer inaktív.');return f;}
  function reference(f){return Object.fromEntries(['id','name','category',...KEYS,'reference_grams','version'].map(k=>[k,f[k]]));}
  function validateFood(b){const result={name:V.text(b.name,'Élelmiszer neve',160,true),category:V.text(b.category,'Kategória',80),active:V.bool(b.active,true)?1:0};for(const k of KEYS)result[k]=V.number(b[k],k,0,k==='calories'?1000:100);return result;}
  function foods(user,method,id,b){
    if(method==='GET')return store.all('SELECT * FROM foods ORDER BY name').filter(f=>visible(user,f)).map(foodView);
    if(method==='POST'){
      const f=validateFood(b),owner=user.role==='client'||b.scope==='private'?user.id:null;if(!owner)coach(user);const fid=b._local_id?V.uuid(b._local_id):randomUUID();
      store.transaction(()=>{store.run('INSERT INTO foods(id,name,category,owner_id,created_by,calories,protein,carbs,fat,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',fid,f.name,f.category,owner,user.id,f.calories,f.protein,f.carbs,f.fat,f.active,now(),now());rev('food-catalog',fid,user,null,f);});return foodView(food(user,fid));
    }
    const old=food(user,id);if(old.owner_id!==user.id){if(old.owner_id!==null&&user.role!=='admin')V.fail('Csak a saját élelmiszered módosítható.',403);coach(user);}V.version(b,old);
    if(method==='PATCH'){const f=validateFood(b);store.transaction(()=>{store.run('UPDATE foods SET name=?,category=?,calories=?,protein=?,carbs=?,fat=?,active=?,version=version+1,updated_at=? WHERE id=?',f.name,f.category,f.calories,f.protein,f.carbs,f.fat,f.active,now(),id);rev('food-catalog',id,user,old,f);});return foodView(food(user,id));}
    V.fail('Nincs ilyen élelmiszerművelet.',405);
  }
  const dietView=d=>d?{...d,items:JSON.parse(d.items_json),items_json:undefined}:null;
  function activeDiet(cid,date){return dietView(store.get('SELECT * FROM diets WHERE client_id=? AND active=1 AND start_date<=? AND (end_date IS NULL OR end_date>=?) ORDER BY start_date DESC,updated_at DESC,rowid DESC LIMIT 1',cid,date,date));}
  function validateDiet(user,b){
    const d={name:V.text(b.name,'Étrend neve',160,true),start_date:V.date(b.start_date),end_date:b.end_date?V.date(b.end_date):null,phase:V.text(b.phase,'Fázis',120),meals:V.number(b.meals,'Étkezések',5,6,true,true),note:V.text(b.note,'Megjegyzés',10000)};
    if(d.end_date&&d.end_date<d.start_date)V.fail('A záródátum nem előzheti meg a kezdést.');for(const k of KEYS)d[k]=V.number(b[k],'Napi '+k,0,20000);
    if(!Array.isArray(b.items)||b.items.length>100)V.fail('Legfeljebb 100 étrendi tétel adható meg.');
    d.items=b.items.map(i=>{const f=food(user,V.text(i.food_id,'Élelmiszer',50,true),true),grams=V.number(i.grams,'Tervezett gramm',0.1,10000,true),meal=V.number(i.meal,'Étkezés',1,d.meals,true,true);return {food_id:f.id,name:f.name,grams,meal,reference:reference(f),...scaled(f,grams)};});return d;
  }
  function insertDiet(user,cid,d){const id=d._local_id?V.uuid(d._local_id):randomUUID();store.run('INSERT INTO diets(id,client_id,coach_id,name,start_date,end_date,phase,calories,protein,carbs,fat,meals,items_json,note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id,cid,user.id,d.name,d.start_date,d.end_date,d.phase,d.calories,d.protein,d.carbs,d.fat,d.meals,JSON.stringify(d.items),d.note,now(),now());rev('nutrition-plan',id,user,null,d);return dietView(store.get('SELECT * FROM diets WHERE id=?',id));}
  function diets(user,c,method,id,b,operation){
    if(method==='GET')return store.all('SELECT * FROM diets WHERE client_id=? ORDER BY start_date DESC,updated_at DESC',c.id).map(dietView);
    coach(user);editable(c);
    if(method==='POST'&&!id){const d={...validateDiet(user,b),_local_id:b._local_id};return store.transaction(()=>insertDiet(user,c.id,d));}
    const old=dietView(store.get('SELECT * FROM diets WHERE id=? AND client_id=?',id,c.id));if(!old)V.fail('Az étrend nem található.',404);
    if(method==='POST'&&operation==='copy'){const dest=access(user,V.text(b.client_id,'Célkliens',50,true));editable(dest);const copy={...old,_local_id:b._local_id,name:V.text(b.name,'Étrend neve',160,true),start_date:V.date(b.start_date||old.start_date)};if(copy.end_date&&copy.end_date<copy.start_date)copy.end_date=null;return store.transaction(()=>insertDiet(user,dest.id,copy));}
    V.version(b,old);
    if(method==='PATCH'){const d=validateDiet(user,b);store.transaction(()=>{store.run('UPDATE diets SET name=?,start_date=?,end_date=?,phase=?,calories=?,protein=?,carbs=?,fat=?,meals=?,items_json=?,note=?,version=version+1,updated_at=? WHERE id=?',d.name,d.start_date,d.end_date,d.phase,d.calories,d.protein,d.carbs,d.fat,d.meals,JSON.stringify(d.items),d.note,now(),id);rev('nutrition-plan',id,user,old,d);});return dietView(store.get('SELECT * FROM diets WHERE id=?',id));}
    if(method==='DELETE'){store.transaction(()=>{store.run('UPDATE diets SET active=0,version=version+1,updated_at=? WHERE id=?',now(),id);rev('nutrition-plan',id,user,old,{archived:true});});return {ok:true};}
    V.fail('Nincs ilyen étrendművelet.',405);
  }
  function logs(cid){return store.all('SELECT * FROM food_logs WHERE client_id=? AND archived_at IS NULL ORDER BY date DESC,meal,created_at',cid).map(f=>({...f,reference:f.reference_json?JSON.parse(f.reference_json):null,reference_json:undefined}));}
  function insertLog(user,cid,n){const id=n._local_id?V.uuid(n._local_id):randomUUID();store.run('INSERT INTO food_logs(id,client_id,date,meal,name,grams,protein,carbs,fat,calories,created_at,food_id,consumed,reference_json,note,diet_id,diet_version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id,cid,n.date,n.meal,n.name,n.grams,n.protein,n.carbs,n.fat,n.calories,now(),n.food_id||null,n.consumed?1:0,n.reference?JSON.stringify(n.reference):null,n.note||'',n.diet_id||null,n.diet_version||null);rev('food',id,user,null,n);return logs(cid).find(f=>f.id===id);}
  function foodLogs(user,c,method,id,b){
    if(method==='GET')return logs(c.id);access(user,c.id,true);editable(c);
    if(method==='POST'&&id==='copy'){
      if(b._copy_ids&&(!Array.isArray(b._copy_ids)||b._copy_ids.length!==100))V.fail('Hibás másolásazonosítók.');const date=day(b.date),diet=activeDiet(c.id,date);let source;
      if(b.source==='diet'){if(!diet)V.fail('Nincs érvényes étrend erre a napra.');source=diet.items.map(i=>({...i,date,consumed:false,diet_id:diet.id,diet_version:diet.version}));}
      else if(b.source==='previous'){const prev=V.date(b.from_date);if(prev>=date)V.fail('Korábbi napot válassz.');source=logs(c.id).filter(i=>i.date===prev&&i.consumed).map(i=>({...i,date,consumed:false}));}
      else V.fail('Étrend vagy előző nap másolható.');
      return store.transaction(()=>{const existing=logs(c.id).filter(i=>i.date===date);return {items:source.filter(i=>!existing.some(e=>e.meal===i.meal&&e.name===i.name&&e.grams===i.grams)).map((i,index)=>insertLog(user,c.id,{...i,_local_id:b._copy_ids?V.uuid(b._copy_ids[index]):null})),consumed:false};});
    }
    const old=id?logs(c.id).find(i=>i.id===id):null;if(id&&!old)V.fail('Az étkezés nem található.',404);
    if(old)V.version(b,old);
    if(method==='DELETE'){store.transaction(()=>{store.run('UPDATE food_logs SET archived_at=?,version=version+1 WHERE id=?',now(),id);rev('food',id,user,old,{archived:true});});return {ok:true};}
    const date=day(b.date||old?.date),meal=V.number(b.meal??old?.meal,'Étkezés',1,Math.max(activeDiet(c.id,date)?.meals||JSON.parse(c.preferences_json).meals||5,old?.meal||0),true,true),grams=V.number(b.grams??old?.grams,'Gramm',0.1,10000,true),consumed=V.bool(b.consumed,old?!!old.consumed:true),note=V.text(b.note??old?.note,'Megjegyzés',2000);
    const foodId=b.food_id===undefined?old?.food_id:b.food_id;let ref=foodId===''?null:old?.reference;
    if(foodId&&foodId!==old?.food_id)ref=reference(food(user,foodId,true));
    const name=ref?.name||V.text(b.name||old?.name,'Étel neve',160,true);
    const n={_local_id:b._local_id,date,meal,grams,consumed,note,name,food_id:foodId||null,reference:ref||null,diet_id:old?.diet_id||null,diet_version:old?.diet_version||null};
    if(ref)Object.assign(n,scaled(ref,grams));else for(const k of KEYS)n[k]=b[k]===undefined?(old?.[k]==null?null:round(old[k]*grams/old.grams)):V.number(b[k],k,0,20000);
    if(method==='POST')return store.transaction(()=>insertLog(user,c.id,n));
    if(method==='PATCH'){store.transaction(()=>{store.run('UPDATE food_logs SET date=?,meal=?,name=?,grams=?,protein=?,carbs=?,fat=?,calories=?,food_id=?,consumed=?,reference_json=?,note=?,version=version+1 WHERE id=?',n.date,n.meal,n.name,n.grams,n.protein,n.carbs,n.fat,n.calories,n.food_id,n.consumed?1:0,n.reference?JSON.stringify(n.reference):null,n.note,id);rev('food',id,user,old,n);});return logs(c.id).find(f=>f.id===id);}
    V.fail('Nincs ilyen étkezésművelet.',405);
  }
  function summary(cid,from,to){const rows=logs(cid),days=[];for(let date=from;date<=to;date=require('./metrics').shift(date,1)){const diet=activeDiet(cid,date),actual=rows.filter(f=>f.date===date&&f.consumed),sum=totals(actual),targets=Object.fromEntries(KEYS.map(k=>[k,diet?.[k]??null])),delta=Object.fromEntries(KEYS.map(k=>[k,sum[k]!=null&&targets[k]!=null?round(sum[k]-targets[k]):null]));days.push({date,actual:sum,targets,delta,entries:actual.length,pending:rows.filter(f=>f.date===date&&!f.consumed).length,diet});}const recorded=days.filter(d=>d.entries);return {days,averages:Object.fromEntries(KEYS.map(k=>[k,recorded.length&&recorded.every(d=>d.actual[k]!=null)?round(recorded.reduce((n,d)=>n+d.actual[k],0)/recorded.length):null])),recordedDays:recorded.length};}
  return {foods,diets,foodLogs,summary,activeDiet};
}
module.exports={createNutrition,scaled,totals,round,KEYS};
