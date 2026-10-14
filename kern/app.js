/* Sprachtrainer-Kern – gemeinsam für alle Sprachen.
   Erwartet window.LANG (Einstellungen der Sprache) und window.DATA ({vokabeln, saetze}).
   Verbesserungen hier wirken in allen Sprachen; Unterschiede nur über LANG / LANG.features. */
const L = window.LANG, DATA = window.DATA;
const F = Object.assign({modes:['karten','quiz','schreiben','saetze','liste'], intervals:[0,1,2,4,7,14], dirDefault:'es'}, L.features||{});
const VOK = DATA.vokabeln;
const SAETZE = DATA.saetze;
const TOPICS = [...new Set(VOK.map(v=>v.t))];
const INTERVALS = F.intervals; // Tage pro Fach 1..5 (Index 1..5), je Sprache einstellbar
let state = load();
let view = (F.modes.includes(state.view) || state.view==='einst') ? state.view : F.modes[0];
let topic = state.topic || 'alle';
let zeit = state.zeit || 'alle';
let ab = state.ab || VOK.map(v=>v.d).sort()[0];
let cardFront = 'es';
let cur = null, flipped = false, quizQ = null, wrQ = null, saQ = null;

const STORE_OK = (()=>{ try{ localStorage.setItem('__t','1'); const ok = localStorage.getItem('__t')==='1'; localStorage.removeItem('__t'); return ok; }catch(e){ return false; } })();
function load(){ let s={}; try{ s = JSON.parse(localStorage.getItem(L.key)||'{}'); }catch(e){}
  // Migration: alter Lernstand war nach Listenposition gespeichert -> jetzt feste Kennung (spanisches Wort)
  if(s.p && !s.v2){ const np={}; for(const k in s.p){ const v = VOK.find(x=>String(x.o)===k); if(v) np[v.id]=s.p[k]; } s.p=np; }
  s.v2 = 1; return s; }
