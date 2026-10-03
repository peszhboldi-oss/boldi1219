import {stats,streak,today} from './domain.mjs';
export {stats,streak,today};
export class LocalStore{
  constructor(){this.db=new Promise((resolve,reject)=>{const request=indexedDB.open('impavidus-private-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('records',{keyPath:'key'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('A helyi adattár nem érhető el. A mentés nem történt meg.'));});}
  async all(){const db=await this.db;return new Promise((resolve,reject)=>{const r=db.transaction('records').objectStore('records').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  async get(key){return (await this.all()).find(r=>r.key===key)?.value;}
  async write(changes){const db=await this.db;return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),table=tx.objectStore('records');for(const change of changes)if(change.remove)table.delete(change.key);else table.put(change);tx.oncomplete=resolve;tx.onabort=()=>reject(new Error('A helyi mentés sikertelen (tárhely vagy böngészőhiba). A mezők megmaradtak.'));tx.onerror=()=>{};});}
  put(key,value){return this.write([{key,value}]);}
  remove(key){return this.write([{key,remove:true}]);}
  async enqueue(accountId,operation){const db=await this.db;return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),table=tx.objectStore('records'),counter='sequence:'+accountId,request=table.get(counter);request.onsuccess=()=>{operation.sequence=(request.result?.value||0)+1;table.put({key:counter,value:operation.sequence});table.put({key:'outbox:'+accountId+':'+operation.key,value:operation});};tx.oncomplete=()=>resolve(operation);tx.onabort=()=>reject(new Error('A helyi mentés sikertelen (tárhely vagy böngészőhiba). A mezők megmaradtak.'));tx.onerror=()=>{};});}
}
const clone=v=>structuredClone(v),version=(old,data)=>({...old,...data,version:data.version==null?(old.version||0)+1:data.version+1,_pending:true});
const nutrientKeys=['calories','protein','carbs','fat'];
export function calculate(reference,grams){return Object.fromEntries(nutrientKeys.map(k=>[k,reference?.[k]==null?null:Math.round(reference[k]*grams/100*1e6)/1e6]));}
// Optimistic projection is visibly pending; server statistics remain authoritative.
export function project(value,url,operation,cache){
  if(value==null)return value;const result=clone(value),p=operation.path.split('?')[0].split('/').filter(Boolean),view=url.split('?')[0],body=operation.data,id=body._local_id,resource=p[2],list='/'+p.slice(0,3).join('/'),itemId=p[0]==='foods'?p[1]:p[3];
  const updateRows=(rows)=>{
    if(operation.method==='DELETE')return rows.filter(r=>r.id!==itemId);
    if(operation.method==='PATCH')return rows.map(r=>r.id===itemId?version(r,body):r);
    if(operation.method==='POST'&&!itemId)return [...rows.filter(r=>r.id!==id),{id,client_id:p[1],...body,...(resource==='plans'?{active:1}:{}),version:1,created_at:operation.created_at,_pending:true}];return rows;
  };
  if(p[0]==='foods'&&view==='/foods'){const rows=updateRows(result);return rows.map(f=>f.id===id?{...f,active:body.active===false?0:1,scope:operation.actorRole==='client'||body.scope==='private'?'private':'central',owner_id:operation.actorRole==='client'||body.scope==='private'?operation.actorId:null,created_by:operation.actorId,reference_grams:100,unit:'g'}:f);}
  if(['plans','diets'].includes(resource)&&p[4]==='copy'&&view==='/clients/'+body.client_id+'/'+resource){const source=(cache('/clients/'+p[1]+'/'+resource)||[]).find(r=>r.id===itemId);return source?[...result,{...source,id,client_id:body.client_id,name:body.name,start_date:body.start_date||source.start_date,version:1,active:1,_pending:true}]:result;}
  if(view===list&&Array.isArray(result)){
    if(resource==='diets'){
      if(operation.method==='DELETE')return result.map(r=>r.id===itemId?{...r,active:0,version:r.version+1,_pending:true}:r);
      const enriched={...body,items:(body.items||[]).map(i=>{const f=(cache('/foods')||[]).find(f=>f.id===i.food_id);return {...i,name:f?.name||i.name,reference:f||i.reference,...calculate(f||i.reference,i.grams)};})};
      if(operation.method==='PATCH')return result.map(r=>r.id===itemId?version(r,enriched):r);
      return [...result,{...enriched,id,client_id:p[1],active:1,version:1,created_at:operation.created_at,updated_at:operation.created_at,_pending:true}];
    }

    if(resource==='daily-logs'){
      const old=result.find(r=>r.date===body.date),row={id:old?.id||id,client_id:p[1],date:body.date,data:{...old?.data,...body},closed_at:body.closed?operation.created_at:null,version:(body.version||0)+1,_pending:true};return [...result.filter(r=>r.date!==body.date),row];
    }
    if(resource==='food-logs'){
      if(operation.method==='DELETE')return result.filter(r=>r.id!==itemId);let n={...body};const old=result.find(r=>r.id===itemId),foods=cache('/foods')||[],ref=body.food_id===''?null:body.food_id&&body.food_id!==old?.food_id?foods.find(f=>f.id===body.food_id):old?.reference;
      if(body.food_id==='')n={...n,food_id:null,reference:null};if(!ref&&old&&body.grams!=null)for(const k of nutrientKeys)if(body[k]===undefined)n[k]=old[k]==null?null:Math.round(old[k]*body.grams/old.grams*1e6)/1e6;
      if(ref){n={...n,...calculate(ref,body.grams??old?.grams),name:ref.name,reference:ref};}
      if(body.food_id&&!ref)n={...n,...calculate(foods.find(f=>f.id===body.food_id),body.grams)};
      if(itemId==='copy'){const diets=cache('/clients/'+p[1]+'/diets')||[],diet=diets.filter(d=>d.active&&d.start_date<=body.date&&(!d.end_date||d.end_date>=body.date)).sort((a,b)=>b.start_date.localeCompare(a.start_date)||(b.updated_at||'').localeCompare(a.updated_at||''))[0];const source=body.source==='diet'?diet?.items||[]:result.filter(r=>r.date===body.from_date&&r.consumed);return [...result,...source.filter(s=>!result.some(r=>r.date===body.date&&r.meal===s.meal&&r.name===s.name&&r.grams===s.grams)).map((s,i)=>({...s,id:body._copy_ids?.[i]||id+'-'+i,date:body.date,consumed:0,version:1,_pending:true}))];}
      if(itemId)return result.map(r=>r.id===itemId?version(r,n):r);
      return [...result.filter(r=>r.id!==id),{id,client_id:p[1],...n,consumed:n.consumed?1:0,version:1,created_at:operation.created_at,_pending:true}];
    }
    if(resource==='records'){if(url.includes('kind=')&&!url.endsWith('kind='+body.kind))return result;return updateRows(result);}
    if(resource==='measurements')return updateRows(result).map(r=>r.id===id?{...r,data:{...body}}:r).sort((a,b)=>b.date.localeCompare(a.date)||(b.created_at||'').localeCompare(a.created_at||''));
    if(resource==='workouts'&&p[4]==='sets')return result.map(w=>w.id===itemId?{...w,_pending:true}:w);
    if(resource==='workouts'&&operation.method==='POST'&&!itemId){const plan=(cache('/clients/'+p[1]+'/plans')||[]).find(r=>r.id===body.plan_id);return [...result,{id,date:body.date,name:plan?.name||'Edzés',status:'in_progress',version:1,completed_sets:0,_pending:true}];}
    return updateRows(result);
  }
  if(view===operation.path.split('?')[0]&&!Array.isArray(result)&&operation.method==='PATCH')return version(result,body);
  if(resource==='preferences'&&view==='/clients/'+p[1])return {...result,preferences:{...result.preferences,...body},version:body.version+1,_pending:true};
  if(resource==='workouts'&&p[4]==='sets'&&view==='/clients/'+p[1]+'/workouts/'+itemId){
    if(operation.method==='PATCH')result.sets=result.sets.map(s=>s.id===p[5]?version(s,body):s);
    else {const ex=(cache('/exercises')||[]).find(e=>e.id===body.exercise_id),old=result.sets.filter(s=>s.exercise_id===body.exercise_id).at(-1);if(ex)result.sets.push({id,workout_id:itemId,exercise_id:ex.id,exercise_name:old?.exercise_name||ex.name,muscle:ex.muscle,equipment:ex.equipment,category:ex.category,position:old?.position??result.sets.length,number:(old?.number||0)+1,actual_weight:null,actual_reps:null,rpe:null,completed:0,version:1,warmup:!!body.warmup});}
    result.version=(result.version||0)+1;result._pending=true;return result;
  }
  return result;
}
export function nutritionFromCache(logs,diets,from,to){const days=[];for(let d=from;d<=to;){const diet=diets.filter(p=>p.active&&p.start_date<=d&&(!p.end_date||p.end_date>=d)).sort((a,b)=>b.start_date.localeCompare(a.start_date)||(b.updated_at||'').localeCompare(a.updated_at||''))[0]||null,actualRows=logs.filter(f=>f.date===d&&f.consumed),actual=Object.fromEntries(nutrientKeys.map(k=>[k,actualRows.length&&actualRows.every(f=>f[k]!=null)?actualRows.reduce((n,f)=>n+f[k],0):null])),targets=Object.fromEntries(nutrientKeys.map(k=>[k,diet?.[k]??null])),delta=Object.fromEntries(nutrientKeys.map(k=>[k,actual[k]!=null&&targets[k]!=null?actual[k]-targets[k]:null]));days.push({date:d,actual,targets,delta,entries:actualRows.length,pending:logs.filter(f=>f.date===d&&!f.consumed).length,diet});const next=new Date(d+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);d=next.toISOString().slice(0,10);}const recorded=days.filter(d=>d.entries);return {days,recordedDays:recorded.length,averages:Object.fromEntries(nutrientKeys.map(k=>[k,recorded.length&&recorded.every(d=>d.actual[k]!=null)?recorded.reduce((n,d)=>n+d.actual[k],0)/recorded.length:null]))};}
