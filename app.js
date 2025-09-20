
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
      if (until === -1) return true; // lifetime
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

  function unlock(){
    if (!GATE) return;
    GATE.setAttribute('aria-hidden','true');
  }

  if (isValid()) unlock();

  BTN?.addEventListener('click', ()=>{
    const p = PASS.value.trim();
    if (p === 'ehsan'){
      save(7);
      alert('لایسنس یک هفته‌ای شما تایید شد.');
      unlock();
    } else if (p === 'kireehsan'){
      save(-1);
      alert('لایسنس دائمی شما تایید شد.');
      unlock();
    } else {
      ERR.hidden = false;
    }
  });
})();

// ===== Helpers =====
const toNum = (v)=> parseFloat(String(v||'').replace(/[^0-9.\-]/g,''));
const fmt2 = (n)=> Number(n).toFixed(2);

// ===== Calculation (from Excel logic) =====
// BUY inputs: B2(top), B3(high), B4(low)
// Outputs: P1=B5, P2=B6, Stop=B7
function recalcBuy(){
  const top  = toNum(document.getElementById('buyTop').value);
  const high = toNum(document.getElementById('buyHigh').value);
  const low  = toNum(document.getElementById('buyLow').value);
  if (!isFinite(top) || !isFinite(high) || !isFinite(low)) { setBuy('—','—','—'); return; }

  const B22 = low - (high - low);          // 2*low - high
  const B23 = top - (top - high)/2;        // (top+high)/2
  const P1  = 2*B22 - B23;
  const P2  = 2*B22 - top;
  const ST  = 2*P2 - P1;                    // = 2*B6 - B5

  setBuy(fmt2(P1), fmt2(P2), fmt2(ST));
}
function setBuy(p1,p2,st){
  document.getElementById('buyP1').textContent = p1;
  document.getElementById('buyP2').textContent = p2;
  document.getElementById('buyStop').textContent = st;
}

// SELL inputs: D2(top), D3(high), D4(low)
// Outputs: Stop=D5, P2=D6, P1=D7
function recalcSell(){
  const top  = toNum(document.getElementById('sellTop').value);
  const high = toNum(document.getElementById('sellHigh').value);
  const low  = toNum(document.getElementById('sellLow').value);
  if (!isFinite(top) || !isFinite(high) || !isFinite(low)) { setSell('—','—','—'); return; }

  const D22 = high + (high - low);         // 2*high - low
  const D23 = top + (low - top)/2;         // (top+low)/2
  const P2  = D22 + (D22 - top);
  const P1  = D22 + (D22 - D23);
  const ST  = P2 - (P1 - P2);              // = D6 - (D7 - D6)

  setSell(fmt2(P1), fmt2(P2), fmt2(ST));
}
function setSell(p1,p2,st){
  document.getElementById('sellP1').textContent = p1;
  document.getElementById('sellP2').textContent = p2;
  document.getElementById('sellStop').textContent = st;
}

// auto recalc on input
['buyTop','buyHigh','buyLow','sellTop','sellHigh','sellLow'].forEach(id=>{
  const el = document.getElementById(id);
  if (!el) return;
  ['input','change','blur','keyup'].forEach(evt=> el.addEventListener(evt, ()=>{ recalcBuy(); recalcSell(); }));
});

// clear on header tap
document.getElementById('buyHead')?.addEventListener('click', ()=>{
  ['buyTop','buyHigh','buyLow'].forEach(id=> document.getElementById(id).value='');
  setBuy('—','—','—');
});
document.getElementById('sellHead')?.addEventListener('click', ()=>{
  ['sellTop','sellHigh','sellLow'].forEach(id=> document.getElementById(id).value='');
  setSell('—','—','—');
});