function save(){ state.view=view; state.topic=topic; state.zeit=zeit; state.ab=ab; try{ localStorage.setItem(L.key, JSON.stringify(state)); }catch(e){} }
// Zwei getrennte Leitner-Kästen: 'es' = Fremdsprache → Deutsch (state.p), 'de' = Deutsch → Fremdsprache (state.pd)
function prog(id, d){ const k = d==='de' ? 'pd' : 'p'; state[k] = state[k]||{}; return state[k][id] || (state[k][id] = {b:1, due:0}); }
function dirsActive(){ if(view==='schreiben') return ['de']; const d = state.dir||F.dirDefault; return d==='mix' ? ['es','de'] : [d]; }
function isDue(v,d){ return prog(v.id,d).due <= today(); }
const DAY = 864e5, today = () => Math.floor(Date.now()/DAY);
function inTime(d){ if(zeit==='alle') return true; if(zeit==='neu') return Date.parse(d)/DAY >= today()-7; return d >= ab; }
function pool(){ return VOK.filter(v=>(topic==='alle'||v.t===topic) && inTime(v.d)); }
const MON=['Jän','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
function mon(d){ return MON[+d.slice(5,7)-1]+' '+d.slice(2,4); }
function due(){ const ds = dirsActive(); return pool().filter(v=>ds.some(d=>isDue(v,d))); }
function esHtml(es){ return es.split(' ').map(w => L.articles[w] ? `<span class="${L.articles[w]}">${w}</span>` : w).join(' '); }
function fold(s){ s = s.toLowerCase(); for(const [x,y] of (L.fold||[])) s = s.split(x).join(y); return s.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function norm(s){ return s.toLowerCase().replace(/\s+/g,' ').replace(/…/g,'').trim(); }
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];} return a; }
function pick(force){
  const ds = force ? [force] : dirsActive(), c = [];
  pool().forEach(v=>ds.forEach(d=>{ if(isDue(v,d)) c.push([v,d]); }));
  if(c.length) return c[Math.random()*c.length|0];
  const src = pool().length ? pool() : VOK;
  return [src[Math.random()*src.length|0], ds[Math.random()*ds.length|0]];
}
function grade(v, ok, d){
  const p = prog(v.id, d);
  if(ok){ p.b = Math.min(5, p.b+1); p.due = today() + INTERVALS[p.b]; }
  else { p.b = 1; p.due = today(); }
  state.done = (state.done||0)+1; save();
}
function header(){
  const d = due().length, n = pool().length;
  document.getElementById('stats').textContent = `${d} von ${n} fällig`;
}
function topicBar(){
  return `<div class="row" style="flex-wrap:nowrap">
    <select id="topic" aria-label="Thema">${['alle',...TOPICS].map(t=>`<option value="${t}" ${t===topic?'selected':''}>${t==='alle'?'Alle Themen':t}</option>`).join('')}</select>
    <select id="zeit" aria-label="Zeitraum" style="width:auto;flex:none">
      <option value="alle" ${zeit==='alle'?'selected':''}>Alle</option>
      <option value="neu" ${zeit==='neu'?'selected':''}>Neu (7 Tage)</option>
      <option value="ab" ${zeit==='ab'?'selected':''}>Ab Datum</option></select></div>
    ${zeit==='ab' ? `<label class="legend row" style="flex-wrap:nowrap">Stoff ab <input type="date" id="ab" value="${ab}" style="font:inherit;padding:6px 8px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--fg)"></label>` : ''}
    ${pool().length ? '' : '<p class="feedback bad">Keine Wörter in diesem Zeitraum – zeige alle.</p>'}
    ${reminderHtml()}
    ${STORE_OK ? '' : '<p class="warn">⚠️ Dieser Browser speichert den Fortschritt nicht. Link in Safari oder Chrome öffnen (nicht aus WhatsApp oder der Claude-App) – oder unter „Liste" einen Sicherungscode kopieren.</p>'}`;
}
function dirPick(){ const d = state.dir || F.dirDefault; return d==='mix' ? (Math.random()<.5?'es':'de') : d; }
function dirBar(){
  const d = state.dir || F.dirDefault;
  return `<div class="row" role="group" aria-label="Richtung">${[['es',L.name+' zuerst'],['de','Deutsch zuerst'],['mix','Gemischt']]
    .map(([k,l])=>`<button class="chip ${d===k?'on':''}" data-dir="${k}">${l}</button>`).join('')}</div>`;
}
const DIRNAME = {es:L.name+' → Deutsch', de:'Deutsch → '+L.name};
function boxes(){
  return dirsActive().map(d=>{
    const c=[0,0,0,0,0,0]; pool().forEach(v=>c[prog(v.id,d).b]++);
    return `<div><div class="mini" style="margin:0 0 4px 2px">${DIRNAME[d]}</div><div class="boxes">${[1,2,3,4,5].map(b=>`<div class="box"><b>${c[b]}</b><small>Fach ${b}</small></div>`).join('')}</div></div>`;
  }).join('');
}

const main = document.getElementById('main');
function render(){
  header();
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on', b.dataset.v===view));
  const g = document.getElementById('gear'); if(g){ g.classList.toggle('on', view==='einst'); g.onclick = () => { view = view==='einst' ? (state.lastView||F.modes[0]) : (state.lastView=view, 'einst'); save(); render(); }; }
  ({karten, quiz, schreiben, saetze, liste, einst})[view]();
  const reset = () => { cur=quizQ=wrQ=saQ=null; save(); render(); };
  document.querySelectorAll('[data-dir]').forEach(b=>b.onclick=()=>{ state.dir=b.dataset.dir; reset(); });
  const sel = document.getElementById('topic'); if(sel) sel.onchange = e => { topic=e.target.value; reset(); };
  const zs = document.getElementById('zeit'); if(zs) zs.onchange = e => { zeit=e.target.value; reset(); };
  const ad = document.getElementById('ab'); if(ad) ad.onchange = e => { if(e.target.value){ ab=e.target.value; reset(); } };
}

