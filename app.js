(function(){
  "use strict";

  /* ---------- CALCULATOR ---------- */
  const outEl = document.getElementById('out');
  const exprEl = document.getElementById('expr');
  let cur = '0', prev = null, op = null, freshNum = true;

  const fmt = n => {
    if(!isFinite(n)) return 'Error';
    let s = Math.abs(n) < 1e-12 && n!==0 ? n.toExponential(6) : String(Math.round(n*1e10)/1e10);
    return s;
  };
  const opSym = {'+':'+','-':'−','*':'×','/':'÷'};

  function calc(a,b,o){ a=+a;b=+b;
    return o==='+'?a+b : o==='-'?a-b : o==='*'?a*b : o==='/'? (b===0?NaN:a/b) : b; }

  // oddělení tisíců tenkou mezerou (1 000 000), zachová desetiny, minus i rozepsanou tečku
  function group(s){
    if(s==='Error' || /[eE]/.test(s)) return s;
    const neg=s.startsWith('-'); if(neg) s=s.slice(1);
    let [ip,dp]=s.split('.');
    ip=ip.replace(/\B(?=(\d{3})+(?!\d))/g,' ');
    return (neg?'-':'') + ip + (s.includes('.') ? '.'+(dp||'') : '');
  }
  function render(){
    const shown = cur.length>12 ? (+cur).toPrecision(8) : cur;
    outEl.textContent = group(shown);
    exprEl.innerHTML = prev!==null ? (group(prev)+' '+opSym[op]) : '&nbsp;'; }

  function press(k){
    if(/^[0-9]$/.test(k)){ cur = freshNum ? k : (cur==='0'?k:cur+k); freshNum=false; }
    else if(k==='.'){ if(freshNum){cur='0.';freshNum=false;} else if(!cur.includes('.')) cur+='.'; }
    else if(k==='C'){ cur='0'; prev=null; op=null; freshNum=true; }
    else if(k==='back'){ if(!freshNum){ cur = cur.length>1?cur.slice(0,-1):'0'; if(cur==='-'||cur==='')cur='0'; } if(cur==='0')freshNum=true; }
    else if(k==='neg'){ cur = (cur.startsWith('-')?cur.slice(1):'-'+cur); if(cur==='-0')cur='0'; }
    else if(k==='%'){                                   // kontextové % jako Win kalkulačka:
      // +/− → procento z prvního čísla (200+10%=220); ×/÷ a bez operace → prosté /100
      cur = (op==='+'||op==='-') ? fmt((+prev)*(+cur)/100) : fmt((+cur)/100);
      freshNum=true; }
    else if(['+','-','*','/'].includes(k)){
      if(op!==null && !freshNum){ const r=calc(prev,cur,op); cur=fmt(r); prev=cur; }
      else prev=cur;
      op=k; freshNum=true;
    }
    else if(k==='='){
      if(op!==null){ const r=calc(prev,cur,op); cur=fmt(r); prev=null; op=null; freshNum=true; }
    }
    render();
  }

  document.getElementById('keys').addEventListener('click', e=>{
    const b=e.target.closest('.key'); if(b) press(b.dataset.k);
  });
  window.addEventListener('keydown', e=>{
    const vf=document.getElementById('vizFull');
    if(vf && vf.classList.contains('on')) return;   // ve fullscreen vizualizéru klávesy neovládají kalkulačku
    const ab=document.getElementById('about');
    if(ab && ab.classList.contains('on')){ if(e.key==='Escape') ab.classList.remove('on'); return; }
    const map={'Enter':'=','=':'=','Backspace':'back','Escape':'C','c':'C','C':'C','%':'%'};
    if(/^[0-9]$/.test(e.key)) press(e.key);
    else if('+-*/'.includes(e.key)) press(e.key);
    else if(e.key==='.'||e.key===',') press('.');
    else if(map[e.key]){ e.preventDefault(); press(map[e.key]); }
  });
  render();

  // fake clock in brand
  function tick(){ const d=new Date(); const p=n=>String(n).padStart(2,'0');
    document.getElementById('clock').textContent=p(d.getHours())+':'+p(d.getMinutes()); }
  tick(); setInterval(tick,10000);

  /* ---------- PLAYER ---------- */
  const audio = document.getElementById('audio');
  const fileInput = document.getElementById('fileInput');
  const plEl = document.getElementById('playlist');
  const app = document.getElementById('app');
  const plMenu = document.getElementById('plMenu');
  // víc playlistů: playlists[i] = { name, idx, items:[{title, path, url?}] }
  // `list` je vždy odkaz na items aktivního playlistu, `idx` = skladba v něm.
  let playlists = [], activePl = 0, list = [], idx = -1, playing = false;
  let curUrlTrack = null;   // kvůli uvolňování lazy blobů z paměti
  let loadFailStreak = 0;   // pojistka proti nekonečné smyčce při přeskakování mrtvých souborů

  const miniTitle = document.getElementById('miniTitle');
  const miniBar = document.getElementById('miniBar');
  const miniPlay = document.getElementById('miniPlay');
  const trackTitle = document.getElementById('trackTitle');
  const playBtn = document.getElementById('playBtn');
  const timeEl = document.getElementById('time');
  const seek = document.getElementById('seek');
  const vol = document.getElementById('vol');
  const bal = document.getElementById('bal');

  const secfmt = s => { s=Math.floor(s||0); return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };
  const nameFrom = f => f.name.replace(/\.[^.]+$/,'');
  const EMPTY_MSG = 'Playlist je prázdný. Přetáhni sem MP3 / složku, nebo klikni ⏏.';

  /* ---- víc playlistů ---- */
  function ensureDefault(){
    if(!playlists.length){ playlists=[{name:'Playlist 1', idx:-1, items:[]}]; activePl=0; }
    list = playlists[activePl].items;
  }
  function uniqueName(name, exceptIdx){
    name = (name||'Playlist').trim() || 'Playlist';
    const taken = nm => playlists.some((p,k)=>k!==exceptIdx && p.name===nm);
    if(!taken(name)) return name;
    let n=2; while(taken(name+' ('+n+')')) n++;
    return name+' ('+n+')';
  }
  function addPlaylist(name, items){
    const pl={ name:uniqueName(name), idx:(items&&items.length)?0:-1, items:items||[] };
    playlists.push(pl); return playlists.length-1;
  }
  function renderTabs(){
    const nm=document.getElementById('plName'); if(nm) nm.textContent=playlists[activePl].name;
    const ct=document.getElementById('plCount'); if(ct) ct.textContent='('+playlists[activePl].items.length+')';
  }
  function switchPlaylist(j){
    if(j<0||j>=playlists.length) return;
    if(playlists[activePl]) playlists[activePl].idx = idx;
    activePl=j; list=playlists[j].items;
    idx = Math.min(Math.max(-1, playlists[j].idx|0), list.length-1);
    renderTabs(); renderPlaylist(); savePlaylist();
    // přepnutí nepřeruší přehrávání; když nic nehraje, jen připrav (bez spuštění)
    if(audio.paused){ if(idx>=0) load(idx,false); else setTitle('— žádná skladba —'); }
  }
  function newEmptyPlaylist(){
    const j=addPlaylist('Playlist '+(playlists.length+1), []);
    switchPlaylist(j); setOpen(true); startRename();
  }
  function delPlaylist(){
    if(!confirm('Smazat playlist „'+playlists[activePl].name+'“?\n(hudební soubory na disku zůstanou)')) return;
    playlists.splice(activePl,1);
    ensureDefault();
    activePl=Math.min(activePl, playlists.length-1); list=playlists[activePl].items;
    idx=Math.min(Math.max(-1, playlists[activePl].idx|0), list.length-1);
    renderTabs(); renderPlaylist(); savePlaylist();
    if(audio.paused){ if(idx>=0) load(idx,false); else setTitle('— žádná skladba —'); }
  }
  function startRename(){
    const nm=document.getElementById('plName'); if(!nm || document.getElementById('plRenameInput')) return;
    const inp=document.createElement('input'); inp.id='plRenameInput'; inp.className='pl-rename';
    inp.value=playlists[activePl].name; nm.style.display='none'; nm.after(inp);
    inp.focus(); inp.select();
    let done=false;
    const finish=ok=>{ if(done) return; done=true;
      if(ok){ const v=inp.value.trim(); if(v) playlists[activePl].name=uniqueName(v, activePl); }
      inp.remove(); nm.style.display=''; renderTabs(); savePlaylist(); };
    inp.onkeydown=e=>{ e.stopPropagation(); if(e.key==='Enter') finish(true); else if(e.key==='Escape') finish(false); };
    inp.onblur=()=>finish(true);
    inp.onclick=e=>e.stopPropagation();
  }
  // rozbalovací seznam playlistů
  function openPlMenu(){
    const sw=document.getElementById('plSwitch'); const r=sw.getBoundingClientRect();
    plMenu.innerHTML='';
    playlists.forEach((pl,i)=>{
      const d=document.createElement('div'); d.className='pl-item'+(i===activePl?' on':'');
      d.textContent=pl.name+'  ('+pl.items.length+')';
      d.onclick=e=>{ e.stopPropagation(); closePlMenu(); switchPlaylist(i); };
      plMenu.appendChild(d);
    });
    plMenu.style.left=r.left+'px'; plMenu.style.top=(r.bottom+3)+'px'; plMenu.style.minWidth=r.width+'px';
    plMenu.classList.add('on');
  }
  function closePlMenu(){ plMenu.classList.remove('on'); }

  function renderPlaylist(){
    if(!list.length){ plEl.innerHTML='<li class="empty">'+EMPTY_MSG+'</li>'; return; }
    plEl.innerHTML='';
    list.forEach((t,i)=>{
      const li=document.createElement('li');
      if(i===idx) li.className='active';
      const num=document.createElement('span'); num.className='num'; num.textContent=String(i+1).padStart(2,'0');
      li.appendChild(num);
      li.appendChild(document.createTextNode(t.title));   // název souboru NIKDY přes innerHTML (XSS ze zlého názvu MP3)
      li.onclick=()=>{ load(i,true); };
      plEl.appendChild(li);
    });
  }

  function setTitle(txt){ miniTitle.textContent=txt; trackTitle.textContent=txt; }

  async function load(i, autoplay){
    if(i<0||i>=list.length) return;
    idx=i; const t=list[i];
    // lazy: soubory přetažené/obnovené mají jen path → načti bytes z disku až teď
    if(!t.url && t.path && window.win && window.win.readFile){
      try{ const bytes=await window.win.readFile(t.path);
        if(bytes){ t.url=URL.createObjectURL(new Blob([bytes])); t._lazy=true; } }catch(e){}
    }
    // uvolni předchozí object URL: lazy bloby (v RAM) vždy; File-URL jen když jde znovu načíst z disku
    if(curUrlTrack && curUrlTrack!==t && curUrlTrack.url){
      const canReload = curUrlTrack.path && window.win && window.win.readFile;
      if(curUrlTrack._lazy || canReload){ URL.revokeObjectURL(curUrlTrack.url); curUrlTrack.url=null; }
    }
    curUrlTrack=t;
    if(t.url) audio.src=t.url; else audio.removeAttribute('src');
    renderTabs(); renderPlaylist();
    savePlaylist();
    // soubor nedostupný (smazaný/přesunutý): nezablokuj playlist — přeskoč na další, s pojistkou proti smyčce
    if(!t.url){
      if(autoplay && list.length>1 && loadFailStreak < list.length-1){
        loadFailStreak++;
        setTitle('⚠ '+t.title+' — soubor nedostupný, přeskakuji…');
        return load((i+1)%list.length, true);
      }
      setTitle(autoplay ? '⚠ žádný přehratelný soubor' : (i+1)+'. '+t.title+' (nedostupný)');
      loadFailStreak=0;
      return;
    }
    loadFailStreak=0;
    setTitle((i+1)+'. '+t.title);
    if(autoplay) play();
  }

  function ensureAudioGraph(){
    if(audio._graph) return;
    try{
      const AC = window.AudioContext||window.webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser(); analyser.fftSize=256; analyser.smoothingTimeConstant=0.82;
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const gain = ctx.createGain();
      let node = src;
      node.connect(analyser);
      if(panner){ analyser.connect(panner); panner.connect(gain); }
      else analyser.connect(gain);
      gain.connect(ctx.destination);
      audio._graph={ctx,analyser,panner,gain,
        freq:new Uint8Array(analyser.frequencyBinCount),
        time:new Uint8Array(analyser.fftSize)};
      applyVol(); applyBal();
    }catch(err){ console.warn('audio graph:',err); audio._graph=null; audio._nograph=true; }
  }
  function applyVol(){ const v=vol.value/100;
    if(audio._graph&&audio._graph.gain) audio._graph.gain.gain.value=v; else audio.volume=v; }
  function applyBal(){ if(audio._graph&&audio._graph.panner) audio._graph.panner.pan.value=bal.value/100; }

  async function play(){
    if(idx<0 && list.length){ await load(0,false); }
    if(idx<0) return;
    ensureAudioGraph();
    if(audio._graph && audio._graph.ctx.state==='suspended') audio._graph.ctx.resume();
    audio.play().then(()=>{}).catch(e=>console.warn(e));
  }
  function pause(){ audio.pause(); }
  function toggle(){ audio.paused ? play() : pause(); }
  function stop(){ audio.pause(); audio.currentTime=0; }
  function next(){ if(list.length) load((idx+1)%list.length, !audio.paused||playing); }
  function prev_(){ if(list.length) load((idx-1+list.length)%list.length, !audio.paused||playing); }

  audio.addEventListener('play', ()=>{ playing=true; playBtn.textContent='⏸'; miniPlay.textContent='⏸';
    trackTitle.classList.remove('paused'); draw(); });
  audio.addEventListener('pause', ()=>{ playing=false; playBtn.textContent='▶'; miniPlay.textContent='▶';
    trackTitle.classList.add('paused'); if(typeof savePlaylist==='function') savePlaylist(); });
  audio.addEventListener('ended', next);
  audio.addEventListener('timeupdate', ()=>{
    const d=audio.duration||0, c=audio.currentTime||0;
    timeEl.textContent=secfmt(c);
    if(d){ seek.value=Math.round(c/d*1000); miniBar.style.width=(c/d*100)+'%'; }
    const now=performance.now(); if(now-lastSave>5000){ lastSave=now; savePlaylist(); }
  });
  audio.addEventListener('loadedmetadata', ()=>{ timeEl.textContent=secfmt(0); });

  seek.addEventListener('input', ()=>{ if(audio.duration) audio.currentTime=seek.value/1000*audio.duration; });
  vol.addEventListener('input', applyVol);
  bal.addEventListener('input', applyBal);

  // transport buttons
  document.querySelector('.transport').addEventListener('click', e=>{
    const b=e.target.closest('.tbtn'); if(!b) return;
    ({play:toggle, stop, next, prev:prev_, eject:()=>fileInput.click()})[b.dataset.t]();
  });
  miniPlay.onclick=toggle;
  document.getElementById('miniNext').onclick=next;
  document.getElementById('addFiles').onclick=()=>fileInput.click();

  // přidání souborů přes dialog (⏏) — do aktuálního playlistu
  const AUDIO_RE = /\.(mp3|m4a|ogg|oga|wav|flac|aac|opus|wma)$/i;
  fileInput.addEventListener('change', e=>{
    const files=[...e.target.files].filter(f=>f.type.startsWith('audio/')||AUDIO_RE.test(f.name));
    const startEmpty = list.length===0;
    files.forEach(f=>{
      const p = (window.win && window.win.getPath) ? window.win.getPath(f) : (f.path||'');
      list.push({title:nameFrom(f), url:URL.createObjectURL(f), path:p});
    });
    renderTabs(); renderPlaylist(); savePlaylist();
    if(startEmpty && list.length){ load(0,true); setOpen(true); }
    fileInput.value='';
  });

  // ---- DRAG & DROP: soubor(y) do aktuálního playlistu, složka = nový playlist po ní pojmenovaný ----
  async function handleExpanded(res){
    const target=list, curEmpty=target.length===0;
    let firstNewPl=-1, addedToCurrent=false;
    for(const r of res){
      if(r.type==='dir' && r.files && r.files.length){
        const j=addPlaylist(r.name, r.files.map(f=>({title:f.title, path:f.path})));
        if(firstNewPl<0) firstNewPl=j;
      } else if(r.type==='file' && r.file){
        target.push({title:r.file.title, path:r.file.path}); addedToCurrent=true;
      }
    }
    if(firstNewPl>=0){ switchPlaylist(firstNewPl); setOpen(true); load(0,true); }     // přepni na 1. novou složku a hraj
    else if(addedToCurrent){ renderTabs(); renderPlaylist(); setOpen(true); if(curEmpty) load(0,true); }
    savePlaylist();
  }
  const dropHint = on => document.body.classList.toggle('dragging', !!on);
  ['dragenter','dragover'].forEach(ev=>document.addEventListener(ev, e=>{
    e.preventDefault(); if(e.dataTransfer) e.dataTransfer.dropEffect='copy'; dropHint(true); }));
  document.addEventListener('dragleave', e=>{ if(!e.relatedTarget) dropHint(false); });
  document.addEventListener('drop', async e=>{
    e.preventDefault(); dropHint(false);
    const files=[...((e.dataTransfer&&e.dataTransfer.files)||[])];
    if(!files.length) return;
    if(window.win && window.win.getPath && window.win.expand){        // Electron: umí i složky (rekurzivně)
      const paths=files.map(f=>window.win.getPath(f)).filter(Boolean);
      const res=await window.win.expand(paths);
      await handleExpanded(res);
    } else {                                                          // prohlížeč: jen zvukové soubory do aktuálního
      const curEmpty=list.length===0;
      files.filter(f=>f.type.startsWith('audio/')||AUDIO_RE.test(f.name))
           .forEach(f=>list.push({title:nameFrom(f), url:URL.createObjectURL(f), path:(f.path||'')}));
      renderTabs(); renderPlaylist(); savePlaylist(); setOpen(true); if(curEmpty && list.length) load(0,true);
    }
  });

  // ---- ovládání přepínače playlistů ----
  document.getElementById('plSwitch').onclick=e=>{ e.stopPropagation();
    plMenu.classList.contains('on') ? closePlMenu() : openPlMenu(); };
  document.getElementById('plNew').onclick=e=>{ e.stopPropagation(); newEmptyPlaylist(); };
  document.getElementById('plRename').onclick=e=>{ e.stopPropagation(); startRename(); };
  document.getElementById('plDel').onclick=e=>{ e.stopPropagation(); delPlaylist(); };
  document.addEventListener('click', ()=>closePlMenu());

  // ---- zapamatování playlistů mezi spuštěními (ukládá se jen cesta, ne bytes) ----
  let lastSave=0;
  function savePlaylist(){
    try{
      if(playlists[activePl]) playlists[activePl].idx = idx;
      const pls = playlists.map(pl=>({
        name: pl.name, idx: pl.idx|0,
        items: pl.items.filter(t=>t.path).map(t=>({title:t.title, path:t.path}))
      }));
      localStorage.setItem('calcamp.playlists',
        JSON.stringify({ playlists:pls, active:activePl, time:audio.currentTime||0 }));
    }catch(e){}
  }
  async function restorePlaylist(){
    let data; try{ data=JSON.parse(localStorage.getItem('calcamp.playlists')||'null'); }catch(e){}
    if(!data){                                             // migrace ze staré jednoplaylistové verze
      let old; try{ old=JSON.parse(localStorage.getItem('calcamp.playlist')||'null'); }catch(e){}
      if(old && old.items && old.items.length)
        data={ playlists:[{name:'Playlist 1', idx:old.idx|0, items:old.items}], active:0, time:old.time||0 };
    }
    if(!data || !data.playlists || !data.playlists.length) return;
    playlists = data.playlists.map(pl=>({ name: pl.name||'Playlist', idx: pl.idx|0,
      items:(pl.items||[]).filter(it=>it&&it.path).map(it=>({title:it.title, path:it.path})) }));
    ensureDefault();
    activePl = Math.min(Math.max(0, data.active|0), playlists.length-1);
    list = playlists[activePl].items;
    renderTabs(); renderPlaylist();
    const startIdx = Math.min(Math.max(-1, playlists[activePl].idx|0), list.length-1);
    if(startIdx>=0 && window.win && window.win.readFile){
      await load(startIdx, false);                         // načti poslední skladbu, ale nepřehrávej
      const t=data.time||0;
      if(t>0){ audio.addEventListener('loadedmetadata', function once(){
        try{ audio.currentTime=Math.min(t, (audio.duration||t)); }catch(e){}
        audio.removeEventListener('loadedmetadata', once); }); }
    }
  }
  ensureDefault(); renderTabs(); renderPlaylist();          // výchozí stav před obnovou

  // ---- fit the OS window exactly around the content ----
  function fitWindow(){
    const player = document.getElementById('player');
    player.style.height='';                                           // uvolni, ať kalkulačka určí přirozenou výšku
    const c = document.getElementById('calc').getBoundingClientRect();
    const open = app.classList.contains('open');
    const h = Math.ceil(c.height);
    if(open) player.style.height = h + 'px';                          // zastropuj přehrávač na výšku kalkulačky -> playlist roluje uvnitř
    const w = Math.ceil(c.width) + (open ? 14 + 330 : 0);
    if(window.win && window.win.resize){ window.win.resize(w, h); }   // Electron: setContentSize
    else{ const dw=window.outerWidth-window.innerWidth, dh=window.outerHeight-window.innerHeight;
          try{ window.resizeTo(w+dw, h+dh); }catch(e){} }
  }
  function setOpen(open){
    if(open){ app.classList.add('open'); fitWindow(); }          // grow first, then slide in
    else{ app.classList.remove('open'); setTimeout(fitWindow, 360); } // slide out, then shrink
  }

  // expand / collapse player
  document.getElementById('expandBtn').onclick=()=>setOpen(!app.classList.contains('open'));
  document.getElementById('closePlayer').onclick=()=>setOpen(false);

  // fit on first paint (and once fonts settle)
  window.addEventListener('load', ()=>{ fitWindow(); setTimeout(fitWindow, 120);
    restorePlaylist();
    if(location.search.indexOf('open')>=0) setTimeout(()=>setOpen(true), 200); });

  // ---- window controls (Electron) ----
  const wc = window.win;
  if(wc){
    document.getElementById('closeBtn').onclick=()=>wc.close();
    document.getElementById('minBtn').onclick=()=>wc.min();
    const pin=document.getElementById('pinBtn');       // vždy navrchu je ve výchozím stavu VYPNuté
    pin.onclick=async()=>{ const on=await wc.togglePin(); pin.classList.toggle('pinned',!!on); };
  } else {
    // běh v obyčejném prohlížeči — schovej tlačítka okna
    ['pinBtn','minBtn','closeBtn'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });
  }


  /* ---------- VISUALIZER ---------- */
  const canvas=document.getElementById('viz'), vctx=canvas.getContext('2d');
  const bigCanvas=document.getElementById('vizBig'), bctx=bigCanvas.getContext('2d');
  const vizFull=document.getElementById('vizFull');
  const STYLES=['SPEKTRUM','ZRCADLO','BLOKY','VLNA','NORA'];
  let vizStyle=0;
  const peaks={};                       // padající "čepičky" podle počtu sloupců
  const nora={phase:0};                 // stav "králičí nory" (tunelu)

  function getData(){
    if(!audio._graph) return null;
    audio._graph.analyser.getByteFrequencyData(audio._graph.freq);
    audio._graph.analyser.getByteTimeDomainData(audio._graph.time);
    return audio._graph;
  }

  function drawViz(ctx, W, H, g){
    ctx.clearRect(0,0,W,H);
    const style=STYLES[vizStyle];
    const freq=g?g.freq:null, time=g?g.time:null;

    if(style==='VLNA'){                  // osciloskop
      ctx.lineWidth=Math.max(1.5, H/60); ctx.strokeStyle='#2bff77';
      ctx.shadowColor='#0a7d36'; ctx.shadowBlur=Math.min(18,H/12);
      ctx.beginPath();
      const N=time?time.length:64;
      for(let i=0;i<N;i++){
        const v=time?time[i]/128-1:Math.sin(i/6)*0.15;
        const x=i/(N-1)*W, y=H/2+v*H*0.44;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
      }
      ctx.stroke(); ctx.shadowBlur=0; return;
    }

    if(style==='NORA'){                  // "králičí nora" — tunel, do kterého letíš
      const cx=W/2, cy=H/2, maxR=Math.hypot(W,H)/2;
      let energy=0, bass=0;
      if(freq){ for(let i=0;i<freq.length;i++) energy+=freq[i];
        energy/=freq.length*255;
        for(let i=0;i<8;i++) bass+=freq[i]; bass/=8*255; }
      nora.phase += 0.006 + energy*0.05 + bass*0.03;   // rychlost letu podle hudby
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(nora.phase*0.35 + Math.sin(nora.phase)*0.15);
      const rings=22, sides=6;
      for(let i=rings;i>0;i--){
        const f=((i/rings)+nora.phase)%1;              // 0 = daleko (střed), 1 = blízko (okraj)
        const r=f*f*maxR;                              // kvadraticky -> zrychlení k okraji
        ctx.beginPath();
        for(let s=0;s<=sides;s++){ const a=s/sides*Math.PI*2 + f*0.6;
          const x=Math.cos(a)*r, y=Math.sin(a)*r; s?ctx.lineTo(x,y):ctx.moveTo(x,y); }
        ctx.closePath();
        ctx.lineWidth=Math.max(1, f*H/26 + bass*6);
        const hot = f>0.82;
        ctx.strokeStyle = hot ? 'rgba(255,210,58,'+(0.2+f*0.8)+')'
                              : 'rgba(43,255,119,'+(0.10+f*0.85)+')';
        ctx.shadowColor='#0a7d36'; ctx.shadowBlur=6+energy*22;
        ctx.stroke();
      }
      ctx.restore(); ctx.shadowBlur=0; return;
    }

    const bars = W>500?64:40;
    const gap = Math.max(1, W/260);
    const bw = (W-(bars-1)*gap)/bars;
    const key='k'+bars; if(!peaks[key]) peaks[key]=new Float32Array(bars);
    const pk=peaks[key];
    const step = freq?(Math.floor(freq.length/bars)||1):1;

    for(let i=0;i<bars;i++){
      let v = freq ? freq[i*step]/255 : (0.10+0.09*Math.abs(Math.sin(i*0.5+vizStyle)));
      v = Math.min(1, v*(1+i/bars*0.7));       // lehké zvednutí výšek pro hezčí obraz
      const h=Math.max(2, v*H), x=i*(bw+gap);

      if(style==='ZRCADLO'){
        const half=h/2, grad=ctx.createLinearGradient(0,H/2-half,0,H/2+half);
        grad.addColorStop(0, v>.8?'#ffd23a':'#7dffb0'); grad.addColorStop(.5,'#2bff77'); grad.addColorStop(1,'#0a7d36');
        ctx.fillStyle=grad; ctx.fillRect(x, H/2-half, bw, h);
      } else if(style==='BLOKY'){
        const seg=Math.max(3, Math.round(H/16));
        for(let s=0; s*(seg+1)<h; s++){
          const yy=H-(s+1)*(seg+1)+1, t=(H-yy)/H;
          ctx.fillStyle = t>.82?'#ffd23a' : t>.55?'#2bff77' : '#0f8f42';
          ctx.fillRect(x, yy, bw, seg);
        }
      } else {                                  // SPEKTRUM
        const grad=ctx.createLinearGradient(0,H,0,H-h);
        grad.addColorStop(0,'#0a7d36'); grad.addColorStop(.6,'#2bff77'); grad.addColorStop(1, v>.8?'#ffd23a':'#7dffb0');
        ctx.fillStyle=grad; ctx.fillRect(x, H-h, bw, h);
      }

      if(style!=='ZRCADLO'){                    // padající čepička
        if(h>pk[i]) pk[i]=h; else pk[i]=Math.max(2, pk[i]-H*0.014);
        ctx.fillStyle='#eafff2'; ctx.fillRect(x, H-pk[i]-2, bw, Math.max(2,H/26));
      }
    }
  }

  // malý vizualizér — nepřetržitá smyčka (aktivní / klidový režim)
  function smallLoop(){
    const W=canvas.width, H=canvas.height;
    if(audio.paused){
      vctx.clearRect(0,0,W,H); vctx.fillStyle='rgba(43,255,119,.12)';
      const n=32, bw=(W-62)/n; for(let i=0;i<n;i++) vctx.fillRect(i*(bw+2),H-3,bw,3);
      setTimeout(()=>requestAnimationFrame(smallLoop),110);
    } else {
      drawViz(vctx,W,H,getData());
      requestAnimationFrame(smallLoop);
    }
  }
  smallLoop();
  function draw(){}                       // smyčka běží pořád; ponecháno kvůli volání z 'play'

  // fullscreen vizualizér
  let bigReq=0;
  function sizeBig(){ bigCanvas.width=window.innerWidth; bigCanvas.height=window.innerHeight; }
  function bigLoop(){
    if(!vizFull.classList.contains('on')) return;
    drawViz(bctx, bigCanvas.width, bigCanvas.height, getData());
    bigReq=requestAnimationFrame(bigLoop);
  }
  function enterFull(){
    vizFull.classList.add('on');
    if(wc && wc.setFullScreen){ wc.setFullScreen(true); }            // Electron: fullscreen okna
    else if(vizFull.requestFullscreen){ vizFull.requestFullscreen().catch(()=>{}); }
    setTimeout(sizeBig, 60); sizeBig();
    cancelAnimationFrame(bigReq); bigLoop();
  }
  function exitFull(){
    cancelAnimationFrame(bigReq); vizFull.classList.remove('on');
    if(wc && wc.setFullScreen){ wc.setFullScreen(false); }
    else if(document.fullscreenElement){ document.exitFullscreen().catch(()=>{}); }
  }
  function setStyleLabels(){ const t=STYLES[vizStyle];
    ['vizStyleLabel','vizFullStyle'].forEach(id=>{ const e=document.getElementById(id); if(e) e.textContent=t; }); }
  function cycleStyle(){ vizStyle=(vizStyle+1)%STYLES.length; setStyleLabels(); }

  document.getElementById('vizStyleBtn').onclick=cycleStyle;
  canvas.addEventListener('click', cycleStyle);
  document.getElementById('vizFullBtn').onclick=enterFull;
  vizFull.addEventListener('click', cycleStyle);
  window.addEventListener('resize', ()=>{ if(vizFull.classList.contains('on')) sizeBig(); });
  document.addEventListener('fullscreenchange', ()=>{
    if(document.fullscreenElement){ sizeBig(); }
    else { cancelAnimationFrame(bigReq); vizFull.classList.remove('on'); }
  });
  window.addEventListener('keydown', e=>{ if(e.key==='Escape' && vizFull.classList.contains('on')) exitFull(); });

  /* ---------- O APLIKACI ---------- */
  const about = document.getElementById('about');
  document.getElementById('infoBtn').addEventListener('click', async () => {
    about.classList.add('on');
    try {
      const v = await window.win.versionInfo();
      document.getElementById('aboutVersion').textContent = v.version ? 'Verze ' + v.version : '';
      const up = document.getElementById('aboutUpdate');
      if (v.hasUpdate) {
        document.getElementById('aboutUpdateTitle').textContent = 'Je dostupná verze ' + v.latest;
        document.getElementById('aboutUpdateSub').textContent =
          'Máte ' + v.version + ' — klikněte pro poznámky k vydání';
        up.hidden = false;
      } else up.hidden = true;
    } catch (e) { /* bez IPC (prohlížečový fallback) dialog prostě nemá verzi */ }
  });
  document.getElementById('aboutClose').addEventListener('click', () => about.classList.remove('on'));
  about.addEventListener('click', e => { if (e.target === about) about.classList.remove('on'); });
  document.querySelectorAll('.about-link[data-link]').forEach(b =>
    b.addEventListener('click', () => window.win && window.win.openLink(b.dataset.link)));
  document.getElementById('aboutUpdate').addEventListener('click',
    () => window.win && window.win.openRelease());

})();
