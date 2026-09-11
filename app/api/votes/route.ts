import {getVotesDb} from '@/db/votes';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {lists} from '@/app/lists';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function voterKey(id:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('mtso2026:'+id));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
export async function GET(){try{const db=getVotesDb(),user=await getChatGPTUser();const all=await db.prepare('SELECT list_id,COUNT(*) AS total FROM votes GROUP BY list_id').all<{list_id:string;total:number}>();const mine=user?await db.prepare('SELECT group_id,list_id FROM votes WHERE voter=?').bind(await voterKey(user.userId)).all<{group_id:number;list_id:string}>():{results:[]};return json({counts:Object.fromEntries(all.results.map(r=>[r.list_id,r.total])),mine:Object.fromEntries(mine.results.map(r=>[r.group_id,r.list_id])),authenticated:!!user})}catch(e){console.error('Votes read failed',e);return json({error:'Sonuçlar şu anda yüklenemiyor.'},503)}}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'İstek doğrulanamadı.'},403);
 const user=await getChatGPTUser();if(!user)return json({error:'Oy kullanmak için giriş yapın.'},401);
 let body:unknown;try{body=await request.json()}catch{return json({error:'Geçersiz oy.'},400)}
 const b=body as {group?:number;list?:string}|null;if(!b||!Number.isInteger(b.group)||!lists.some(l=>l.group===b.group&&l.id===b.list))return json({error:'Bu grupta geçerli bir liste seçin.'},400);
 try{const result=await getVotesDb().prepare('INSERT INTO votes(voter,group_id,list_id,created_at) VALUES(?,?,?,?) ON CONFLICT(voter,group_id) DO NOTHING').bind(await voterKey(user.userId),b.group,b.list,new Date().toISOString()).run();if(!result.meta.changes)return json({error:'Bu grupta zaten oy kullandınız.'},409);return json({saved:true},201)}catch(e){console.error('Vote save failed',e);return json({error:'Oy kaydedilemedi. Lütfen tekrar deneyin.'},503)}
}