// ===== Glass sheet controls =====
(function(){
  const sheet = document.getElementById('glassSheet');
  const fab   = document.getElementById('glassFab');
  const alpha = document.getElementById('alpha');
  const border= document.getElementById('border');
  const blur  = document.getElementById('blur');

  const r = document.documentElement.style;
  function load(v, defv){ return localStorage.getItem(v) ?? defv; }
  function save(k,v){ localStorage.setItem(k,v); }

  function apply(){
    r.setProperty('--card-alpha', load('ga', '0.12'));
    r.setProperty('--card-border-alpha', load('gb', '0.12'));
    r.setProperty('--card-blur', load('gc', '14px'));
    alpha.value = parseFloat(load('ga','0.12')); document.getElementById('alphaVal').textContent = alpha.value;
    border.value= parseFloat(load('gb','0.12')); document.getElementById('borderVal').textContent = border.value;
    blur.value  = parseFloat(load('gc','14px')); document.getElementById('blurVal').textContent   = blur.value+'px';
  }
  apply();

  alpha.addEventListener('input', ()=>{ save('ga', alpha.value); apply(); });
  border.addEventListener('input', ()=>{ save('gb', border.value); apply(); });
  blur.addEventListener('input', ()=>{ save('gc', blur.value+'px'); apply(); });

  fab?.addEventListener('click', ()=>{
    sheet.classList.toggle('open');
    sheet.setAttribute('aria-hidden', sheet.classList.contains('open')?'false':'true');
  });
  sheet?.addEventListener('click', (e)=>{ if(e.target===sheet){ sheet.classList.remove('open'); sheet.setAttribute('aria-hidden','true'); } });

  document.querySelectorAll('.preset-row [data-preset]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const k = btn.getAttribute('data-preset');
      if (k==='soft'){ save('ga','0.10'); save('gb','0.10'); save('gc','18px'); }
      else if (k==='solid'){ save('ga','0.22'); save('gb','0.18'); save('gc','10px'); }
      else if (k==='reset' || k==='default'){ localStorage.removeItem('ga'); localStorage.removeItem('gb'); localStorage.removeItem('gc'); }
      apply();
    });
  });
})();

// ===== Share (text-only) with RR=1 + min SL 1.5 =====
(function(){
  const shareFab = document.getElementById('shareFab');
  const sheet    = document.getElementById('shareSheet');
  const prevEl   = document.getElementById('sharePreview');
  const btnBuy   = document.getElementById('btnTgBuy');
  const btnSell  = document.getElementById('btnTgSell');

  const fmt = n=> Number(n).toFixed(2);
  const num = s=> parseFloat(String(s||'').replace(/[^0-9.\-]/g,''));

  function calcSide(side){
    const p1 = num((side==='BUY'? document.getElementById('buyP1') : document.getElementById('sellP1')).textContent);
    let p2   = num((side==='BUY'? document.getElementById('buyP2') : document.getElementById('sellP2')).textContent);
    let sl   = num((side==='BUY'? document.getElementById('buyStop') : document.getElementById('sellStop')).textContent);
    if (!isFinite(p1) || !isFinite(sl)) return null;
    const MIN=1.5;
    if (Math.abs(p1 - sl) < MIN){
      sl = (side==='BUY') ? (p1 - MIN) : (p1 + MIN);
      p2 = (p1 + sl)/2;
    }
    const dist = Math.abs(p1 - sl);
    const tp   = (side==='BUY') ? (p1 + dist) : (p1 - dist);
    return {p1,p2,sl,tp};
  }

  function buildMessage(side){
    const icon = side==='BUY' ? '🟢' : '🔴';
    const L = calcSide(side);
    if (!L) return 'ابتدا مقادیر آن سمت را وارد کنید.';
    return [`${icon} XAUUSD ${side}`,
            `Entry1: ${fmt(L.p1)}`,
            `Entry2: ${fmt(L.p2)}`,
            `SL: ${fmt(L.sl)}`,
            `TP: ${fmt(L.tp)}`].join('\n');
  }

  function openSheet(){
    sheet.classList.add('open'); sheet.setAttribute('aria-hidden','false');
    prevEl.textContent = [buildMessage('BUY'), buildMessage('SELL')].join('\n\n');
  }

  shareFab?.addEventListener('click', openSheet);
  sheet?.addEventListener('click', (e)=>{ if(e.target===sheet){ sheet.classList.remove('open'); sheet.setAttribute('aria-hidden','true'); } });
  btnBuy?.addEventListener('click', ()=> window.open('https://t.me/share/url?text='+encodeURIComponent(buildMessage('BUY')),'_blank'));
  btnSell?.addEventListener('click', ()=> window.open('https://t.me/share/url?text='+encodeURIComponent(buildMessage('SELL')),'_blank'));

  // Live preview
  ['buyP1','buyP2','buyStop','sellP1','sellP2','sellStop'].forEach(id=>{
    const el = document.getElementById(id);
    new MutationObserver(()=>{
      if (sheet.getAttribute('aria-hidden')==='false'){
        prevEl.textContent = [buildMessage('BUY'), buildMessage('SELL')].join('\n\n');
      }
    }).observe(el,{childList:true});
  });
})();