function karten(){
  if(!cur){ [cur, cardFront] = pick(); flipped=false; }
  const p = prog(cur.id, cardFront);
  main.innerHTML = `<div class="stack">${topicBar()}${dirBar()}${boxes()}
    <button class="card" id="card">
      <div class="topic">${cur.t} · ${cardFront==='es'?L.code+' → DE':'DE → '+L.code} · Fach ${p.b}</div>
      <div class="word">${(cardFront==='es') !== flipped ? esHtml(cur.es) : cur.de}</div>
      <div class="hint">${flipped ? ((cardFront==='es') ? esHtml(cur.es) : cur.de) : 'Tippen zum Umdrehen'}</div>
    </button>
    <div class="row" id="grade" ${flipped?'':'hidden'}>
      <button class="btn bad" id="no">Nicht gewusst</button>
      <button class="btn ok" id="yes">Gewusst</button>
    </div>
    <p class="legend">Leitner-System: Gewusst → ein Fach weiter (Wiederholung nach ${INTERVALS.slice(1).join(', ')} Tagen). Nicht gewusst → zurück in Fach 1. ${DIRNAME.es} und ${DIRNAME.de} haben getrennte Fächer. ${L.legend||''}</p>
  </div>`;
  document.getElementById('card').onclick = () => { flipped=!flipped; render(); };
  document.getElementById('yes').onclick = () => { grade(cur,true,cardFront); cur=null; render(); };
  document.getElementById('no').onclick = () => { grade(cur,false,cardFront); cur=null; render(); };
}

function quiz(){
  if(!quizQ){
    const [v, dir] = pick();
    const others = shuffle(VOK.filter(o=>o.id!==v.id && o.t===v.t).concat(shuffle(VOK.filter(o=>o.id!==v.id)))).slice(0,3);
    quizQ = { v, dir, opts: shuffle([v,...others]), answered:null };
  }
  const q = quizQ, ask = q.dir==='es' ? esHtml(q.v.es) : q.v.de;
  main.innerHTML = `<div class="stack">${topicBar()}${dirBar()}
    <div class="card" style="min-height:140px"><div class="topic">${q.dir==='es'?'Was heißt das auf Deutsch?':'Wie heißt das auf '+L.name+'?'}</div><div class="word">${ask}</div></div>
    <div class="stack" id="opts">${q.opts.map((o,i)=>{
      let cls='opt'; if(q.answered!==null){ if(o.id===q.v.id) cls+=' right'; else if(i===q.answered) cls+=' wrong'; }
      return `<button class="${cls}" data-i="${i}">${q.dir==='es'?o.de:esHtml(o.es)}</button>`;}).join('')}</div>
    <div class="row"><button class="btn primary" id="next" ${q.answered===null?'hidden':''}>Weiter</button></div>
  </div>`;
  document.querySelectorAll('#opts .opt').forEach(b=>b.onclick=()=>{ if(q.answered!==null) return; q.answered=+b.dataset.i; grade(q.v, q.opts[q.answered].id===q.v.id, q.dir); render(); });
  document.getElementById('next').onclick=()=>{ quizQ=null; render(); };
}

