'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
async function updateScenario(safe){
 const handlers={},blocked=[],ids=['first','second'];let activated=0,completed;
 const tabs=ids.map((id,i)=>({id,postMessage(data){if(data.type==='CHECK_UPDATE')handlers.message({data:{type:'UPDATE_STATUS',nonce:data.nonce,safe:safe[i]},source:{id}});}}));
 const self={addEventListener(type,fn){handlers[type]=fn;},clients:{matchAll:async()=>tabs},skipWaiting:async()=>{activated++;}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),{self,crypto,setTimeout,clearTimeout,URL});
 handlers.message({data:{type:'APPLY_UPDATE'},source:{postMessage:message=>blocked.push(message)},waitUntil:p=>{completed=p;}});await completed;return {activated,blocked};
}
test('PWA frissítés: bármelyik nyitott lap mentetlen állapota blokkol',async()=>{const result=await updateScenario([true,false]);assert.equal(result.activated,0);assert.equal(result.blocked[0].type,'UPDATE_BLOCKED');});
test('PWA frissítés: minden nyitott lap jóváhagyása után alkalmazható',async()=>{const result=await updateScenario([true,true]);assert.equal(result.activated,1);assert.equal(result.blocked.length,0);});
