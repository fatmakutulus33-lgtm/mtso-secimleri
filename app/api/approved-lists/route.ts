import {env} from 'cloudflare:workers';
export async function GET(){const r=await env.DB.prepare("SELECT id,group_id,list_name,candidates,image_data,color FROM submissions WHERE status='approved' ORDER BY created_at DESC").all();return Response.json(r.results,{headers:{'Cache-Control':'no-store'}})}