function schreiben(){
  if(!wrQ){ wrQ = { v: pick('de')[0], res:null, typed:'' }; }
  const q = wrQ;
  main.innerHTML = `<div class="stack">${topicBar()}
    <div class="card" style="min-height:120px"><div class="topic">Auf ${L.name}, mit Artikel</div><div class="word">${q.v.de}</div></div>
    <form id="f"><input type="text" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${L.placeholder}" value="${q.typed.replace(/"/g,'&quot;')}" ${q.res?'disabled':''}></form>
    <div class="feedback ${q.res?q.res.cls:''}">${q.res?q.res.msg:''}</div>
    <div class="row">${q.res ? '<button class="btn primary" id="next">Weiter</button>' : '<button class="btn primary" id="check">Prüfen</button><button class="btn" id="skip">Weiß ich nicht</button>'}</div>
    <p class="legend">${L.toleranceHint} Bei mehreren Varianten reicht eine.</p>
  </div>`;
  const inp = document.getElementById('ans');
  const check = () => {
    const t = norm(inp.value); q.typed = inp.value;
    const variants = q.v.es.split('/').map(norm);
    const strip = fold;
    const exact = variants.some(x=>x===t), loose = variants.some(x=>strip(x)===strip(t));
    const artMissing = variants.some(x=>x.split(' ').slice(1).join(' ')===t || strip(x.split(' ').slice(1).join(' '))===strip(t));
    if(exact){ q.res={cls:'ok',msg:'Richtig!'}; grade(q.v,true,'de'); }
    else if(loose){ q.res={cls:'ok',msg:`Richtig – Schreibweise: ${q.v.es}`}; grade(q.v,true,'de'); }
    else if(artMissing){ q.res={cls:'bad',msg:`Artikel fehlt: ${q.v.es}`}; grade(q.v,false,'de'); }
    else { q.res={cls:'bad',msg:`Leider nein: ${q.v.es}`}; grade(q.v,false,'de'); }
    render();
  };
  document.getElementById('f').onsubmit = e => { e.preventDefault(); if(!q.res) check(); };
  const c = document.getElementById('check'); if(c) c.onclick=check;
  const s = document.getElementById('skip'); if(s) s.onclick=()=>{ q.res={cls:'bad',msg:`Lösung: ${q.v.es}`}; grade(q.v,false,'de'); render(); };
  const n = document.getElementById('next'); if(n) n.onclick=()=>{ wrQ=null; render(); };
  if(!q.res) setTimeout(()=>inp.focus(),0);
}

function saetze(){
  const src = SAETZE.filter(s=>(topic==='alle'||topic.startsWith(s.t)) && inTime(s.d));
  const list = src.length ? src : SAETZE;
  if(!saQ){ const s = list[Math.random()*list.length|0]; saQ = { s, b: s.b[Math.random()*s.b.length|0], res:null, typed:'' }; }
  const q = saQ, i = q.s.es.indexOf(q.b);
  const gap = `<span style="border-bottom:2px solid var(--accent);padding:0 .3em">${q.res ? q.b : '&nbsp;'.repeat(Math.max(6,q.b.length))}</span>`;
  const sent = q.s.es.slice(0,i) + gap + q.s.es.slice(i+q.b.length);
  state.sDone = state.sDone || 0;
  main.innerHTML = `<div class="stack">${topicBar()}
    <div class="card" style="min-height:150px"><div class="topic">Ergänze den Satz</div>
      <div class="word" style="font-size:clamp(20px,5.5vw,26px)">${sent}</div>
      <div class="hint">${q.s.de}</div></div>
    <form id="sf"><input type="text" id="sans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="fehlendes Wort …" value="${q.typed.replace(/"/g,'&quot;')}" ${q.res?'disabled':''}></form>
    <div class="feedback ${q.res?q.res.cls:''}">${q.res?q.res.msg:''}</div>
    <div class="row">${q.res ? '<button class="btn primary" id="snext">Nächster Satz</button>' : '<button class="btn primary" id="scheck">Prüfen</button><button class="btn" id="sskip">Lösung zeigen</button>'}</div>
    <p class="legend">${list.length} Sätze in dieser Auswahl. Richtig gelöst: ${state.sDone}</p>
  </div>`;
  const inp = document.getElementById('sans');
  const strip = s => fold(norm(s));
  const check = () => {
    q.typed = inp.value;
    if(norm(inp.value)===norm(q.b)){ q.res={cls:'ok',msg:'Richtig!'}; state.sDone++; }
    else if(strip(inp.value)===strip(q.b)){ q.res={cls:'ok',msg:`Fast – Akzent beachten: ${q.b}`}; state.sDone++; }
    else q.res={cls:'bad',msg:`Lösung: ${q.b}`};
    save(); render();
  };
  document.getElementById('sf').onsubmit = e => { e.preventDefault(); if(!q.res) check(); };
  const c=document.getElementById('scheck'); if(c) c.onclick=check;
  const k=document.getElementById('sskip'); if(k) k.onclick=()=>{ q.res={cls:'bad',msg:`Lösung: ${q.b}`}; render(); };
  const n=document.getElementById('snext'); if(n) n.onclick=()=>{ saQ=null; render(); };
  if(!q.res) setTimeout(()=>inp.focus(),0);
}

