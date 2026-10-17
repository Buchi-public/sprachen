/* Darstellung „Clean" (Apple-Stil / Liquid Glass) – aktiv nur, wenn <html class="clean">; sonst bleibt die verspielte Optik.
   Ersetzt Emojis durch Liniensymbole, legt den Erklärtext hinter „ⓘ", setzt die Akzentfarbe je Sprache. */
(function(){
  if(!document.documentElement.classList.contains('clean')) return;
  const L = window.LANG || {};
  const TINT = {ES:'#FF9500', DA:'#FF3B30'};
  document.documentElement.style.setProperty('--tint', L.tint || TINT[L.code] || '#007AFF');
  const P = {
    durchgang:'<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
    karten:'<rect x="4" y="7.5" width="13" height="12.5" rx="2.5"/><path d="M8 4.5h9.5A2.5 2.5 0 0 1 20 7v9.5"/>',
    quiz:'<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.5 9"/>',
    schreiben:'<path d="M4.5 19.5l3.8-.9L19 7.9a2 2 0 0 0 0-2.8l-.1-.1a2 2 0 0 0-2.8 0L5.4 15.7z"/><path d="M14.5 6.5l3 3"/>',
    saetze:'<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4 3.5V16A2.5 2.5 0 0 1 4 13.5z"/><path d="M8 8.5h8M8 11.5h5"/>',
    liste:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.6" cy="6" r="1.1" fill="currentColor"/><circle cx="4.6" cy="12" r="1.1" fill="currentColor"/><circle cx="4.6" cy="18" r="1.1" fill="currentColor"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    speaker:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    mic:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',
    skip:'<path d="M5 6.5l7 5.5-7 5.5zM12 6.5l7 5.5-7 5.5z"/>',
    check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    undo:'<path d="M9 14L4.5 9.5 9 5"/><path d="M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".9" fill="currentColor"/>',
    warn:'<path d="M12 4l9 15.5H3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r=".9" fill="currentColor"/>',
    save:'<path d="M12 4v10M7.5 9.5L12 14l4.5-4.5"/><path d="M5 15.5V19h14v-3.5"/>'
  };
  const svg = (n, cls) => `<svg class="ic ${cls||''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

  function chrome(){
    document.querySelectorAll('nav button').forEach(b=>{ const i=b.querySelector('.ico'); if(i && P[b.dataset.v] && !i.dataset.ap){ i.innerHTML = svg(b.dataset.v); i.dataset.ap=1; } });
    const g=document.getElementById('gear'); if(g && !g.dataset.ap){ g.innerHTML = svg('gear'); g.dataset.ap=1; }
    const h=document.querySelector('header'), st=document.getElementById('stats');
    if(h && st && st.parentElement!==h){ h.appendChild(st); }   // Zähler als Untertitel unter den Titel
  }
  // Text am Anfang eines Knopfes (Emoji) durch Symbol ersetzen
  function lead(el, re, icon){
    if(!el || el.dataset.ap) return; el.dataset.ap=1;
    const tn = [...el.childNodes].find(n=>n.nodeType===3 && n.textContent.trim());
    if(tn){ tn.textContent = tn.textContent.replace(re,''); el.insertAdjacentHTML('afterbegin', svg(icon)); }
  }
  function content(){
    document.querySelectorAll('.spk').forEach(b=>lead(b, /^\s*🔊\s*/u, 'speaker'));
    document.querySelectorAll('.btn.mic').forEach(b=>{ if(!b.dataset.ap && b.textContent.includes('🎤')){ b.dataset.ap=1; b.innerHTML = b.innerHTML.replace('🎤', svg('mic')); } });
    const k=document.getElementById('known'); if(k){ lead(k, /^\s*(⏩|✓)\s*/u, k.textContent.includes('⏩')?'skip':'check'); k.classList.add('quiet'); }
    ['undo','undoK'].forEach(id=>lead(document.getElementById(id), /^\s*↩︎?\s*/u, 'undo'));
    document.querySelectorAll('.warn').forEach(w=>{ if(w.dataset.ap) return; w.dataset.ap=1;
      const t=w.firstChild; if(t && t.nodeType===3){ const m=t.textContent.match(/^\s*(⚠️|💾)\s*/u); if(m){ t.textContent=t.textContent.slice(m[0].length); w.insertAdjacentHTML('afterbegin', svg(m[1]==='💾'?'save':'warn')); } } });
    // Lange Erklärung hinter ⓘ
    document.querySelectorAll('p.legend').forEach(p=>{
      if(p.dataset.ap || !/Leitner|antippen/.test(p.textContent)) return; p.dataset.ap=1;
      const d=document.createElement('details'); d.className='info';
      d.innerHTML = `<summary>${svg('info')}So funktioniert's</summary>`;
      p.replaceWith(d); d.appendChild(p);
    });
  }
  const run = () => { chrome(); content(); };
  new MutationObserver(run).observe(document.body, {childList:true, subtree:true});
  run();
})();
