(function(){
  "use strict";

  /* ---------- I18N (cs/en) ----------
     Překlady drží tenhle slovník; statické texty mají v HTML data-i18n /
     data-i18n-title, dynamické se berou přes tr() v místě vzniku.
     Jazyk: uložená volba > jazyk systému (cs/sk → čeština, jinak angličtina). */
  const I18N = {
    cs: {
      ttInfo:'O aplikaci', ttPin:'Vždy navrchu', ttMin:'Minimalizovat', ttClose:'Zavřít',
      ttMiniPlay:'Přehrát / pauza', ttMiniNext:'Další skladba', ttExpand:'Otevřít přehrávač',
      ttCollapse:'Sbalit', ttVizCanvas:'Klikni pro změnu stylu vizualizéru',
      ttVizStyle:'Změnit styl vizualizéru', ttVizFull:'Vizualizér na celou obrazovku',
      ttPrev:'Předchozí', ttPlay:'Přehrát/Pauza', ttStop:'Stop', ttNext:'Další', ttEject:'Přidat soubory',
      ttPlSwitch:'Přepnout playlist', ttPlNew:'Nový prázdný playlist', ttPlRename:'Přejmenovat playlist',
      ttPlDel:'Smazat playlist',
      ttShuffle:'Náhodné přehrávání', ttEq:'Ekvalizér',
      ttNotes:'Poznámky', ttNotesIns:'Vložit aktuální výsledek do poznámky',
      notesPh:'Rychlá poznámka… (ukládá se sama)',
      ttHist:'Historie výpočtů', ttHistClear:'Smazat historii', histTitle:'HISTORIE',
      histEmpty:'— zatím žádné výpočty —',
      ttPodcast:'Přidat podcast (RSS)', podcastPh:'URL RSS podcastu… (Enter)',
      ttRadio:'Přidat internetové rádio', radioPh:'URL streamu rádia… (Enter)', radioErr:'⚠ neplatná URL rádia',
      podLoading:'Načítám podcast…', podErr:'⚠ podcast se nepodařilo načíst',
      podEmpty:'⚠ v kanálu nejsou žádné audio epizody',
      repOff:'Opakování: vypnuto', repAll:'Opakování: celý playlist', repOne:'Opakování: jedna skladba',
      vizEnlarge:'⛶ ZVĚTŠIT', vizHint:'klik = změnit styl · Esc = návrat',
      marqueeHint:'KBCALC · nahraj MP3 přes tlačítko ⏏ a spusť přehrávání',
      noTrack:'— žádná skladba —',
      plEmpty:'Playlist je prázdný — přidej hudbu tlačítkem ⏏.',
      delConfirm:'Smazat playlist „{name}“?',
      skipMsg:'⚠ {title} — soubor nedostupný, přeskakuji…',
      addFailed:'⚠ {n} souborů se nepodařilo přidat',
      noPlayable:'⚠ žádný přehratelný soubor', unavailable:'(nedostupný)',
      aboutTitle:'◈ O APLIKACI KBCALC',
      aboutDesc:'Plovoucí kalkulačka s vestavěným MP3 přehrávačem ve stylu Winampu. '
        + 'Ukázková open source aplikace (MIT) od tvůrců killBottleneck — stáhněte, upravte, používejte i komerčně.',
      linkGithubSub:'zdrojový kód, hlášení chyb, nové verze',
      linkWebSub:'nástroje proti úzkým hrdlům od stejných autorů',
      linkYt:'YouTube kanál', linkYtSub:'návody, novinky a AI experimenty od autorů',
      linkDc:'Komunita na Discordu', linkDcSub:'otázky, nápady, pomoc',
      version:'Verze {v}', updAvail:'Je dostupná verze {v}',
      updCur:'Máte {v} — klikněte pro poznámky k vydání',
      authors:'Autoři: Richard Pobrislo · Claude Fable 5',
      viz:['KŘIVKA','SPEKTRUM','ZRCADLO','BLOKY','VLNA','NORA'],
    },
    en: {
      ttInfo:'About', ttPin:'Always on top', ttMin:'Minimize', ttClose:'Close',
      ttMiniPlay:'Play / pause', ttMiniNext:'Next track', ttExpand:'Open the player',
      ttCollapse:'Collapse', ttVizCanvas:'Click to change visualizer style',
      ttVizStyle:'Change visualizer style', ttVizFull:'Fullscreen visualizer',
      ttPrev:'Previous', ttPlay:'Play/Pause', ttStop:'Stop', ttNext:'Next', ttEject:'Add files',
      ttPlSwitch:'Switch playlist', ttPlNew:'New empty playlist', ttPlRename:'Rename playlist',
      ttPlDel:'Delete playlist',
      ttShuffle:'Shuffle', ttEq:'Equalizer',
      ttNotes:'Notes', ttNotesIns:'Insert the current result into the note',
      notesPh:'Quick note… (auto-saved)',
      ttHist:'Calculation history', ttHistClear:'Clear history', histTitle:'HISTORY',
      histEmpty:'— no calculations yet —',
      ttPodcast:'Add a podcast (RSS)', podcastPh:'Podcast RSS URL… (Enter)',
      ttRadio:'Add internet radio', radioPh:'Radio stream URL… (Enter)', radioErr:'⚠ invalid radio URL',
      podLoading:'Loading podcast…', podErr:'⚠ could not load the podcast',
      podEmpty:'⚠ no audio episodes in the feed',
      repOff:'Repeat: off', repAll:'Repeat: whole playlist', repOne:'Repeat: one track',
      vizEnlarge:'⛶ ENLARGE', vizHint:'click = change style · Esc = back',
      marqueeHint:'KBCALC · load MP3s via the ⏏ button and hit play',
      noTrack:'— no track —',
      plEmpty:'Playlist is empty — add music with the ⏏ button.',
      delConfirm:'Delete playlist "{name}"?',
      skipMsg:'⚠ {title} — file unavailable, skipping…',
      addFailed:'⚠ {n} file(s) could not be added',
      noPlayable:'⚠ no playable file', unavailable:'(unavailable)',
      aboutTitle:'◈ ABOUT KBCALC',
      aboutDesc:'A floating calculator with a built-in Winamp-style MP3 player. '
        + 'A showcase open source app (MIT) from the makers of killBottleneck — download it, tweak it, use it commercially.',
      linkGithubSub:'source code, issue reports, releases',
      linkWebSub:'bottleneck-killing tools by the same authors',
      linkYt:'YouTube channel', linkYtSub:'tutorials, news and AI experiments from the authors',
      linkDc:'Discord community', linkDcSub:'questions, ideas, help',
      version:'Version {v}', updAvail:'Version {v} is available',
      updCur:'You have {v} — click for release notes',
      authors:'Authors: Richard Pobrislo · Claude Fable 5',
      viz:['CURVE','SPECTRUM','MIRROR','BLOCKS','WAVE','TUNNEL'],
    },
  };
  let lang = (()=>{ try{ const s=localStorage.getItem('kbcalc.lang'); if(s==='cs'||s==='en') return s; }catch(e){}
    const nl=(navigator.language||'').toLowerCase();
    return (nl.startsWith('cs')||nl.startsWith('sk')) ? 'cs' : 'en'; })();
  const tr = k => (I18N[lang] && I18N[lang][k]) !== undefined ? I18N[lang][k] : (I18N.cs[k] !== undefined ? I18N.cs[k] : k);
  function applyI18n(){
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = tr(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-title]').forEach(el=>{ el.title = tr(el.dataset.i18nTitle); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el=>{ el.placeholder = tr(el.dataset.i18nPh); });
    document.querySelectorAll('.langBtn').forEach(b=>b.classList.toggle('on', b.dataset.lang===lang));
  }
  function setLang(l){
    if(l===lang) return;
    lang=l; try{ localStorage.setItem('kbcalc.lang', l); }catch(e){}
    applyI18n();
    // dynamické texty, které applyI18n nepokryje (přepsané za běhu)
    setStyleLabels();
    renderPlaylist();
    updateModes();
    if(!histPanel.hidden) histRender();
    // applyI18n přepsal trackTitle na marqueeHint i miniTitle na noTrack; když
    // něco hraje, vrať název skladby (jinak nech prázdný stav = hint + noTrack)
    if(idx>=0 && list[idx]) setTitle((idx+1)+'. '+list[idx].title);
    if(window.win && window.win.notifyLang) window.win.notifyLang(l);   // tray menu
  }

  /* ---------- CALCULATOR ---------- */
  const outEl = document.getElementById('out');
  const exprEl = document.getElementById('expr');
  let cur = '0', prev = null, op = null, freshNum = true;

  const fmt = n => {
    if(!isFinite(n) || !isFinite(n*1e10)) return 'Error';        // ±Infinity i přetečení při zaokrouhlení
    const r = Math.round(n*1e10)/1e10;
    if(n!==0 && r===0) return n.toExponential(6);                // moc malé číslo se nesmí zobrazit jako „0"
    return String(r);
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
    exprEl.textContent = prev!==null ? (group(prev)+' '+opSym[op]) : ' ';  // textContent, ne innerHTML
    const nv=document.getElementById('notesInsVal'); if(nv) nv.textContent=group(shown); }

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
      if(op!==null){
        const ex=group(prev)+' '+opSym[op]+' '+group(cur);
        const r=calc(prev,cur,op); cur=fmt(r); prev=null; op=null; freshNum=true;
        histAdd(ex, cur);
      }
    }
    render();
  }

  /* ---------- HISTORIE VÝPOČTŮ ---------- */
  const HRES_RE=/^-?[\d.]+$|^Error$/;                  // výsledek historie smí být jen číslo/„Error"
  let hist=[];
  try{ const h=JSON.parse(localStorage.getItem('kbcalc.history')||'null');
    if(Array.isArray(h)) hist=h.filter(x=>x&&typeof x.e==='string'&&typeof x.r==='string'&&HRES_RE.test(x.r)).slice(0,50); }catch(e){}
  const histPanel=document.getElementById('histPanel');
  const histList=document.getElementById('histList');
  const histBtn=document.getElementById('histBtn');
  const histSave=()=>{ try{ localStorage.setItem('kbcalc.history', JSON.stringify(hist)); }catch(e){} };
  function histRender(){
    histList.innerHTML='';
    if(!hist.length){
      const li=document.createElement('li'); li.className='empty'; li.textContent=tr('histEmpty');
      histList.appendChild(li); return;
    }
    hist.forEach(h=>{
      const li=document.createElement('li');
      const e1=document.createElement('span'); e1.className='he'; e1.textContent=h.e+' =';
      const e2=document.createElement('span'); e2.className='hr'; e2.textContent=group(h.r);
      li.appendChild(e1); li.appendChild(e2);
      li.onclick=()=>{ cur=h.r; freshNum=true; render(); };   // klik = použít výsledek dál
      histList.appendChild(li);
    });
  }
  function histAdd(e,r){
    hist.unshift({e,r}); if(hist.length>50) hist.length=50;
    histSave(); if(!histPanel.hidden) histRender();
  }
  histBtn.onclick=()=>{
    histPanel.hidden=!histPanel.hidden;
    histBtn.classList.toggle('on', !histPanel.hidden);
    try{ localStorage.setItem('kbcalc.histOpen', histPanel.hidden?'0':'1'); }catch(e){}
    if(!histPanel.hidden){ histRender();
      setTimeout(()=>histPanel.scrollIntoView({block:'nearest'}), 50); }   // mobil: ať je vidět
    fitWindow();
  };
  document.getElementById('histClear').onclick=()=>{ hist=[]; histSave(); histRender(); };
  try{ if(localStorage.getItem('kbcalc.histOpen')==='1'){
    histPanel.hidden=false; histBtn.classList.add('on'); histRender();
  } }catch(e){}

  document.getElementById('keys').addEventListener('click', e=>{
    const b=e.target.closest('.key'); if(b) press(b.dataset.k);
  });
  window.addEventListener('keydown', e=>{
    if(e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;  // psaní do polí ≠ kalkulačka
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
  let streaming = false;   // mobil: aktuální skladba hraje přes nativní stream (rádio/podcast)
  let lastStreamDur = 0;   // poslední známá délka streamu (ms) pro seek
  let curUrlTrack = null;   // kvůli uvolňování lazy blobů z paměti
  let loadFailStreak = 0;   // pojistka proti nekonečné smyčce při přeskakování mrtvých souborů
  let dragSrc = null;       // index přetahované skladby (reorder uvnitř playlistu)

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

  /* ---- ID3 tagy (bez závislostí): TIT2/TPE1 z ID3v2.3/2.4, fallback ID3v1 ---- */
  const TD = enc => { try{ return new TextDecoder(enc); }catch(e){ return new TextDecoder('utf-8'); } };
  const ss  = (u,o)=>((u[o]&0x7f)<<21)|((u[o+1]&0x7f)<<14)|((u[o+2]&0x7f)<<7)|(u[o+3]&0x7f);
  const u32 = (u,o)=>((u[o]<<24)|(u[o+1]<<16)|(u[o+2]<<8)|u[o+3])>>>0;
  function id3Text(u){                       // textový rám: 1 B kódování + text
    if(!u.length) return '';
    const enc=u[0]; let b=u.subarray(1), d;
    if(enc===1){ if(b[0]===0xFF&&b[1]===0xFE){ d=TD('utf-16le'); b=b.subarray(2); }
                 else if(b[0]===0xFE&&b[1]===0xFF){ d=TD('utf-16be'); b=b.subarray(2); }
                 else d=TD('utf-16le'); }
    else if(enc===2) d=TD('utf-16be');
    else if(enc===3) d=TD('utf-8');
    else d=TD('windows-1250');               // „latin1" bývá u českých MP3 reálně win-1250
    return d.decode(b).replace(/\0+$/,'').replace(/^\0+/,'').trim();
  }
  function parseId3(u){
    try{
      if(u.length>10 && u[0]===0x49&&u[1]===0x44&&u[2]===0x33){       // "ID3"
        const ver=u[3], size=ss(u,6);
        // extended header: ve v2.4 synchsafe velikost zahrnuje sebe, ve v2.3 ne
        let o=10; if(u[5]&0x40) o += ver===4 ? ss(u,10) : ss(u,10)+4;
        const end=Math.min(10+size, u.length);
        const out={};
        while(o+10<=end && !(out.title&&out.artist)){
          if(u[o]===0) break;
          const id=String.fromCharCode(u[o],u[o+1],u[o+2],u[o+3]);
          const fsz=ver===4?ss(u,o+4):u32(u,o+4);
          if(fsz<=0||o+10+fsz>end) break;
          if(id==='TIT2') out.title =id3Text(u.subarray(o+10,o+10+fsz));
          if(id==='TPE1') out.artist=id3Text(u.subarray(o+10,o+10+fsz));
          o+=10+fsz;
        }
        if(out.title||out.artist) return out;
      }
      if(u.length>=128){                                              // ID3v1 na konci souboru
        const t=u.subarray(u.length-128);
        if(t[0]===0x54&&t[1]===0x41&&t[2]===0x47){                    // "TAG"
          const s=(a,b)=>TD('windows-1250').decode(t.subarray(a,b)).replace(/\0.*$/,'').trim();
          const title=s(3,33), artist=s(33,63);
          if(title||artist) return {title,artist};
        }
      }
    }catch(e){}
    return null;
  }
  const tagLabel=(tag,fallback)=> (tag && (tag.artist&&tag.title ? tag.artist+' – '+tag.title
                                          : tag.title||tag.artist)) || fallback;
  async function tagFromFile(f){             // pro čerstvě přidané File objekty (čte jen tag, ne celý soubor)
    try{
      const head=new Uint8Array(await f.slice(0,10).arrayBuffer());
      let tag=null;
      if(head[0]===0x49&&head[1]===0x44&&head[2]===0x33){
        const size=Math.min(ss(head,6)+10, 1024*1024);
        tag=parseId3(new Uint8Array(await f.slice(0,size).arrayBuffer()));
      }
      if(!tag && f.size>=128)
        tag=parseId3(new Uint8Array(await f.slice(f.size-128,f.size).arrayBuffer()));
      return tag;
    }catch(e){ return null; }
  }
  // dořešené tagy překreslují playlist dávkově (jinak O(n²) při přidání stovek souborů)
  let tagDirty=false, tagFlush=0;
  function tagItemAsync(item,f){
    tagFromFile(f).then(tag=>{
      if(!tag) return;
      item.title=tagLabel(tag,item.title); item.tagged=true;
      if(list[idx]===item) setTitle((idx+1)+'. '+item.title);
      tagDirty=true; clearTimeout(tagFlush);
      tagFlush=setTimeout(()=>{ if(tagDirty){ tagDirty=false; renderPlaylist(); savePlaylist(); } }, 120);
    });
  }

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
    if(audio.paused){ if(idx>=0) load(idx,false); else setTitle(tr('noTrack')); }
  }
  function newEmptyPlaylist(){
    const j=addPlaylist('Playlist '+(playlists.length+1), []);
    switchPlaylist(j); setOpen(true); startRename();
  }
  function delPlaylist(){
    if(!confirm(tr('delConfirm').replace('{name}', playlists[activePl].name))) return;
    // mobil: ukliď zkopírované soubory z úložiště appky (jinak by zabíraly místo napořád)
    if(window.win && window.win.removeCopied)
      playlists[activePl].items.forEach(t=>{ if(t.path) window.win.removeCopied(t.path); });
    playlists.splice(activePl,1);
    ensureDefault();
    activePl=Math.min(activePl, playlists.length-1); list=playlists[activePl].items;
    idx=Math.min(Math.max(-1, playlists[activePl].idx|0), list.length-1);
    renderTabs(); renderPlaylist(); savePlaylist();
    if(audio.paused){ if(idx>=0) load(idx,false); else setTitle(tr('noTrack')); }
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
    if(!list.length){
      const li=document.createElement('li'); li.className='empty'; li.textContent=tr('plEmpty');
      plEl.innerHTML=''; plEl.appendChild(li); return;
    }
    plEl.innerHTML='';
    list.forEach((t,i)=>{
      const li=document.createElement('li');
      if(i===idx) li.className='active';
      const num=document.createElement('span'); num.className='num'; num.textContent=String(i+1).padStart(2,'0');
      li.appendChild(num);
      li.appendChild(document.createTextNode(t.title));   // název souboru NIKDY přes innerHTML (XSS ze zlého názvu MP3)
      li.onclick=()=>{ load(i,true); };
      // reorder přetažením uvnitř playlistu
      li.draggable=true;
      li.addEventListener('dragstart', e=>{ dragSrc=i;
        e.dataTransfer.setData('text/kbcalc', String(i)); e.dataTransfer.effectAllowed='move'; });
      li.addEventListener('dragover', e=>{ if(dragSrc===null) return;
        e.preventDefault(); e.stopPropagation(); li.classList.add('dropmark'); });
      li.addEventListener('dragleave', ()=>li.classList.remove('dropmark'));
      li.addEventListener('drop', e=>{ if(dragSrc===null) return;
        e.preventDefault(); e.stopPropagation(); const from=dragSrc; dragSrc=null; moveTrack(from, i); });
      li.addEventListener('dragend', ()=>{ dragSrc=null;
        plEl.querySelectorAll('.dropmark').forEach(x=>x.classList.remove('dropmark')); });
      plEl.appendChild(li);
    });
  }
  function moveTrack(from,to){
    if(from===to||from<0||to<0||from>=list.length||to>=list.length) return;
    const curTrack = idx>=0 ? list[idx] : null;    // pozor: `cur` je stav kalkulačky, nestínit
    const [it]=list.splice(from,1); list.splice(to,0,it);
    if(curTrack) idx=list.indexOf(curTrack);
    renderPlaylist(); savePlaylist();
  }

  function setTitle(txt){ miniTitle.textContent=txt; trackTitle.textContent=txt; }

  const nativeStream = () => !!(window.win && window.win.streamPlay);   // mobil: nativní přehrávač streamů

  async function load(i, autoplay){
    if(i<0||i>=list.length) return;
    idx=i; const t=list[i];
    // MOBIL: rádio/podcast (remote) → nativní přehrávač (WebView cross-origin neumí)
    if(t.remote && nativeStream()){
      streaming=true; loadFailStreak=0;
      audio.pause(); audio.removeAttribute('src');   // WebView audio ticho
      curUrlTrack=t;
      setTitle((i+1)+'. '+t.title);
      renderTabs(); renderPlaylist(); savePlaylist();
      if(autoplay) window.win.streamPlay(t.remote, (i+1)+'. '+t.title);
      return;
    }
    if(streaming){ streaming=false; if(window.win.streamStop) window.win.streamStop(); }
    // podcastové epizody na DESKTOPU: kbaudio:// proxy (CORS ok → vizualizér)
    if(!t.url && t.remote){
      t.url = 'kbaudio://play/?u='+encodeURIComponent(t.remote);
    }
    // mobil: trvalá cesta (content:// z pickeru) → přehratelná URL bez kopírování;
    // přežije restart, dokud platí oprávnění k souboru
    if(!t.url && t.path && window.win && window.win.toPlayable){
      t.url = window.win.toPlayable(t.path) || '';
    }
    // desktop: lazy načtení bytů z disku → blob
    if(!t.url && t.path && window.win && window.win.readFile){
      try{ const bytes=await window.win.readFile(t.path);
        if(bytes){
          if(!t.tagged){ const tag=parseId3(bytes); if(tag) t.title=tagLabel(tag,t.title); t.tagged=true; }
          t.url=URL.createObjectURL(new Blob([bytes])); t._lazy=true; } }catch(e){}
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
        setTitle(tr('skipMsg').replace('{title}', t.title));
        return load((i+1)%list.length, true);
      }
      setTitle(autoplay ? tr('noPlayable') : (i+1)+'. '+t.title+' '+tr('unavailable'));
      loadFailStreak=0;
      return;
    }
    loadFailStreak=0;
    setTitle((i+1)+'. '+t.title);
    if(autoplay) play();
  }

  /* ---- shuffle / repeat (persistované režimy) ---- */
  let shuffle=false, repeat='all', shufPlayed=0;   // shufPlayed = kolik skladeb odehráno v shuffle+off
  try{ shuffle = localStorage.getItem('kbcalc.shuffle')==='1';
       const r = localStorage.getItem('kbcalc.repeat'); if(['off','all','one'].includes(r)) repeat=r; }catch(e){}
  const shufBtn=document.getElementById('shufBtn'), repBtn=document.getElementById('repBtn');
  function updateModes(){
    shufBtn.classList.toggle('on', shuffle);
    repBtn.classList.toggle('on', repeat!=='off');
    repBtn.textContent = repeat==='one' ? '🔂' : '🔁';
    repBtn.title = tr(repeat==='one'?'repOne':repeat==='all'?'repAll':'repOff');
  }
  shufBtn.onclick=()=>{ shuffle=!shuffle; shufPlayed=0;
    try{ localStorage.setItem('kbcalc.shuffle', shuffle?'1':'0'); }catch(e){} updateModes(); };
  repBtn.onclick=()=>{ repeat = repeat==='off'?'all':repeat==='all'?'one':'off';
    try{ localStorage.setItem('kbcalc.repeat', repeat); }catch(e){} updateModes(); };
  updateModes();

  /* ---- ekvalizér: 5 pásem (lowshelf/peaking/highshelf) + presety ---- */
  const EQ_FREQS=[60,250,1000,4000,12000];
  const EQ_PRESETS={ flat:[0,0,0,0,0], rock:[5,3,-1,2,4], pop:[-1,2,4,2,-1],
                     jazz:[3,1,0,2,3], bass:[7,4,0,0,0], vocal:[-2,0,4,3,0] };
  const eqClamp=v=>{ const n=+v; return Number.isFinite(n) ? Math.max(-12, Math.min(12, n)) : 0; };
  let eqGains=[0,0,0,0,0], eqPresetName='flat';
  try{ const s=JSON.parse(localStorage.getItem('kbcalc.eq')||'null');
    if(s && Array.isArray(s.g) && s.g.length===5){ eqGains=s.g.map(eqClamp); eqPresetName=s.p||'custom'; } }catch(e){}
  const eqPanel=document.getElementById('eqPanel'), eqSel=document.getElementById('eqPreset');
  const eqSliders=[...document.querySelectorAll('.eqSlider')];
  const eqBtn=document.getElementById('eqBtn');
  function applyEq(){ if(audio._graph && audio._graph.eqs)
    audio._graph.eqs.forEach((f,i)=>{ f.gain.value=eqGains[i]; }); }
  const eqSave=()=>{ try{ localStorage.setItem('kbcalc.eq', JSON.stringify({g:eqGains,p:eqPresetName})); }catch(e){} };
  const eqRender=()=>{ eqSliders.forEach((s,i)=>{ s.value=eqGains[i]; }); eqSel.value=eqPresetName; };
  eqSliders.forEach(s=>s.addEventListener('input',()=>{ eqGains[+s.dataset.band]=+s.value;
    eqPresetName='custom'; eqSel.value='custom'; applyEq(); eqSave(); }));
  eqSel.addEventListener('change',()=>{ const p=EQ_PRESETS[eqSel.value]; if(!p) return;
    eqPresetName=eqSel.value; eqGains=p.slice(); eqRender(); applyEq(); eqSave(); });
  eqBtn.onclick=()=>{ eqPanel.hidden=!eqPanel.hidden; eqBtn.classList.toggle('on', !eqPanel.hidden); };
  eqRender();

  function ensureAudioGraph(){
    if(audio._graph || audio._nograph) return;
    try{
      const AC = window.AudioContext||window.webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser(); analyser.fftSize=256; analyser.smoothingTimeConstant=0.82;
      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const gain = ctx.createGain();
      // src → EQ pásma → analyser → balance → volume → výstup
      const eqs = EQ_FREQS.map((fr,i)=>{ const f=ctx.createBiquadFilter();
        f.type = i===0 ? 'lowshelf' : i===EQ_FREQS.length-1 ? 'highshelf' : 'peaking';
        f.frequency.value=fr; if(f.type==='peaking') f.Q.value=1.0;
        f.gain.value=eqGains[i]; return f; });
      let node = src;
      for(const f of eqs){ node.connect(f); node=f; }
      node.connect(analyser);
      if(panner){ analyser.connect(panner); panner.connect(gain); }
      else analyser.connect(gain);
      gain.connect(ctx.destination);
      audio._graph={ctx,analyser,panner,gain,eqs,
        freq:new Uint8Array(analyser.frequencyBinCount),
        time:new Uint8Array(analyser.fftSize)};
      audio.volume=1;              // od teď hlasitost řídí gain node; jinak by se násobilo (dvojí ztlumení)
      applyVol(); applyBal();
    }catch(err){ console.warn('audio graph:',err); audio._graph=null; audio._nograph=true; }
  }
  function applyVol(){ const v=vol.value/100;
    if(audio._graph&&audio._graph.gain) audio._graph.gain.gain.value=v; else audio.volume=v; }
  function applyBal(){ if(audio._graph&&audio._graph.panner) audio._graph.panner.pan.value=bal.value/100; }

  async function play(){
    if(idx<0 && list.length){ await load(0,false); }
    if(idx<0) return;
    if(streaming){                                    // nativní stream: pokud stojí, načti+spusť
      if(list[idx]) window.win.streamPlay(list[idx].remote, (idx+1)+'. '+list[idx].title);
      return;
    }
    ensureAudioGraph();
    if(audio._graph && audio._graph.ctx.state==='suspended') audio._graph.ctx.resume();
    audio.play().then(()=>{}).catch(e=>console.warn(e));
  }
  function pause(){ if(streaming){ window.win.streamToggle(); return; } audio.pause(); }
  function toggle(){ if(streaming){ window.win.streamToggle(); return; } audio.paused ? play() : pause(); }
  function stop(){
    if(streaming){ streaming=false; if(window.win.streamStop) window.win.streamStop(); return; }
    audio.pause(); audio.currentTime=0;
    if(window.win && window.win.stopBackgroundAudio) window.win.stopBackgroundAudio(); }   // zavře notifikaci
  function pickNext(dir){
    if(shuffle && list.length>1){ let n; do{ n=Math.floor(Math.random()*list.length); }while(n===idx); return n; }
    return (idx+dir+list.length)%list.length;
  }
  function next(){ if(list.length) load(pickNext(1), !audio.paused||playing); }
  function prev_(){ if(list.length) load(pickNext(-1), !audio.paused||playing); }
  function onEnded(){                        // konec skladby řídí repeat/shuffle režim
    if(!list.length) return;
    if(repeat==='one'){ load(idx,true); return; }
    if(shuffle && list.length>1){
      if(repeat==='off' && ++shufPlayed>=list.length){ shufPlayed=0; stop(); return; }  // shuffle bez opakování skončí
      load(pickNext(1),true); return;
    }
    const n=idx+1;
    if(n>=list.length){ if(repeat==='all') load(0,true); else stop(); return; }
    load(n,true);
  }
  // tichá chyba streamu/souboru (mrtvá podcast epizoda, 502 z proxy) nesmí zaseknout přehrávač
  audio.addEventListener('error', ()=>{
    if(!curUrlTrack || !list.length) return;
    if(list.length>1 && loadFailStreak < list.length-1){
      loadFailStreak++;
      setTitle(tr('skipMsg').replace('{title}', curUrlTrack.title||''));
      load(pickNext(1), true);
    } else { loadFailStreak=0; setTitle(tr('noPlayable')); }
  });

  const notifyPlayState=()=>{
    const t = idx>=0&&list[idx]?((idx+1)+'. '+list[idx].title):'kbCalc';
    if(window.win && window.win.setNowPlaying) window.win.setNowPlaying(t, !audio.paused);  // foreground service + notifikace
  };
  audio.addEventListener('play', ()=>{ playing=true; playBtn.textContent='⏸'; miniPlay.textContent='⏸';
    trackTitle.classList.remove('paused'); draw(); notifyPlayState(); });
  audio.addEventListener('pause', ()=>{ playing=false; playBtn.textContent='▶'; miniPlay.textContent='▶';
    trackTitle.classList.add('paused'); notifyPlayState(); if(typeof savePlaylist==='function') savePlaylist(); });
  audio.addEventListener('ended', onEnded);
  audio.addEventListener('timeupdate', ()=>{
    const d=audio.duration||0, c=audio.currentTime||0;
    timeEl.textContent=secfmt(c);
    if(d){ seek.value=Math.round(c/d*1000); miniBar.style.width=(c/d*100)+'%'; }
    const now=performance.now(); if(now-lastSave>5000){ lastSave=now; savePlaylist(); }
  });
  audio.addEventListener('loadedmetadata', ()=>{ timeEl.textContent=secfmt(0); });

  seek.addEventListener('input', ()=>{
    if(streaming){ if(window.win.streamSeek) window.win.streamSeek(seek.value/1000 * (lastStreamDur||0)); return; }
    if(audio.duration) audio.currentTime=seek.value/1000*audio.duration; });
  vol.addEventListener('input', applyVol);
  bal.addEventListener('input', applyBal);

  // přidání hudby: mobil → nativní picker (trvalá cesta + convertFileSrc, přežije
  // restart); desktop/prohlížeč → systémový file dialog (blob / Electron cesta)
  function addMusic(){
    if(window.win && window.win.pickFolder){
      window.win.pickFolder().then(res=>{
        const items = (res && res.items) || [];
        const failed = (res && res.failed) || 0;
        if(!items.length){ if(failed) setTitle(tr('addFailed').replace('{n}', failed)); return; }
        const startEmpty = list.length===0;
        items.forEach(it=>{ if(it && it.path) list.push({title:it.title, path:it.path, url:it.url||undefined}); });
        renderTabs(); renderPlaylist(); savePlaylist(); setOpen(true);
        if(startEmpty && list.length) load(0,true);
        if(failed) setTitle(tr('addFailed').replace('{n}', failed));
      });
    } else fileInput.click();
  }

  // transport buttons
  document.querySelector('.transport').addEventListener('click', e=>{
    const b=e.target.closest('.tbtn'); if(!b || !b.dataset.t) return;   // mode tlačítka mají vlastní handlery
    ({play:toggle, stop, next, prev:prev_, eject:addMusic})[b.dataset.t]();
  });
  miniPlay.onclick=toggle;
  document.getElementById('miniNext').onclick=next;
  document.getElementById('addFiles').onclick=addMusic;

  // přidání souborů přes dialog (⏏) — do aktuálního playlistu
  const AUDIO_RE = /\.(mp3|m4a|ogg|oga|wav|flac|aac|opus|wma)$/i;
  fileInput.addEventListener('change', e=>{
    const files=[...e.target.files].filter(f=>f.type.startsWith('audio/')||AUDIO_RE.test(f.name));
    const startEmpty = list.length===0;
    files.forEach(f=>{
      const p = (window.win && window.win.getPath) ? window.win.getPath(f) : (f.path||'');
      const item={title:nameFrom(f), url:URL.createObjectURL(f), path:p};
      list.push(item); tagItemAsync(item,f);
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
    if(dragSrc!==null) return;                                       // interní reorder, ne soubory
    e.preventDefault(); if(e.dataTransfer) e.dataTransfer.dropEffect='copy'; dropHint(true); }));
  document.addEventListener('dragleave', e=>{ if(!e.relatedTarget) dropHint(false); });
  document.addEventListener('drop', async e=>{
    if(dragSrc!==null){ e.preventDefault(); dragSrc=null; dropHint(false); return; }
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
           .forEach(f=>{ const item={title:nameFrom(f), url:URL.createObjectURL(f), path:(f.path||'')};
             list.push(item); tagItemAsync(item,f); });
      renderTabs(); renderPlaylist(); savePlaylist(); setOpen(true); if(curEmpty && list.length) load(0,true);
    }
  });

  // ---- podcasty: RSS URL → nový playlist s epizodami (stream přes kbaudio://) ----
  function addPodcastFlow(){
    const nm=document.getElementById('plName');
    if(!nm || document.getElementById('podUrlInput') || document.getElementById('plRenameInput')) return;
    const inp=document.createElement('input'); inp.id='podUrlInput'; inp.className='pl-rename';
    inp.placeholder=tr('podcastPh'); nm.style.display='none'; nm.after(inp); inp.focus();
    let done=false;
    const close=()=>{ if(done) return; done=true; inp.remove(); nm.style.display=''; };
    inp.onkeydown=async e=>{
      e.stopPropagation();
      if(e.key==='Escape'){ close(); return; }
      if(e.key!=='Enter') return;
      const url=inp.value.trim(); close();
      if(!url) return;
      setTitle(tr('podLoading'));
      const res = window.win && window.win.fetchPodcast ? await window.win.fetchPodcast(url) : null;
      if(!res || res.error || !res.xml){ setTitle(tr('podErr')); return; }
      try{
        const doc=new DOMParser().parseFromString(res.xml,'text/xml');   // inertní parser, žádný innerHTML
        const chTitle=(doc.querySelector('channel > title')?.textContent||'Podcast').trim()||'Podcast';
        const eps=[];
        for(const it of doc.querySelectorAll('item')){
          if(eps.length>=100) break;
          const enc=it.querySelector('enclosure');
          const u=enc ? (enc.getAttribute('url')||'') : '';
          const ty=enc ? (enc.getAttribute('type')||'') : '';
          if(!/^https?:\/\//i.test(u)) continue;
          if(ty && !/audio|octet/i.test(ty)) continue;
          const et=(it.querySelector('title')?.textContent||'').trim();
          eps.push({ title: et || ('epizoda '+(eps.length+1)), remote: u });
        }
        if(!eps.length){ setTitle(tr('podEmpty')); return; }
        const j=addPlaylist(chTitle, eps);
        playlists[j].feed=url;                     // pro budoucí obnovení kanálu
        switchPlaylist(j); setOpen(true);
      }catch(err){ setTitle(tr('podErr')); }
    };
    inp.onblur=()=>close();
    inp.onclick=e=>e.stopPropagation();
  }
  document.getElementById('plPodcast').onclick=e=>{ e.stopPropagation(); addPodcastFlow(); };

  // ---- internetové rádio: URL streamu → stanice do playlistu, hraje přes stream ----
  function addRadioFlow(){
    const nm=document.getElementById('plName');
    if(!nm || document.getElementById('radioUrlInput') || document.getElementById('plRenameInput')) return;
    const inp=document.createElement('input'); inp.id='radioUrlInput'; inp.className='pl-rename';
    inp.placeholder=tr('radioPh'); nm.style.display='none'; nm.after(inp); inp.focus();
    let done=false;
    const close=()=>{ if(done) return; done=true; inp.remove(); nm.style.display=''; };
    inp.onkeydown=e=>{
      e.stopPropagation();
      if(e.key==='Escape'){ close(); return; }
      if(e.key!=='Enter') return;
      const url=inp.value.trim(); close();
      if(!/^https?:\/\//i.test(url)){ setTitle(tr('radioErr')); return; }
      let name='Rádio'; try{ name=new URL(url).hostname.replace(/^www\./,'')||'Rádio'; }catch(e){}
      const startEmpty=list.length===0;
      list.push({ title:name, remote:url, radio:true });
      renderTabs(); renderPlaylist(); savePlaylist(); setOpen(true);
      load(list.length-1, true);
    };
    inp.onblur=()=>close();
    inp.onclick=e=>e.stopPropagation();
  }
  document.getElementById('plRadio').onclick=e=>{ e.stopPropagation(); addRadioFlow(); };

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
        name: pl.name, idx: pl.idx|0, ...(pl.feed?{feed:pl.feed}:{}),
        items: pl.items.filter(t=>t.path||t.remote).map(t=>({ title:t.title,
          ...(t.path?{path:t.path}:{}), ...(t.remote?{remote:t.remote}:{}) }))
      }));
      // čas ukládej jen pro PRÁVĚ hrající skladbu aktivního playlistu — jinak by se
      // po přepnutí playlistu za hraní obnovila nová skladba na čase té staré
      const timeValid = curUrlTrack && list[idx]===curUrlTrack;
      localStorage.setItem('kbcalc.playlists',
        JSON.stringify({ playlists:pls, active:activePl, time:timeValid ? (audio.currentTime||0) : 0 }));
    }catch(e){}
  }
  async function restorePlaylist(){
    let data; try{ data=JSON.parse(localStorage.getItem('kbcalc.playlists')||'null'); }catch(e){}
    if(!data){                                             // migrace z dob, kdy se appka jmenovala CalcAmp
      try{ data=JSON.parse(localStorage.getItem('calcamp.playlists')||'null'); }catch(e){}
    }
    if(!data){                                             // migrace ze staré jednoplaylistové verze
      let old; try{ old=JSON.parse(localStorage.getItem('calcamp.playlist')||'null'); }catch(e){}
      if(old && old.items && old.items.length)
        data={ playlists:[{name:'Playlist 1', idx:old.idx|0, items:old.items}], active:0, time:old.time||0 };
    }
    if(!data || !data.playlists || !data.playlists.length) return;
    playlists = data.playlists.map(pl=>({ name: pl.name||'Playlist', idx: pl.idx|0,
      ...(pl.feed?{feed:pl.feed}:{}),
      items:(pl.items||[]).filter(it=>it&&(it.path||it.remote)).map(it=>({ title:it.title,
        ...(it.path?{path:it.path}:{}), ...(it.remote?{remote:it.remote}:{}) })) }));
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
  // hardwarová media tlačítka + tray ovládání
  if(wc && wc.onMedia){
    wc.onMedia(a=>{ if(a==='playpause') toggle(); else if(a==='next') next();
                    else if(a==='prev') prev_(); else if(a==='stop') stop();
                    else if(a==='streamEnded'){ streaming=false; onEnded(); }
                    else if(a==='streamError'){ streaming=false; onEnded(); }
                    else if(a==='streamStopped') streaming=false; });
  }
  // stav nativního streamu (rádio/podcast na mobilu) → UI
  if(wc && wc.onStreamState){
    wc.onStreamState(s=>{
      if(!streaming) return;
      if(s.state==='playing'){ playing=true; playBtn.textContent='⏸'; miniPlay.textContent='⏸'; trackTitle.classList.remove('paused'); }
      else if(s.state==='paused'){ playing=false; playBtn.textContent='▶'; miniPlay.textContent='▶'; trackTitle.classList.add('paused'); }
      else if(s.state==='tick'){
        lastStreamDur=s.dur||0;
        const d=(s.dur||0)/1000, c=(s.pos||0)/1000;
        timeEl.textContent = d>0 ? secfmt(c) : 'LIVE';                 // rádio = živě, bez délky
        if(d>0){ seek.value=Math.round(c/d*1000); miniBar.style.width=(c/d*100)+'%'; }
        else { seek.value=0; miniBar.style.width='100%'; }
      }
    });
  }
  if(wc && wc.notifyLang) wc.notifyLang(lang);   // tray menu ve správném jazyce hned od startu


  /* ---------- VISUALIZER ---------- */
  const canvas=document.getElementById('viz'), vctx=canvas.getContext('2d');
  const bigCanvas=document.getElementById('vizBig'), bctx=bigCanvas.getContext('2d');
  const vizFull=document.getElementById('vizFull');
  const STYLES=['KŘIVKA','SPEKTRUM','ZRCADLO','BLOKY','VLNA','NORA'];
  let vizStyle=(()=>{ try{ const v=+localStorage.getItem('kbcalc.viz');
    return (v>=0 && v<STYLES.length) ? v : 0; }catch(e){ return 0; } })();
  const peaks={};                       // padající "čepičky" podle počtu sloupců
  const nora={phase:0};                 // stav "králičí nory" (tunelu)
  const curveS={};                      // vyhlazené hodnoty pro KŘIVKU (rychlý náběh, pomalý dojezd)

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

    if(style==='KŘIVKA'){                // hladké spektrum (à la AIMP): plynulá plocha + odlesk
      const pts=48;
      const key='c'+pts; if(!curveS[key]) curveS[key]=new Float32Array(pts);
      const sm=curveS[key];
      const base=H*0.76;                 // nad základnou spektrum, pod ní zrcadlový odlesk
      for(let i=0;i<pts;i++){
        let v = freq ? freq[Math.floor(i*(freq.length*0.7)/pts)]/255
                     : 0.10+0.07*Math.abs(Math.sin(i*0.35+performance.now()/700));
        v = Math.min(1, v*(1+i/pts*0.6));
        sm[i] = v>sm[i] ? sm[i]+(v-sm[i])*0.5 : sm[i]*0.90;
      }
      const X=i=>i/(pts-1)*W, Y=i=>base - sm[i]*base*0.94;
      const buildPath=()=>{
        ctx.beginPath(); ctx.moveTo(0,base); ctx.lineTo(X(0),Y(0));
        for(let i=1;i<pts;i++){
          const mx=(X(i-1)+X(i))/2, my=(Y(i-1)+Y(i))/2;
          ctx.quadraticCurveTo(X(i-1),Y(i-1),mx,my);
        }
        ctx.lineTo(X(pts-1),Y(pts-1)); ctx.lineTo(W,base); ctx.closePath();
      };
      const grad=ctx.createLinearGradient(0,0,0,base);
      grad.addColorStop(0,'rgba(255,210,58,.85)');
      grad.addColorStop(.4,'rgba(43,255,119,.75)');
      grad.addColorStop(1,'rgba(10,125,54,.20)');
      buildPath(); ctx.fillStyle=grad; ctx.fill();
      ctx.strokeStyle='#7dffb0'; ctx.lineWidth=Math.max(1.2,H/90);
      ctx.shadowColor='#2bff77'; ctx.shadowBlur=Math.min(14,H/10);
      ctx.stroke(); ctx.shadowBlur=0;
      // odlesk pod základnou (zrcadlově, ztlumený)
      ctx.save();
      ctx.translate(0, 2*base); ctx.scale(1,-1);
      ctx.globalAlpha=0.16; buildPath(); ctx.fillStyle=grad; ctx.fill();
      ctx.restore();
      // linka základny
      ctx.fillStyle='rgba(43,255,119,.35)'; ctx.fillRect(0,base,W,1);
      return;
    }

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
    // když je přehrávač sbalený, canvas není vidět → nekresli plnou rychlostí (šetří CPU/baterii)
    if(audio.paused || !app.classList.contains('open')){
      if(!app.classList.contains('open')){ /* skryté: nekresli nic */ }
      else { vctx.clearRect(0,0,W,H); vctx.fillStyle='rgba(43,255,119,.12)';
        const n=32, bw=(W-62)/n; for(let i=0;i<n;i++) vctx.fillRect(i*(bw+2),H-3,bw,3); }
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
  function setStyleLabels(){ const lbl=tr('viz')[vizStyle] || STYLES[vizStyle];
    ['vizStyleLabel','vizFullStyle'].forEach(id=>{ const e=document.getElementById(id); if(e) e.textContent=lbl; }); }
  function cycleStyle(){ vizStyle=(vizStyle+1)%STYLES.length; setStyleLabels();
    try{ localStorage.setItem('kbcalc.viz', String(vizStyle)); }catch(e){} }

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

  /* ---------- MINI ZÁPISNÍK ---------- */
  const notesPanel=document.getElementById('notesPanel');
  const notesArea=document.getElementById('notesArea');
  const notesBtn=document.getElementById('notesBtn');
  try{ notesArea.value = localStorage.getItem('kbcalc.notes')||''; }catch(e){}
  let notesT=0;
  const notesSave=()=>{ clearTimeout(notesT);
    notesT=setTimeout(()=>{ try{ localStorage.setItem('kbcalc.notes', notesArea.value); }catch(e){} }, 400); };
  notesArea.addEventListener('input', notesSave);
  function toggleNotes(){
    notesPanel.hidden=!notesPanel.hidden;
    notesBtn.classList.toggle('on', !notesPanel.hidden);
    try{ localStorage.setItem('kbcalc.notesOpen', notesPanel.hidden?'0':'1'); }catch(e){}
    fitWindow();
    if(!notesPanel.hidden){ notesArea.focus();
      setTimeout(()=>notesArea.scrollIntoView({block:'center'}), 250); }   // mobil: nad klávesnici
  }
  // při psaní držet zápisník viditelný (klávesnice ho jinak překryje)
  notesArea.addEventListener('focus', ()=>setTimeout(()=>notesArea.scrollIntoView({block:'center'}), 250));
  notesBtn.onclick=toggleNotes;
  notesArea.addEventListener('keydown', e=>{ e.stopPropagation();
    if(e.key==='Escape') toggleNotes(); });
  document.getElementById('notesIns').onclick=()=>{
    if(notesPanel.hidden) return;
    const s=notesArea.selectionStart??notesArea.value.length;
    const e2=notesArea.selectionEnd??s;
    notesArea.setRangeText(cur, s, e2, 'end');    // syrová hodnota bez mezer tisíců
    notesArea.focus(); notesSave();
  };
  try{ if(localStorage.getItem('kbcalc.notesOpen')==='1'){
    notesPanel.hidden=false; notesBtn.classList.add('on');
  } }catch(e){}

  /* ---------- O APLIKACI ---------- */
  const about = document.getElementById('about');
  let verInfo = null;
  function renderVersion(){
    const v = verInfo; if(!v) return;
    document.getElementById('aboutVersion').textContent =
      v.version ? tr('version').replace('{v}', v.version) : '';
    const up = document.getElementById('aboutUpdate');
    if (v.hasUpdate) {
      document.getElementById('aboutUpdateTitle').textContent = tr('updAvail').replace('{v}', v.latest);
      document.getElementById('aboutUpdateSub').textContent = tr('updCur').replace('{v}', v.version);
      up.hidden = false;
    } else up.hidden = true;
  }
  document.getElementById('infoBtn').addEventListener('click', async () => {
    about.classList.add('on');
    try { verInfo = await window.win.versionInfo(); renderVersion(); }
    catch (e) { /* bez IPC (prohlížečový fallback) dialog prostě nemá verzi */ }
  });
  document.querySelectorAll('.langBtn').forEach(b =>
    b.addEventListener('click', () => { setLang(b.dataset.lang); renderVersion(); }));
  applyI18n(); setStyleLabels();
  document.getElementById('aboutClose').addEventListener('click', () => about.classList.remove('on'));
  about.addEventListener('click', e => { if (e.target === about) about.classList.remove('on'); });
  document.querySelectorAll('.about-link[data-link]').forEach(b =>
    b.addEventListener('click', () => window.win && window.win.openLink(b.dataset.link)));
  document.getElementById('aboutUpdate').addEventListener('click',
    () => window.win && window.win.openRelease());

})();
