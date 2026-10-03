'use strict';
// A tunnel URL is a candidate until an external request reaches our own backend.
// The public probe is unauthenticated and never reads client records.
class MobileHealth {
  constructor({instance,probe,onChange=()=>{},now=()=>new Date().toISOString()}){
    this.instance=instance;this.probe=probe;this.onChange=onChange;this.now=now;
    this.state={origin:null,ready:false,status:'starting',reason:null,checkedAt:null};
    this.pending=null;this.lineBuffer='';
  }
  update(values){Object.assign(this.state,values);this.onChange({...this.state});}
  receive(chunk){
    this.lineBuffer+=String(chunk);
    const lines=this.lineBuffer.split(/\r?\n/);this.lineBuffer=lines.pop();
    // Retain partial lines so URLs and errors split between chunks are recognized.
    if(this.lineBuffer.length>65536)this.lineBuffer=this.lineBuffer.slice(-8192);
    for(const line of lines){
      const match=line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if(match&&!this.state.origin)this.update({origin:match[0],status:'checking'});
      if(/Unauthorized: Tunnel not found/.test(line))this.update({ready:false,status:'expired',reason:'tunnel-not-found'});
    }
  }
  async check(){
    if(this.pending)return this.pending;
    if(!this.state.origin||this.state.status==='expired')return {...this.state};
    const origin=this.state.origin;
    this.pending=(async()=>{
      try{
        const response=await this.probe(origin);
        if(this.state.origin!==origin||this.state.status==='expired')return {...this.state};
        if(response?.status!=='ok'||response?.app!=='IMPAVIDUS LAB'||response?.instance!==this.instance)throw Error('wrong-backend');
        this.update({ready:true,status:'ready',reason:null,checkedAt:this.now()});
      }catch(error){
        if(this.state.origin===origin&&this.state.status!=='expired')this.update({ready:false,status:'unreachable',reason:error.message==='wrong-backend'?'wrong-backend':'external-probe-failed',checkedAt:this.now()});
      }finally{this.pending=null;}
      return {...this.state};
    })();
    return this.pending;
  }
}
module.exports={MobileHealth};
