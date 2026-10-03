import {LocalStore,project,nutritionFromCache,calculate,stats,streak,today} from './offline.js';
export class ApiError extends Error{constructor(status,message,code){super(message);this.status=status;this.code=code;}}
export class Repository{
  constructor(){this.csrf=null;this.user=null;this.local=new LocalStore();this.connected=navigator.onLine;this.lastPending=false;this.timeZone='Europe/Budapest';this.databaseEpoch=null;this.warmed=new Set();this.syncing=null;window.addEventListener('online',()=>{this.connected=true;this.sync().catch(()=>{});});setInterval(()=>{if(navigator.onLine&&this.user)this.sync().catch(()=>{});},15000);}
  cacheKey(path){return 'cache:'+this.user.id+':'+path;}
  async raw(path,method='GET',data,key){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);let response;
    try{response=await fetch('/api/v1'+path,{method,signal:controller.signal,credentials:'same-origin',cache:'no-store',headers:{...(this.user&&!path.startsWith('/auth/')?{'X-Impavidus-Account':this.user.id}:{}),...(method==='GET'?{}:{'Content-Type':'application/json','X-CSRF-Token':this.csrf||'',...(key?{'Idempotency-Key':key}:{})})},body:method==='GET'?undefined:JSON.stringify(data||{})});this.connected=true;}catch{this.connected=false;throw new ApiError(0,'Nincs kapcsolat a szerverrel.','network');}finally{clearTimeout(timeout);}
    let result;try{result=await response.json();}catch{throw new ApiError(0,'A válasz nem érkezett meg teljesen. A mentés újraküldhető.','network');}if(!response.ok)throw new ApiError(response.status,result.detail||'A kérés nem sikerült.',result.code);return result;
  }
  async request(path,method='GET',data){if(method!=='GET')this.lastPending=false;
    if(path.startsWith('/auth/')){
      if(path==='/auth/logout'&&(await this.pending()).length)throw new ApiError(409,'Kijelentkezés előtt szinkronizáld vagy exportáld és rendezd a helyi mentéseket.','pending-logout');
      try{const result=await this.raw(path,method,data);if(path==='/auth/session'){
        this.timeZone=result.timeZone||this.timeZone;this.databaseEpoch=result.databaseEpoch;this.user=result.user;if(result.user){this.csrf=result.user.csrf;await this.local.put('session',{...result,user:{...result.user,csrf:null},cached_at:Date.now()});}else await this.local.remove('session');
      }else if(path==='/auth/logout'){await this.clearCache();this.user=null;this.csrf=null;await this.local.remove('session');}
      return result;}catch(e){if(e.status!==0||path!=='/auth/session')throw e;const saved=await this.local.get('session');if(saved?.user&&Date.now()-saved.cached_at<12*3600000){this.user=saved.user;this.databaseEpoch=saved.databaseEpoch;this.timeZone=saved.timeZone||this.timeZone;return {...saved,today:new Intl.DateTimeFormat('en-CA',{timeZone:saved.timeZone||'Europe/Budapest',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),offline:true};}throw new ApiError(0,'Offline megnyitáshoz előbb ezen a böngészőn be kell lépned. A helyi munkamenet legfeljebb 12 óráig használható.','offline-session');}
    }
    if(!this.user)throw new ApiError(401,'Belépés szükséges.','authentication-required');
    const accountId=this.user.id;
    if(method==='GET'){
      const pending=await this.pending();if(pending.length&&(path.includes('/nutrition?')||path.includes('/statistics?')))return this.cached(path);let result;
      try{if(!this.connected)throw new ApiError(0,'Offline','network');result=await this.raw(path);}catch(e){if(e.status!==0)throw e;return this.cached(path);}
      if(this.user?.id!==accountId)throw new ApiError(401,'A fiók időközben megváltozott.','authentication-required');
      const rows=await this.local.all(),lookup=p=>rows.find(r=>r.key===this.cacheKey(p))?.value;
      for(const operation of pending)result=project(result,path,operation,lookup);
      if(pending.length){if(path==='/clients')result=await Promise.all(result.map(c=>this.enrich(c)));else if(/^\/clients\/[^/]+$/.test(path))result=await this.enrich(result);}
      await this.local.put(this.cacheKey(path),result);return result;
    }
    const allowed=/^\/(foods|clients\/[^/]+\/(plans|workouts|rest-days|notes|measurements|food-logs|daily-logs|records|diets|preferences))(\/|$)/.test(path);
    if(!allowed)return this.raw(path,method,data);
    // The durable outbox is written BEFORE the request. A dropped response is safe.
    const operation={key:crypto.randomUUID(),path,method,data:structuredClone(data||{}),created_at:new Date().toISOString(),databaseEpoch:this.databaseEpoch,actorId:this.user.id,actorRole:this.user.role,error:null};
    if(method==='POST')operation.data._local_id=crypto.randomUUID();
    if(path.endsWith('/food-logs/copy'))operation.data._copy_ids=Array.from({length:100},()=>crypto.randomUUID());
    if(/\/workouts$/.test(path)&&method==='POST'){
      const plans=await this.local.get(this.cacheKey(path.replace(/workouts$/,'plans')))||[],plan=plans.find(p=>p.id===operation.data.plan_id);
      if(plan){operation.data.plan_version=plan.version;operation.data.set_ids=plan.exercises.flatMap(e=>e.sets.map(()=>crypto.randomUUID()));}
    }
    await this.local.enqueue(this.user.id,operation);
    try{if(!this.connected)throw new ApiError(0,'Offline','network');if((await this.pending()).length>1){this.lastPending=true;return this.optimistic(operation);}
      const result=await this.raw(path,method,operation.data,operation.key);await this.local.remove('outbox:'+this.user.id+':'+operation.key);return result;
    }catch(e){if(e.status===0){this.lastPending=true;return this.optimistic(operation);}await this.local.remove('outbox:'+this.user.id+':'+operation.key);throw e;}
  }
  async optimistic(operation){const rows=await this.local.all(),cache=p=>rows.find(r=>r.key===this.cacheKey(p))?.value,changes=[];
    for(const row of rows.filter(r=>r.key.startsWith('cache:'+this.user.id+':'))){const path=row.key.slice(('cache:'+this.user.id+':').length);changes.push({key:row.key,value:project(row.value,path,operation,cache)});}
    const b=operation.data,parts=operation.path.split('/').filter(Boolean),resource=parts[2];let result={id:b._local_id,...b,version:1,_pending:true};
    if(resource==='workouts'){
      const detail='/clients/'+parts[1]+'/workouts/'+(parts[3]||b._local_id);
      result=changes.find(r=>r.key===this.cacheKey(detail))?.value||cache(detail);
      if(!parts[3]){
        const plan=(cache('/clients/'+parts[1]+'/plans')||[]).find(p=>p.id===b.plan_id);if(!plan||!b.set_ids)throw new ApiError(0,'Az edzéstervet online nyisd meg az offline edzés előtt. A mentés megmaradt a helyi sorban.','offline-plan');let i=0;
        result={id:b._local_id,name:plan.name,date:b.date,status:'in_progress',version:1,note:'',started_at:null,ended_at:null,duration_minutes:null,_pending:true,sets:plan.exercises.flatMap(e=>e.sets.map(s=>({id:b.set_ids[i++],workout_id:b._local_id,exercise_id:e.exercise_id,exercise_name:e.name,muscle:e.muscle,equipment:e.equipment,category:e.category,exercise_note:e.note,position:e.position,...s,warmup:s.warmup?1:0,version:1,actual_weight:null,actual_reps:null,rpe:null,note:'',completed:0,previous:null})))};
      }
      if(result){const completed=result.sets.filter(s=>s.completed),weighted=completed.filter(s=>['free_weight','machine'].includes(s.category)),rpes=completed.filter(s=>s.rpe!=null);result.stats={hardSets:completed.filter(s=>!s.warmup&&s.category!=='cardio').length,volume:weighted.length?weighted.reduce((n,s)=>n+s.actual_weight*s.actual_reps,0):null,averageRpe:rpes.length?rpes.reduce((n,s)=>n+s.rpe,0)/rpes.length:null,bodyweightSets:completed.filter(s=>s.category==='bodyweight'&&!s.warmup).length,cardioMinutes:completed.filter(s=>s.category==='cardio').reduce((n,s)=>n+(s.duration_minutes||0),0)};changes.push({key:this.cacheKey(detail),value:result});const listKey=this.cacheKey('/clients/'+parts[1]+'/workouts'),list=changes.find(r=>r.key===listKey)?.value||cache('/clients/'+parts[1]+'/workouts')||[];changes.push({key:listKey,value:list.map(w=>w.id===result.id?{...w,completed_sets:completed.length,status:result.status,_pending:true}:w)});}
    }
    if(resource==='food-logs')result=changes.find(r=>r.key===this.cacheKey('/clients/'+parts[1]+'/food-logs'))?.value.find(r=>r.id===(parts[3]||b._local_id))||result;
    if(resource==='records')result={...result,kind:b.kind,data:b.data};
    await this.local.write(changes);window.dispatchEvent(new CustomEvent('impavidus-pending'));return result;
  }
  async cached(path){
    const prefix=path.split('?')[0],p=prefix.split('/').filter(Boolean);
    if(p[2]==='nutrition'){const params=new URLSearchParams(path.split('?')[1]),logs=await this.local.get(this.cacheKey('/clients/'+p[1]+'/food-logs'))||[],diets=await this.local.get(this.cacheKey('/clients/'+p[1]+'/diets'))||[];return nutritionFromCache(logs,diets,params.get('from'),params.get('to'));}
    const saved=await this.local.get(this.cacheKey(path));
    if(p[2]==='statistics'){
      const workouts=await this.local.get(this.cacheKey('/clients/'+p[1]+'/workouts'));if(!workouts)throw new ApiError(0,'Az edzésnaplót előbb online nyisd meg.','offline-cache-missing');
      const sets=[];for(const w of workouts)sets.push(...((await this.local.get(this.cacheKey('/clients/'+p[1]+'/workouts/'+w.id)))?.sets||[]));const params=new URLSearchParams(path.split('?')[1]);return stats(workouts,sets,params.get('from'),params.get('to'));
    }
    if(saved!==undefined){if(path==='/clients')return Promise.all(saved.map(c=>this.enrich(c)));if(p.length===2&&p[0]==='clients')return this.enrich(saved);return saved;}

    throw new ApiError(0,'Ezt az oldalt még nem nyitottad meg online. A már mentett helyi adatok megmaradtak.','offline-cache-missing');
  }
  async enrich(c){
    const p='/clients/'+c.id+'/',logs=await this.local.get(this.cacheKey(p+'food-logs')),workouts=await this.local.get(this.cacheKey(p+'workouts')),rests=await this.local.get(this.cacheKey(p+'rest-days')),measurements=await this.local.get(this.cacheKey(p+'measurements')),daily=await this.local.get(this.cacheKey(p+'daily-logs'));
    if(!logs||!workouts||!rests||!measurements||!daily)return c;const work=[];for(const w of workouts){const detail=await this.local.get(this.cacheKey(p+'workouts/'+w.id));if(w.status!=='archived'&&detail?.sets.some(s=>s.completed))work.push(w.date);}
    const food=logs.filter(f=>f.consumed).map(f=>f.date),rest=rests.map(r=>r.date),activity=streak({startDate:c.start_date,today:today(this.timeZone),foodDates:food,workoutDates:work,restDates:rest,closedDates:daily.filter(d=>d.closed_at).map(d=>d.date),previousLongest:c.metrics.activity.longest}),latest=measurements[0],delta=latest&&c.starting_weight!=null?latest.weight-c.starting_weight:null;
    return {...c,metrics:{...c.metrics,activity:{...activity,completed_dates:[...new Set(food.filter(d=>work.includes(d)||rest.includes(d)))]},current_weight:latest?.weight??null,weight_date:latest?.date||null,weight_delta:delta,weight_percent:delta!=null?delta/c.starting_weight*100:null}};
  }
  async pending(){if(!this.user)return [];return (await this.local.all()).filter(r=>r.key.startsWith('outbox:'+this.user.id+':')).map(r=>r.value).sort((a,b)=>a.sequence!=null&&b.sequence!=null?a.sequence-b.sequence:a.created_at.localeCompare(b.created_at));}
  async syncStatus(){const rows=await this.pending();return {online:this.connected&&navigator.onLine,pending:rows.length,conflicts:rows.filter(r=>r.error).length};}
  async sync(){if(this.syncing)return this.syncing;if(!this.user)return;this.syncing=this.flush();try{return await this.syncing;}finally{this.syncing=null;}}
  async flush(){const actor=this.user?.id;if(!actor)return;let rows=await this.pending();if(!rows.length&&this.connected)return;const current=await this.raw('/auth/session');if(current.user?.id!==actor||this.user?.id!==actor)throw new ApiError(401,'A helyi mentések küldéséhez ugyanazzal a fiókkal lépj be.','sync-login');this.csrf=current.user.csrf;
    this.databaseEpoch=current.databaseEpoch;let sent=0;for(const row of rows){if(row.databaseEpoch&&current.databaseEpoch&&row.databaseEpoch!==current.databaseEpoch){row.error='Az adatbázis mentésből visszaállt vagy lecserélődött. A helyi adatot exportáld és vesd össze a szerverrel.';row.status=409;await this.local.put('outbox:'+actor+':'+row.key,row);break;}if(this.user?.id!==actor)throw new ApiError(401,'A fiók időközben megváltozott.','sync-login');if(row.error)break;try{await this.raw(row.path,row.method,row.data,row.key);await this.local.remove('outbox:'+actor+':'+row.key);sent++;}catch(e){if(e.status===0)throw e;row.error=e.message;row.status=e.status;await this.local.put('outbox:'+actor+':'+row.key,row);break;}}
    if(sent){this.warmed.clear();window.dispatchEvent(new CustomEvent('impavidus-sync'));}else window.dispatchEvent(new CustomEvent('impavidus-pending'));
  }
  async serverState(row){const base=row.path.split('?')[0],p=base.split('/').filter(Boolean);if(p[0]==='foods')return (await this.raw('/foods')).find(f=>f.id===p[1]);if(p[2]==='preferences')return this.raw('/clients/'+p[1]);if(p[2]==='daily-logs')return (await this.raw(base)).find(d=>d.date===row.data.date)||null;if(p[4]==='sets'){const workout=await this.raw('/clients/'+p[1]+'/workouts/'+p[3]);return workout.sets.find(s=>s.id===p[5]);}if(row.method==='POST')return this.raw('/'+p.slice(0,3).join('/'));const list=await this.raw('/'+p.slice(0,3).join('/')+(p[2]==='records'?'?kind='+row.data.kind:''));return Array.isArray(list)?list.find(r=>r.id===p[3]):list;}
  async resolve(key,choice){const row=(await this.pending()).find(r=>r.key===key);if(!row)throw new Error('A helyi mentés már nem található.');if(choice==='server'){await this.local.put('resolved:'+this.user.id+':'+key,{...row,resolution:'server',resolved_at:new Date().toISOString()});await this.local.remove('outbox:'+this.user.id+':'+key);await this.clearCache();await this.sync();return;}
    if(row.method==='POST'&&!row.path.endsWith('/daily-logs')&&row.path.split('/').length<5)throw new Error('Az ütköző új rekordot exportáld; a meglévő rekordot a felületen szerkeszd.');const current=await this.serverState(row);if(!current||!Number.isInteger(current.version))throw new Error('Nincs módosítható szerververzió. Exportáld és ellenőrizd a bejegyzést.');const difference=current.version-row.data.version;row.data.version=current.version;row.databaseEpoch=this.databaseEpoch;row.error=null;row.key=crypto.randomUUID();await this.local.remove('outbox:'+this.user.id+':'+key);await this.local.put('outbox:'+this.user.id+':'+row.key,row);for(const next of await this.pending())if(next.key!==row.key&&next.created_at>=row.created_at&&next.path===row.path&&Number.isInteger(next.data.version)){next.data.version+=difference;await this.local.put('outbox:'+this.user.id+':'+next.key,next);}await this.sync();}
  async clearCache(){if(!this.user)return;await this.local.write((await this.local.all()).filter(r=>r.key.startsWith('cache:'+this.user.id+':')).map(r=>({key:r.key,remove:true})));this.warmed.clear();}
  async prime(client){if(!this.connected||this.warmed.has(client.id))return;this.warmed.add(client.id);const cid=client.id,p='/clients/'+cid+'/';try{const base=['plans','workouts','rest-days','diets','food-logs','daily-logs','measurements','notes','records?kind=medication','records?kind=photo'];for(const resource of base)await this.request(p+resource);for(const w of await this.request(p+'workouts'))await this.request(p+'workouts/'+w.id);await this.request('/foods');await this.request('/exercises');}catch{this.warmed.delete(client.id);}}
  saveSet(clientId,workoutId,setId,data){return this.request(`/clients/${clientId}/workouts/${workoutId}/sets/${setId}`,'PATCH',data);}
}
