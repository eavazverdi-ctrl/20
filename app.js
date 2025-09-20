
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
