'use strict';
class Problem extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
function fail(message, status=422, code='validation') { throw new Problem(status,code,message); }
function text(value, label, max=500, required=false) { if (value == null && !required) return ''; if (typeof value !== 'string' || value.length>max || (required && !value.trim())) fail(`${label}: érvényes szöveg szükséges (legfeljebb ${max} karakter).`); return value.trim(); }
function number(value, label, min, max, required=false, integer=false) { if (value==null || value==='') { if (required) fail(`${label}: kötelező mező.`); return null; } if (typeof value!=='number' || !Number.isFinite(value) || value<min || value>max || (integer && !Number.isInteger(value))) fail(`${label}: ${min}–${max} közötti ${integer?'egész ':''}szám szükséges.`); return value; }
function date(value) { if (typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value+'T12:00:00Z')) || new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value || value<'2000-01-01' || value>'2100-12-31') fail('Érvényes dátum szükséges (2000–2100).'); return value; }
function bool(value, fallback=false) { if (value==null) return fallback; if (typeof value!=='boolean') fail('Logikai érték szükséges.'); return value; }
function username(value) { const name=text(value,'Felhasználónév',254,true).toLowerCase(); if (name.length<3 || !/^[a-z0-9][a-z0-9._@+-]*$/.test(name)) fail('A felhasználónév legalább 3 karakter: betű, szám, pont, kötőjel vagy aláhúzás.'); return name; }
function password(value) { if (typeof value!=='string' || value.length<12 || value.length>128) fail('A jelszó 12–128 karakter hosszú legyen.'); return value; }
function version(body, current) { if (!Number.isInteger(body.version) || body.version!==current.version) fail('Az adat közben megváltozott. Töltsd újra, és ellenőrizd a módosítást.',409,'version-conflict'); }
function profile(b) { return { name:text(b.name,'Név',120,true),starting_weight:number(b.starting_weight,'Kezdősúly',20,500),height:number(b.height,'Magasság',80,250),target_weight:number(b.target_weight,'Célsúly',20,500),goal:text(b.goal,'Cél',2000),phase:text(b.phase,'Fázis',120),start_date:date(b.start_date) }; }
const CATEGORIES=['free_weight','machine','bodyweight','cardio'];
function exercise(b) { if (!CATEGORIES.includes(b.category)) fail('Érvényes gyakorlatkategória szükséges.'); return { name:text(b.name,'Név',160,true),muscle:text(b.muscle,'Izomcsoport',80,true),equipment:text(b.equipment,'Eszköz',100,true),category:b.category,active:bool(b.active,true)?1:0 }; }
function image(base64) {
  if (typeof base64!=='string' || base64.length>1500000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) fail('A kép legfeljebb 1 MB-os PNG vagy JPEG lehet.');
  const bytes=Buffer.from(base64,'base64'); if (bytes.length>1024*1024) fail('A kép legfeljebb 1 MB lehet.');
  let width,height,type;
  if (bytes.length>33 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16)==='IHDR') { width=bytes.readUInt32BE(16);height=bytes.readUInt32BE(20);type='image/png'; if (!bytes.subarray(-8,-4).equals(Buffer.from('IEND'))) fail('Sérült PNG-kép.'); }
  else if (bytes.length>20 && bytes[0]===255 && bytes[1]===216 && bytes[bytes.length-2]===255 && bytes[bytes.length-1]===217) {
    type='image/jpeg'; let p=2;
    while(p+4<bytes.length) { if(bytes[p]!==255) break; const marker=bytes[p+1]; if(marker===0xda || marker===0xd9) break; const length=bytes.readUInt16BE(p+2); if(length<2 || p+2+length>bytes.length) break; if([0xc0,0xc1,0xc2].includes(marker) && length>=7) {height=bytes.readUInt16BE(p+5);width=bytes.readUInt16BE(p+7);break;} p+=2+length; }
  }
  if (!width || !height || width>4096 || height>4096) fail('A kép nem felismerhető, vagy túl nagy (maximum 4096×4096).');
  return { bytes,type };
}
module.exports={Problem,fail,text,number,date,bool,username,password,version,profile,exercise,image};
