import {getVotesDb} from '@/db/votes';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {lists} from '@/app/lists';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200,headers:HeadersInit={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
async function voterKey(id:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('mtso2026:'+id));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
function readCookie(request:Request,name:string){return request.headers.get('cookie')?.split(';').map(p=>p.trim()).find(p=>p.startsWith(name+'='))?.slice(name.length+1)??null}
async function getVoter(request:Request){const user=await getChatGPTUser();if(user)return {id:'account:'+user.userId,cookie:null};const existing=readCookie(request,'mtso_voter');if(existing&&/^[a-zA-Z0-9_-]{20,80}$/.test(existing))return {id:'browser:'+existing,cookie:null};const id=crypto.randomUUID().replaceAll('-','');return {id:'browser:'+id,cookie:`mtso_voter=${id}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`}}
export async function GET(request:Request){try{const db=getVotesDb(),voter=await getVoter(request);const all=await db.prepare('SELECT list_id,COUNT(*) AS total FROM votes GROUP BY list_id').all<{list_id:string;total:number}>();const mine=await db.prepare('SELECT group_id,list_id FROM votes WHERE voter=?').bind(await voterKey(voter.id)).all<{group_id:number;list_id:string}>();return json({counts:Object.fromEntries(all.results.map(r=>[r.list_id,r.total])),mine:Object.fromEntries(mine.results.map(r=>[r.group_id,r.list_id])),authenticated:true},200,voter.cookie?{'Set-Cookie':voter.cookie}:{})}catch(e){console.error('Votes read failed',e);return json({error:'Sonuçlar şu anda yüklenemiyor.'},503)}}
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'İstek doğrulanamadı.'},403);
 const voter=await getVoter(request);
 let body:unknown;try{body=await request.json()}catch{return json({error:'Geçersiz oy.'},400)}
 const b=body as {group?:number;list?:string}|null;if(!b||!Number.isInteger(b.group))return json({error:'Bu grupta geçerli bir liste seçin.'},400);const staticList=lists.some(l=>l.group===b.group&&l.id===b.list),approved=await getVotesDb().prepare("SELECT id FROM submissions WHERE id=? AND group_id=? AND status='approved'").bind(b.list,b.group).first();if(!staticList&&!approved)return json({error:'Bu grupta geçerli bir liste seçin.'},400);
 try{const result=await getVotesDb().prepare('INSERT INTO votes(voter,group_id,list_id,created_at) VALUES(?,?,?,?) ON CONFLICT(voter,group_id) DO NOTHING').bind(await voterKey(voter.id),b.group,b.list,new Date().toISOString()).run();if(!result.meta.changes)return json({error:'Bu grupta zaten oy kullandınız.'},409);return json({saved:true},201,voter.cookie?{'Set-Cookie':voter.cookie}:{})}catch(e){console.error('Vote save failed',e);return json({error:'Oy kaydedilemedi. Lütfen tekrar deneyin.'},503)}
}
