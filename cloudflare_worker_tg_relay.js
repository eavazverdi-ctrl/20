// Cloudflare Worker: Telegram relay
const ALLOW_ORIGIN = "*";
export default { async fetch(request, env) {
  if (request.method==="OPTIONS") return new Response(null,{headers:{ "access-control-allow-origin": ALLOW_ORIGIN, "access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"content-type" }});
  if (request.method!=="POST") return new Response("Only POST",{status:405});
  try{
    const {chat_id,text,parse_mode,disable_web_page_preview}=await request.json();
    if(!chat_id||!text) return new Response(JSON.stringify({ok:false,error:"chat_id and text required"}),{status:400,headers:{ "content-type":"application/json","access-control-allow-origin": ALLOW_ORIGIN }});
    const url='https://api.telegram.org/bot'+env.TG_BOT_TOKEN+'/sendMessage';
    const body=new URLSearchParams({ chat_id:String(chat_id), text, parse_mode:parse_mode||'HTML', disable_web_page_preview:String(disable_web_page_preview??true) });
    const r=await fetch(url,{method:'POST',body}); const data=await r.json();
    return new Response(JSON.stringify(data),{headers:{ "content-type":"application/json","access-control-allow-origin": ALLOW_ORIGIN }});
  }catch(e){ return new Response(JSON.stringify({ok:false,error:String(e)}),{status:500,headers:{ "content-type":"application/json","access-control-allow-origin": ALLOW_ORIGIN }}); }
}};