function liste(){
  const lEs = VOK.filter(v=>prog(v.id,'es').b>=4).length, lDe = VOK.filter(v=>prog(v.id,'de').b>=4).length, P = pool();
  const sortD = state.sort==='datum';
  const row = v => `<tr><td>${esHtml(v.es)}</td><td>${v.de}</td><td>${prog(v.id,'es').b} · ${prog(v.id,'de').b}<br><span class="mini">${mon(v.d)}</span></td></tr>`;
  const groups = sortD
    ? [...new Set(P.map(v=>v.d.slice(0,7)))].sort().reverse().map(m=>[mon(m+'-01'), P.filter(v=>v.d.startsWith(m))])
    : TOPICS.map(t=>[t, P.filter(v=>v.t===t)]).filter(g=>g[1].length);
  main.innerHTML = `<div class="stack">${topicBar()}
    <div class="stack" style="gap:6px">
      <div class="legend">${DIRNAME.es}: ${lEs} von ${VOK.length} sicher (Fach 4–5)</div><div class="bar"><i style="width:${lEs/VOK.length*100}%"></i></div>
      <div class="legend">${DIRNAME.de}: ${lDe} von ${VOK.length} sicher (Fach 4–5)</div><div class="bar"><i style="width:${lDe/VOK.length*100}%"></i></div>
      <div class="mini">Rechte Spalte: Fach ${L.code} → DE · Fach DE → ${L.code}</div></div>
    <div class="row"><button class="chip ${sortD?'':'on'}" id="sThema">Nach Thema</button><button class="chip ${sortD?'on':''}" id="sDatum">Nach Datum</button></div>
    ${groups.map(([h,vs])=>`<h2>${h}</h2><table>${vs.map(row).join('')}</table>`).join('')}
    <p class="legend">${VOK.length} Vokabeln gesamt. Sicherung und Einstellungen: ⚙️ oben rechts.</p>
  </div>`;
  document.getElementById('sThema').onclick=()=>{ state.sort='thema'; save(); render(); };
  document.getElementById('sDatum').onclick=()=>{ state.sort='datum'; save(); render(); };
}

// ---------- Erinnerung an die Sicherung ----------
function hasProgress(){ return ['p','pd'].some(k=>Object.values(state[k]||{}).some(e=>e.b>1)); }
function reminderDue(){
  const every = state.remind ?? 30; if(!every || !hasProgress()) return false;
  const last = state.lastBackup || state.firstUse || (state.firstUse = today());
  return today() - last >= every && today() >= (state.snooze||0);
}
function reminderHtml(){
  if(!reminderDue()) return '';
  const last = state.lastBackup ? `zuletzt vor ${today()-state.lastBackup} Tagen` : 'noch nie gesichert';
  return `<p class="warn">💾 Sicherung empfohlen (${last}). <button class="chip" id="remGo">Jetzt sichern</button> <button class="chip" id="remLater">Später</button></p>`;
}
document.addEventListener('click', e => {
  if(e.target.id==='remGo'){ state.lastView = view; view='einst'; save(); render(); }
  if(e.target.id==='remLater'){ state.snooze = today()+3; save(); render(); }
});

