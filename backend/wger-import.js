'use strict';
// Independent adapter for the public exerciseinfo JSON shape. No wger code is copied.
// Schema reference: wger/exercises/api/serializers.py, ExerciseInfoSerializer.
const V=require('./validation');
function licenseCode(license,catalog) {
  const record=typeof license==='object'?license:catalog.find(x=>x.id===license);
  if(!record?.url)return null;
  let url;try{url=new URL(record.url);}catch{return null;}
  if(url.hostname!=='creativecommons.org')return null;
  const route=url.pathname.replace(/\/$/,'');
  if(route==='/publicdomain/zero/1.0')return 'CC0-1.0';
  if(route==='/licenses/by/4.0')return 'CC-BY-4.0';
  return null;
}
function convertWger(payload,{languageId,categoryByUuid={},licenses=[]}={}) {
  const rows=Array.isArray(payload)?payload:payload?.results;
  if(!Array.isArray(rows)||!Number.isInteger(languageId))V.fail('wger exerciseinfo JSON és konkrét languageId szükséges.');
  const items=[],skipped=[],seen=new Set();
  for(const row of rows){
    const translation=row.translations?.find(t=>t.language===languageId),category=categoryByUuid[row.uuid];
    const baseLicense=licenseCode(row.license,licenses),nameLicense=licenseCode(translation?.license,licenses);
    const reason=!row.uuid?'missing-uuid':!translation?'missing-translation':!baseLicense||!nameLicense?'unsupported-or-unverified-license':!['free_weight','machine','bodyweight','cardio'].includes(category)?'manual-category-required':seen.has(row.uuid)?'duplicate':null;
    if(reason){skipped.push({id:row.id,uuid:row.uuid,reason});continue;}
    const muscles=(row.muscles||[]).map(m=>m.name_en||m.name).filter(Boolean).join(', '),equipment=(row.equipment||[]).map(e=>e.name).filter(Boolean).join(', ');
    const author=[...new Set([row.license_author,translation.license_author,...(row.author_history||[]),...(translation.author_history||[])].filter(Boolean))].join('; ');
    if(!muscles||!equipment||!author){skipped.push({id:row.id,uuid:row.uuid,reason:'missing-attribution-or-classification'});continue;}
    seen.add(row.uuid);
    items.push({name:V.text(translation.name,'Gyakorlat neve',160,true),muscle:V.text(muscles,'Izomcsoport',80,true),equipment:V.text(equipment,'Eszköz',100,true),category,active:true,source:'wger',source_id:row.uuid,license:[baseLicense,nameLicense].includes('CC-BY-4.0')?'CC-BY-4.0':'CC0-1.0',author:V.text(author,'Szerzők',300,true),source_url:`https://wger.de/en/exercise/${encodeURIComponent(row.id)}/view/`});
  }
  return {items,skipped};
}
module.exports={convertWger,licenseCode};
