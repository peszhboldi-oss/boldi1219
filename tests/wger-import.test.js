'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{convertWger}=require('../backend/wger-import');
// Synthetic schema fixture only; no copyrighted exercise text or live client data.
const row={id:1,uuid:'synthetic-uuid',license:{url:'https://creativecommons.org/licenses/by/4.0/'},license_author:'Base Test Author',muscles:[{name_en:'Test Muscle'}],equipment:[{name:'Test Equipment'}],translations:[{language:2,name:'Synthetic Exercise',license:1,license_author:'Translation Test Author'}]};
const config={languageId:2,categoryByUuid:{'synthetic-uuid':'machine'},licenses:[{id:1,url:'https://creativecommons.org/licenses/by/4.0/'}]};
test('wger JSON-adapter megőrzi UUID-t, forrást, licencet és szerzőt',()=>{const r=convertWger({results:[row]},config);assert.equal(r.items.length,1);assert.equal(r.items[0].source_id,row.uuid);assert.equal(r.items[0].license,'CC-BY-4.0');assert.match(r.items[0].author,/Translation Test Author/);assert.equal(r.items[0].category,'machine');});
test('ismeretlen / ShareAlike licenc nem importálódik automatikusan',()=>{const r=convertWger([{...row,license:{url:'https://creativecommons.org/licenses/by-sa/4.0/'}}],config);assert.equal(r.items.length,0);assert.equal(r.skipped[0].reason,'unsupported-or-unverified-license');});
test('kézi kategóriabesorolás szükséges, izomcsoport nem eszközkategória',()=>{assert.equal(convertWger([row],{...config,categoryByUuid:{}}).skipped[0].reason,'manual-category-required');});
test('import adapter duplikációt és hiányzó fordítást kihagy',()=>{const r=convertWger([row,row,{...row,id:2,uuid:'other',translations:[]}],config);assert.equal(r.items.length,1);assert.deepEqual(r.skipped.map(s=>s.reason),['duplicate','missing-translation']);});