// ---------- Einstellungen ----------
function einst(){
  const every = state.remind ?? 30;
  const last = state.lastBackup ? new Date(state.lastBackup*864e5).toLocaleDateString('de-AT') : 'noch nie';
  main.innerHTML = `<div class="stack">
    <h2>Sicherung</h2>
    <p class="legend">Speichern auf diesem Gerät: <b>${STORE_OK?'funktioniert':'nicht möglich'}</b>. Letzte Sicherung: <b>${last}</b>.<br>
      Mit dem Sicherungscode hebst du deinen Lernstand auf (z. B. in Notizen) oder überträgst ihn auf ein anderes Gerät.</p>
    <div class="row"><button class="btn" id="exp">Code kopieren</button><button class="btn" id="imp">Code einfügen</button></div>
    <textarea id="code" aria-label="Sicherungscode" placeholder="Hier erscheint bzw. hierher kommt der Code" hidden></textarea>
    <div class="feedback" id="cmsg"></div>
    <h2>Erinnerung an die Sicherung</h2>
    <div class="row" role="group" aria-label="Erinnerung">${[[0,'Aus'],[14,'alle 14 Tage'],[30,'alle 30 Tage']]
      .map(([k,l])=>`<button class="chip ${every===k?'on':''}" data-rem="${k}">${l}</button>`).join('')}</div>
    <h2>Fortschritt</h2>
    <div class="row"><button class="btn" id="reset">Fortschritt zurücksetzen</button></div>
    <p class="legend">${L.title} · ${VOK.length} Vokabeln · Der Lernstand liegt nur auf diesem Gerät.</p>
    <div class="row"><button class="btn primary" id="back">Zurück zum Lernen</button></div>
  </div>`;
  const ta = document.getElementById('code'), msg = document.getElementById('cmsg');
  document.getElementById('exp').onclick = () => {
    const pack = src => { const o = {}; for(const k in (src||{})){ const e = src[k]; if(e.b>1 || e.due>0) o[k]=[e.b,e.due]; } return o; };
    const code = L.codePrefix + btoa(unescape(encodeURIComponent(JSON.stringify({p:pack(state.p), q:pack(state.pd), s:state.sDone||0, d:state.done||0}))));
    ta.hidden = false; ta.value = code;
    state.lastBackup = today(); save();
    const done = () => { msg.className='feedback ok'; msg.textContent='Code kopiert – z. B. in Notizen einfügen.'; };
    try{ navigator.clipboard.writeText(code).then(done, () => { ta.select(); msg.className='feedback'; msg.textContent='Code markiert – bitte selbst kopieren.'; }); }
    catch(e){ ta.select(); msg.textContent='Code markiert – bitte selbst kopieren.'; }
  };
  document.getElementById('imp').onclick = () => {
    if(ta.hidden){ ta.hidden=false; ta.value=''; ta.focus(); msg.className='feedback'; msg.textContent='Code einfügen und nochmal auf „Code einfügen" tippen.'; return; }
    try{
      const raw = ta.value.trim(); if(!raw.startsWith(L.codePrefix)) throw 0;
      const o = JSON.parse(decodeURIComponent(escape(atob(raw.slice(L.codePrefix.length)))));
      const unpack = src => { const r = {}; for(const k in (src||{})) r[k] = {b:src[k][0], due:src[k][1]}; return r; };
      state.p = unpack(o.p); state.pd = unpack(o.q);
      state.sDone = o.s||0; state.done = o.d||0; state.lastBackup = today(); save();
      msg.className='feedback ok'; msg.textContent='Lernstand wiederhergestellt.'; setTimeout(render, 800);
    }catch(e){ msg.className='feedback bad'; msg.textContent='Der Code ist ungültig oder unvollständig.'; }
  };
  document.querySelectorAll('[data-rem]').forEach(b=>b.onclick=()=>{ state.remind = +b.dataset.rem; save(); render(); });
  document.getElementById('reset').onclick = e => {
    if(e.target.dataset.sure){ state.p={}; state.pd={}; state.done=0; save(); render(); }
    else { e.target.dataset.sure='1'; e.target.textContent='Wirklich zurücksetzen? Nochmal tippen'; }
  };
  document.getElementById('back').onclick = () => { view = state.lastView || F.modes[0]; save(); render(); };
}

document.querySelectorAll('nav button').forEach(b=>{ if(!F.modes.includes(b.dataset.v)) b.remove(); });
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{ view=b.dataset.v; save(); render(); });
if(!state.firstUse){ state.firstUse = today(); save(); }
render();
