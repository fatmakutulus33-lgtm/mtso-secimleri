import {env} from 'cloudflare:workers';
const out=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
function ok(r:Request){return r.headers.get('x-admin-code')===env.ADMIN_TOKEN}
export async function GET(r:Request){if(!ok(r))return out({error:'Yetkisiz erişim.'},401);const q=await env.DB.prepare('SELECT * FROM submissions ORDER BY created_at DESC').all();return out(q.results)}
export async function POST(r:Request){
  if(!ok(r))return out({error:'Yetkisiz erişim.'},401);
  const b=await r.json() as {id?:string;status?:string;group_id?:number;list_name?:string;candidates?:string;color?:string};
  if(!b.id)return out({error:'Başvuru seçilmedi.'},400);
  if(b.status){if(!['pending','approved','rejected'].includes(b.status))return out({error:'Geçersiz durum.'},400);await env.DB.prepare('UPDATE submissions SET status=? WHERE id=?').bind(b.status,b.id).run();return out({saved:true})}
  if(!Number.isInteger(b.group_id)||!b.group_id||b.group_id<1||b.group_id>41)return out({error:'Geçerli bir meslek grubu seçin.'},400);
  const colors=['#ffffff','#1464cd','#f58220','#dfb200','#bd3643'];
  if(!b.color||!colors.includes(b.color))return out({error:'Geçerli bir liste rengi seçin.'},400);
  await env.DB.prepare('UPDATE submissions SET group_id=?,list_name=?,candidates=?,color=? WHERE id=?').bind(b.group_id,'',(b.candidates||'').trim().slice(0,4000),b.color,b.id).run();
  return out({saved:true});
}
