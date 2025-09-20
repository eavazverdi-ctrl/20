
// ===== License gate =====
(function(){
  const GATE = document.getElementById('authGate');
  const PASS = document.getElementById('authPass');
  const BTN  = document.getElementById('authBtn');
  const ERR  = document.getElementById('authErr');
  const KEY  = 'fx_license_until';

  function isValid(){
    try{
      const v = localStorage.getItem(KEY);
      if (!v) return false;
      const until = +v;
      if (until === -1) return true;
      return Date.now() <= until;
    }catch(e){ return false; }
  }
  function save(days){
    try{
      if (days === -1){ localStorage.setItem(KEY, String(-1)); return; }
      const until = Date.now() + days*24*60*60*1000;
      localStorage.setItem(KEY, String(until));
    }catch(e){}
  }
  function unlock(){ GATE?.setAttribute('aria-hidden','true'); }
  if (isValid()) unlock();
  BTN?.addEventListener('click', ()=>{
    const p = PASS.value.trim();
    if (p==='ehsan'){ save(7); alert('لایسنس یک هفته‌ای شما تایید شد.'); unlock(); }
    else if (p==='kireehsan'){ save(-1); alert('لایسنس دائمی شما تایید شد.'); unlock(); }
    else { ERR.hidden=false; }
  });
})();

// ===== Helpers =====
const toNum = (v)=> parseFloat(String(v||'').replace(/[^0-9.\-]/g,''));
const fmt2 = (n)=> Number(n).toFixed(2);

// ===== Calculation (Excel-derived) =====
function recalcBuy(){
  const top  = toNum(document.getElementById('buyTop').value);
  const high = toNum(document.getElementById('buyHigh').value);
  const low  = toNum(document.getElementById('buyLow').value);
  if (!isFinite(top)||!isFinite(high)||!isFinite(low)){ setBuy('—','—','—'); return; }
  const B22 = low - (high - low);       // 2*low - high
  const B23 = top - (top - high)/2;     // (top+high)/2
  const P1  = 2*B22 - B23;
  const P2  = 2*B22 - top;
  const ST  = 2*P2 - P1;
  setBuy(fmt2(P1), fmt2(P2), fmt2(ST));
}
function setBuy(p1,p2,st){
  document.getElementById('buyP1').textContent=p1;
  document.getElementById('buyP2').textContent=p2;
  document.getElementById('buyStop').textContent=st;
}
function recalcSell(){
  const top  = toNum(document.getElementById('sellTop').value);
  const high = toNum(document.getElementById('sellHigh').value);
  const low  = toNum(document.getElementById('sellLow').value);
  if (!isFinite(top)||!isFinite(high)||!isFinite(low)){ setSell('—','—','—'); return; }
  const D22 = high + (high - low);      // 2*high - low
  const D23 = top + (low - top)/2;      // (top+low)/2
  const P2  = D22 + (D22 - top);
  const P1  = D22 + (D22 - D23);
  const ST  = P2 - (P1 - P2);
  setSell(fmt2(P1), fmt2(P2), fmt2(ST));
}
function setSell(p1,p2,st){
  document.getElementById('sellP1').textContent=p1;
  document.getElementById('sellP2').textContent=p2;
  document.getElementById('sellStop').textContent=st;
}
['buyTop','buyHigh','buyLow','sellTop','sellHigh','sellLow'].forEach(id=>{
  const el = document.getElementById(id);
  ['input','change','keyup','blur'].forEach(evt=> el?.addEventListener(evt, ()=>{ recalcBuy(); recalcSell(); }));
});
document.getElementById('buyHead')?.addEventListener('click', ()=>{
  ['buyTop','buyHigh','buyLow'].forEach(id=> document.getElementById(id).value='');
  setBuy('—','—','—');
});
document.getElementById('sellHead')?.addEventListener('click', ()=>{
  ['sellTop','sellHigh','sellLow'].forEach(id=> document.getElementById(id).value='');
  setSell('—','—','—');
});

// ===== Glass & Settings (with Telegram settings) =====
(function(){
  const sheet = document.getElementById('glassSheet');
  const fab   = document.getElementById('glassFab');
  const alpha = document.getElementById('alpha');
  const border= document.getElementById('border');
  const blur  = document.getElementById('blur');

  const r = document.documentElement.style;
  function load(k,d){ return localStorage.getItem(k) ?? d; }
  function save(k,v){ localStorage.setItem(k,v); }
  function apply(){
    r.setProperty('--card-alpha', load('ga','0.12'));
    r.setProperty('--card-border-alpha', load('gb','0.12'));
    r.setProperty('--card-blur', load('gc','14px'));
    alpha.value  = parseFloat(load('ga','0.12')); document.getElementById('alphaVal').textContent=alpha.value;
    border.value = parseFloat(load('gb','0.12')); document.getElementById('borderVal').textContent=border.value;
    blur.value   = parseFloat(load('gc','14px')); document.getElementById('blurVal').textContent  =blur.value+'px';
  }
  apply();
  alpha?.addEventListener('input', ()=>{ save('ga',alpha.value); apply(); });
  border?.addEventListener('input', ()=>{ save('gb',border.value); apply(); });
  blur?.addEventListener('input',  ()=>{ save('gc',blur.value+'px'); apply(); });

  fab?.addEventListener('click', ()=>{
    sheet.classList.toggle('open');
    sheet.setAttribute('aria-hidden', sheet.classList.contains('open')?'false':'true');
  });
  sheet?.addEventListener('click', (e)=>{ if(e.target===sheet){ sheet.classList.remove('open'); sheet.setAttribute('aria-hidden','true'); } });
})();

