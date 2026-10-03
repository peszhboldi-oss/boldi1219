/* Online saving boundary. Future outbox/sync adapters must preserve versions.
   A failed request does not mean a saved or synced set. No personal data is cached. */
export class ApiError extends Error { constructor(status,message,code){super(message);this.status=status;this.code=code;} }
export class Repository {
  constructor(){this.csrf=null;}
  async request(path,method='GET',data){
    let response;
    try{response=await fetch('/api/v1'+path,{method,credentials:'same-origin',cache:'no-store',headers:method==='GET'?{}:{'Content-Type':'application/json','X-CSRF-Token':this.csrf||''},body:method==='GET'?undefined:JSON.stringify(data||{})});}
    catch{throw new ApiError(0,'Nincs kapcsolat. A módosítás nem került a szerverre. A mezők a képernyőn maradnak.','network');}
    const result=await response.json();if(!response.ok)throw new ApiError(response.status,result.detail||'A kérés nem sikerült.',result.code);return result;
  }
  // Versioned, explicit save interface; replace with an outbox adapter in step 4.
  saveSet(clientId,workoutId,setId,data){return this.request(`/clients/${clientId}/workouts/${workoutId}/sets/${setId}`,'PATCH',data);}
}