// ===== v31: Direct Telegram bot via Relay (Cloudflare Worker) =====
(function(){
  const RELAY_KEY = 'tgRelayUrl';
  const CHAT_KEY  = 'tgChatId';

  const relayInput = document.getElementById('relayUrlInput');
  const chatInput  = document.getElementById('chatIdInput');
  const btnSave    = document.getElementById('saveRelay');
  const btnTest    = document.getElementById('testRelay');
  const btnDBuy    = document.getElementById('btnDirectBuy');
  const btnDSell   = document.getElementById('btnDirectSell');

  function getRelay(){ try{return localStorage.getItem(RELAY_KEY)||'';}catch(e){return '';} }
  function getChat(){ try{return localStorage.getItem(CHAT_KEY)||'';}catch(e){return '';} }
  function setRelay(v){ try{localStorage.setItem(RELAY_KEY, v||'');}catch(e){} }
  function setChat(v){ try{localStorage.setItem(CHAT_KEY,  v||'');}catch(e){} }

  if (relayInput) relayInput.value = getRelay();
  if (chatInput)  chatInput.value  = getChat();

  btnSave?.addEventListener('click', ()=>{
    setRelay(relayInput.value.trim());
    setChat(chatInput.value.trim());
    alert('ذخیره شد.');
  });

  async function sendDirect(text){
    const relay = (relayInput?.value||'').trim() || getRelay();
    const chat  = (chatInput?.value||'').trim()  || getChat();
    if (!relay || !chat){ alert('Relay URL و Chat ID را وارد و ذخیره کنید.'); return; }
    try{
      const res = await fetch(relay, {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true })
      });
      const data = await res.json().catch(()=>({}));
      if (res.ok && data && (data.ok || data.result)){
        alert('ارسال شد ✅');
      } else {
        alert('ارسال ناموفق ❌\\n' + (JSON.stringify(data)||''));
      }
    }catch(e){
      alert('خطا در اتصال: ' + e);
    }
  }

  btnTest?.addEventListener('click', ()=> sendDirect('Test from FX Levels ✅'));
  btnDBuy?.addEventListener('click', ()=>{
    const text = (function(){
      const icon='🟢'; const b=document.getElementById('sharePreview').textContent.split('\\n\\n')[0] || '';
      return b.startsWith('🟢')? b : '🟢 ' + b;
    })();
    sendDirect(text);
  });
  btnDSell?.addEventListener('click', ()=>{
    const text = (function(){
      const s = document.getElementById('sharePreview').textContent.split('\\n\\n')[1] || '';
      return s.startsWith('🔴')? s : '🔴 ' + s;
    })();
    sendDirect(text);
  });
})();



// ===== v32: Guided overlay for direct bot setup =====
(function(){
  const guideSheet = document.getElementById('guideSheet');
  const openGuide  = document.getElementById('openGuide');
  const box        = document.getElementById('workerCodeBox');
  const copyBtn    = document.getElementById('copyWorker');
  const guideUrl   = document.getElementById('guideRelayUrl');
  const guideChat  = document.getElementById('guideChatId');
  const guideApply = document.getElementById('guideApply');

  function openSheet(open){
    guideSheet.classList.toggle('open', open ?? !guideSheet.classList.contains('open'));
    guideSheet.setAttribute('aria-hidden', guideSheet.classList.contains('open')?'false':'true');
  }

  openGuide?.addEventListener('click', ()=>{
    openSheet(true);
    // Load worker code lazily
    if (box && !box.textContent.trim()){
      fetch('./cloudflare_worker_tg_relay.js').then(r=>r.text()).then(t=> box.textContent = t);
    }
  });
  guideSheet?.addEventListener('click', (e)=>{ if(e.target===guideSheet) openSheet(false); });

  copyBtn?.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(box.textContent || '');
      alert('کپی شد ✅');
    }catch(e){ alert('کپی نشد.'); }
  });

  guideApply?.addEventListener('click', ()=>{
    const u = guideUrl.value.trim();
    const c = guideChat.value.trim();
    const relayInput = document.getElementById('relayUrlInput');
    const chatInput  = document.getElementById('chatIdInput');
    if (u) relayInput.value = u;
    if (c) chatInput.value  = c;
    document.getElementById('saveRelay')?.click();
    alert('در تنظیمات ذخیره شد.');
  });
})();

