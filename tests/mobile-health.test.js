'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {MobileHealth}=require('../scripts/mobile-health');
const expected={status:'ok',app:'IMPAVIDUS LAB',instance:'synthetic-instance'};
function setup(probe=async()=>expected){const changes=[];const health=new MobileHealth({instance:expected.instance,probe,onChange:s=>changes.push(s),now:()=> '2026-10-03T12:00:00.000Z'});return {health,changes};}
test('mobile status requires verified external API, not merely an announced URL',async()=>{
 const {health,changes}=setup();assert.equal((await health.check()).ready,false);
 health.receive('INF https://sample-mobile.trycloud');assert.equal(health.state.origin,null);
 health.receive('flare.com\r\n');assert.equal(health.state.ready,false);assert.equal(health.state.status,'checking');
 assert.equal((await health.check()).ready,true);assert.equal(changes.at(-1).checkedAt,'2026-10-03T12:00:00.000Z');
});
test('mobile DNS failure and wrong backend never report successful readiness',async()=>{
 for(const probe of [async()=>{throw Error('ENOTFOUND');},async()=>({}),async()=>({...expected,instance:'another-app'})]){
  const {health}=setup(probe);health.receive('https://sample-mobile.trycloudflare.com\n');
  assert.equal((await health.check()).ready,false);assert.equal(health.state.status,'unreachable');
 }
});
test('tunnel-not-found invalidates a previously working URL, including split log chunks',async()=>{
 const {health}=setup();health.receive('https://sample-mobile.trycloudflare.com\n');await health.check();
 health.receive('ERR Unauthorized: Tunnel ');assert.equal(health.state.ready,true);
 health.receive('not found\n');assert.equal(health.state.ready,false);assert.equal(health.state.status,'expired');
 assert.equal((await health.check()).ready,false);
});
test('mobile health detects a later outage and a transient connection recovery',async()=>{
 let fail=false,calls=0;const {health}=setup(async()=>{calls++;if(fail)throw Error('timeout');return expected;});
 health.receive('https://sample-mobile.trycloudflare.com\n');await health.check();fail=true;
 assert.equal((await health.check()).ready,false);fail=false;assert.equal((await health.check()).ready,true);assert.equal(calls,3);
});
test('terminal tunnel failure during a pending probe cannot revive an expired URL',async()=>{
 let finish;const {health}=setup(()=>new Promise(resolve=>finish=resolve));health.receive('https://sample-mobile.trycloudflare.com\n');
 const first=health.check();health.receive('Unauthorized: Tunnel not found\n');finish(expected);await first;
 assert.equal(health.state.ready,false);assert.equal(health.state.status,'expired');
});