// ===== Minimal per-side send + timestamp =====
(function(){
  const RELAY_KEY='tgRelayUrl', CHAT_KEY='tgChatId';
  const relayInput=document.getElementById('relayUrlInput');
  const chatInput =document.getElementById('chatIdInput');
  const btnSave   =document.getElementById('saveRelay');
  const btnTest   =document.getElementById('testRelay');

  try{
    relayInput.value = localStorage.getItem(RELAY_KEY)||'';
    chatInput.value  = localStorage.getItem(CHAT_KEY)||'';
  }catch{}
  btnSave?.addEventListener('click', ()=>{
    localStorage.setItem(RELAY_KEY,(relayInput.value||'').trim());
    localStorage.setItem(CHAT_KEY, (chatInput.value||'').trim());
    alert('اطلاعات تلگرام ذخیره شد.');
  });

  async function sendDirect(text){
    const relay=(relayInput.value||localStorage.getItem(RELAY_KEY)||'').trim();
    const chat =(chatInput.value ||localStorage.getItem(CHAT_KEY)||'').trim();
    if (!relay||!chat) throw new Error('Relay/Chat تنظیم نشده');
    const r=await fetch(relay,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chat,text,parse_mode:'HTML',disable_web_page_preview:true})});
    const data=await r.json().catch(()=>({}));
    if (!r.ok||data.ok===false) throw new Error(JSON.stringify(data));
    return data;
  }
  btnTest?.addEventListener('click', async ()=>{
    try{ await sendDirect('Test from FX Levels ✅'); alert('ارسال شد ✅'); }catch(e){ alert('خطا: '+e); }
  });

  const fmt=n=>Number(n).toFixed(2);
  const num=s=>parseFloat(String(s||'').replace(/[^0-9.\-]/g,''));
  function calcSide(side){
    const p1=num((side==='BUY'?buyP1:sellP1).textContent);
    let p2 =num((side==='BUY'?buyP2:sellP2).textContent);
    let sl =num((side==='BUY'?buyStop:sellStop).textContent);
    if (!isFinite(p1)||!isFinite(sl)) return null;
    const MIN=1.5;
    if (Math.abs(p1-sl)<MIN){ sl=(side==='BUY')?(p1-MIN):(p1+MIN); p2=(p1+sl)/2; }
    const dist=Math.abs(p1-sl), tp=(side==='BUY')?(p1+dist):(p1-dist);
    return {p1,p2,sl,tp};
  }
  function buildMessage(side){
    const icon=side==='BUY'?'🟢':'🔴';
    const L=calcSide(side); if(!L) return 'ابتدا مقادیر آن سمت را وارد کنید.';
    const d=new Date(); const pad=n=>String(n).padStart(2,'0');
    const stamp=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return `${icon} XAUUSD ${side}\n\n`+
           `Entry1: ${fmt(L.p1)}\n`+
           `Entry2: ${fmt(L.p2)}\n`+
           `SL: ${fmt(L.sl)}\n`+
           `TP: ${fmt(L.tp)}\n\n`+
           `🕘 ${stamp}`;
  }

  const sendSheet=document.getElementById('sendSheet');
  const sendPreview=document.getElementById('sendPreview');
  const confirmBtn=document.getElementById('confirmSend');
  const cancelBtn=document.getElementById('cancelSend');
  let currentSide=null;
  function openSend(side){ currentSide=side; sendPreview.textContent=buildMessage(side); sendSheet.classList.add('open'); sendSheet.setAttribute('aria-hidden','false'); }
  function closeSend(){ sendSheet.classList.remove('open'); sendSheet.setAttribute('aria-hidden','true'); currentSide=null; }
  sendSheet?.addEventListener('click', e=>{ if(e.target===sendSheet) closeSend(); });
  cancelBtn?.addEventListener('click', closeSend);

  document.getElementById('sendBuy')?.addEventListener('click', ()=> openSend('BUY'));
  document.getElementById('sendSell')?.addEventListener('click', ()=> openSend('SELL'));

  confirmBtn?.addEventListener('click', async ()=>{
    const text=buildMessage(currentSide||'BUY');
    try{ await sendDirect(text); closeSend(); }
    catch(e){ window.open('https://t.me/share/url?text='+encodeURIComponent(text),'_blank'); closeSend(); }
  });
})();
