import {env} from 'cloudflare:workers';

export async function POST(r:Request){
  const ip=r.headers.get('CF-Connecting-IP');
  const fallback=r.headers.get('x-visitor')||crypto.randomUUID();
  const id=ip?`ip:${ip}`:`session:${fallback}`;
  const now=new Date().toISOString();
  await env.DB.prepare('INSERT INTO visitor_presence(id,last_seen) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen').bind(id,now).run();
  const total=await env.DB.prepare('SELECT COUNT(*) n FROM visitor_presence').first<{n:number}>();
  const online=await env.DB.prepare("SELECT COUNT(*) n FROM visitor_presence WHERE julianday(last_seen) > julianday('now','-5 minutes')").first<{n:number}>();
  return Response.json({total:total?.n||0,online:online?.n||0});
}
