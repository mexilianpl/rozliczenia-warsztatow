/* =========================================================
   sync.js — Rozliczenia Warsztatów v12.10
   Synchronizacja rekordowa online-first z kolejką offline.
   Komputer i telefon mogą zmieniać różne obszary bez nadpisywania
   całego stanu aplikacji.
   ========================================================= */
"use strict";

(function(){
  const DATA_KEY="rw45";
  const STATE_KEY="rw_sync_v2_state";
  const TOKEN_KEY="rw_sync_v2_token";
  const DEFAULT_ENDPOINT=new URL("api/sync-v2.php",location.href).toString();
  const SYNC_INTERVAL_MS=20000;

  let syncing=false;
  let visualSyncing=false;
  let suppressCapture=false;
  let lastSnapshot=cloneData(data);
  let serverInfo={checked:false,ok:false,hasData:false,cursor:0,error:null};

  function cloneData(v){
    try{return structuredClone(v)}catch(e){return JSON.parse(JSON.stringify(v))}
  }
  function nowISO(){return new Date().toISOString()}
  function uuid(){
    if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
    return "op-"+Date.now()+"-"+Math.random().toString(36).slice(2);
  }
  function loadState(){
    let s=null;
    try{s=JSON.parse(localStorage.getItem(STATE_KEY)||"null")}catch(e){}
    if(!s||typeof s!=="object")s={};
    return {
      version:2,
      deviceId:s.deviceId||uuid(),
      initialized:!!s.initialized,
      cursor:Number(s.cursor||0),
      pendingOps:Array.isArray(s.pendingOps)?s.pendingOps:[],
      lastSyncAt:s.lastSyncAt||null,
      lastError:s.lastError||null,
      bootstrapAt:s.bootstrapAt||null
    };
  }
  let state=loadState();
  function persist(){
    try{localStorage.setItem(STATE_KEY,JSON.stringify(state))}catch(e){console.warn("Sync state",e)}
  }
  persist();

  function token(){return String(localStorage.getItem(TOKEN_KEY)||"").trim()}
  function linked(){return !!token()}
  function eq(a,b){try{return JSON.stringify(a)===JSON.stringify(b)}catch(e){return false}}
  function enc(v){return encodeURIComponent(String(v))}
  function dec(v){return decodeURIComponent(String(v))}

  function op(entityKey,action,value){
    return {opId:uuid(),entityKey,action,value:value===undefined?null:cloneData(value),baseCursor:state.cursor,at:nowISO()};
  }

  function mapById(arr){
    const m=new Map();
    (arr||[]).forEach(x=>{if(x&&x.id!==undefined&&x.id!==null)m.set(String(x.id),x)});
    return m;
  }

  function diffAttendance(before={},after={}){
    const ops=[];
    const buckets=new Set([...Object.keys(before||{}),...Object.keys(after||{})]);
    buckets.forEach(bucket=>{
      const b=before?.[bucket]||{}, a=after?.[bucket]||{};
      const ids=new Set([...Object.keys(b||{}),...Object.keys(a||{})]);
      ids.forEach(cid=>{
        const bv=b?.[cid], av=a?.[cid];
        if(eq(bv,av))return;
        const key=`att:${enc(bucket)}:${enc(cid)}`;
        ops.push(av===undefined?op(key,"delete",null):op(key,"set",av));
      });
    });
    return ops;
  }

  function diffData(before,after){
    const ops=[];
    const keys=new Set([...Object.keys(before||{}),...Object.keys(after||{})]);
    keys.forEach(key=>{
      if(key==="attendance"){
        ops.push(...diffAttendance(before?.attendance||{},after?.attendance||{}));
        return;
      }
      const b=before?.[key], a=after?.[key];
      if(eq(b,a))return;

      const bIsArr=Array.isArray(b), aIsArr=Array.isArray(a);
      const arr=aIsArr?a:(bIsArr?b:null);
      const recordArray=Array.isArray(arr) && arr.every(x=>x&&typeof x==="object"&&x.id!==undefined&&x.id!==null);
      if((bIsArr||aIsArr)&&recordArray){
        const bm=mapById(b||[]), am=mapById(a||[]);
        const ids=new Set([...bm.keys(),...am.keys()]);
        ids.forEach(id=>{
          const bv=bm.get(id), av=am.get(id);
          if(eq(bv,av))return;
          const ek=`arr:${enc(key)}:${enc(id)}`;
          ops.push(av===undefined?op(ek,"delete",null):op(ek,"set",av));
        });
      }else{
        const ek=`top:${enc(key)}`;
        ops.push(a===undefined?op(ek,"delete",null):op(ek,"set",a));
      }
    });
    return ops;
  }

  function applyServerOp(o){
    if(!o||!o.entityKey)return;
    if(o.entityKey==="snapshot"){
      if(o.action==="set"&&o.value&&typeof o.value==="object")data=cloneData(o.value);
      return;
    }
    const parts=String(o.entityKey).split(":");
    const kind=parts[0];
    if(kind==="top"){
      const key=dec(parts.slice(1).join(":"));
      if(o.action==="delete")delete data[key]; else data[key]=cloneData(o.value);
      return;
    }
    if(kind==="arr"){
      const key=dec(parts[1]||""), id=dec(parts.slice(2).join(":"));
      if(!Array.isArray(data[key]))data[key]=[];
      const i=data[key].findIndex(x=>x&&String(x.id)===String(id));
      if(o.action==="delete"){
        if(i>=0)data[key].splice(i,1);
      }else if(i>=0)data[key][i]=cloneData(o.value); else data[key].push(cloneData(o.value));
      return;
    }
    if(kind==="att"){
      const bucket=dec(parts[1]||""), cid=dec(parts.slice(2).join(":"));
      data.attendance=data.attendance||{};
      data.attendance[bucket]=data.attendance[bucket]||{};
      if(o.action==="delete"){
        delete data.attendance[bucket][cid];
        if(!Object.keys(data.attendance[bucket]).length)delete data.attendance[bucket];
      }else data.attendance[bucket][cid]=o.value;
    }
  }

  function saveMergedLocal(){
    suppressCapture=true;
    try{
      localStorage.setItem(DATA_KEY,JSON.stringify(data));
      if(typeof syncSettingsArrays==="function")syncSettingsArrays();
      lastSnapshot=cloneData(data);
      if(typeof render==="function")render();
    }finally{suppressCapture=false}
  }

  async function request(payload){
    const t=token();
    if(!t)throw new Error("Brak klucza synchronizacji");
    const r=await fetch(DEFAULT_ENDPOINT,{
      method:"POST",
      headers:{"Content-Type":"application/json","X-RW-API-Key":t},
      body:JSON.stringify(payload)
    });
    let body=null;
    try{body=await r.json()}catch(e){}
    if(!r.ok||body?.ok===false){
      const e=new Error(body?.error||body?.message||`HTTP ${r.status}`);
      e.status=r.status;e.body=body;throw e;
    }
    return body||{ok:true};
  }

  async function checkServer(){
    if(!linked()){serverInfo={checked:true,ok:false,hasData:false,cursor:0,error:"Brak klucza"};updateStatus();return serverInfo}
    if(!navigator.onLine){serverInfo={...serverInfo,checked:true,error:"offline"};updateStatus();return serverInfo}
    try{
      const r=await request({mode:"status",deviceId:state.deviceId});
      serverInfo={checked:true,ok:true,hasData:!!r.hasData,cursor:Number(r.cursor||0),error:null};
    }catch(e){serverInfo={checked:true,ok:false,hasData:false,cursor:0,error:String(e.message||e)}}
    updateStatus();return serverInfo;
  }

  async function bootstrapThisDevice(){
    if(!linked()||!navigator.onLine)return;
    const ok=await confirmModal({
      title:"Ustawić te dane jako początkowe?",
      message:"Serwer jest pusty. Zostanie na nim zapisana pełna kopia danych widocznych teraz na tym urządzeniu. Tej operacji użyj tylko na urządzeniu z właściwymi, kompletnymi danymi.",
      confirmText:"Tak, wyślij dane",cancelText:"Anuluj",danger:false
    });
    if(!ok)return;
    syncing=true;visualSyncing=true;updateStatus();
    try{
      const r=await request({mode:"bootstrap",deviceId:state.deviceId,data:cloneData(data),at:nowISO()});
      state.initialized=true;state.cursor=Number(r.cursor||0);state.pendingOps=[];state.bootstrapAt=nowISO();state.lastSyncAt=nowISO();state.lastError=null;
      lastSnapshot=cloneData(data);persist();serverInfo={checked:true,ok:true,hasData:true,cursor:state.cursor,error:null};
      closeModal();showToast("Dane początkowe zapisane na serwerze");
    }catch(e){state.lastError=String(e.message||e);persist();showToast("Nie udało się wysłać danych początkowych");}
    finally{syncing=false;visualSyncing=false;updateStatus()}
  }

  async function adoptServerData(){
    if(!linked()||!navigator.onLine)return;
    const ok=await confirmModal({
      title:"Pobrać dane z serwera?",
      message:"Lokalne dane na tym urządzeniu zostaną zastąpione aktualną bazą z serwera. Użyj tego na drugim urządzeniu po wysłaniu danych początkowych.",
      confirmText:"Pobierz z serwera",cancelText:"Anuluj",danger:false
    });
    if(!ok)return;
    syncing=true;visualSyncing=true;updateStatus();
    try{
      const r=await request({mode:"pushpull",deviceId:state.deviceId,cursor:0,ops:[]});
      (r.ops||[]).forEach(applyServerOp);
      saveMergedLocal();
      state.initialized=true;state.cursor=Number(r.cursor||0);state.pendingOps=[];state.lastSyncAt=nowISO();state.lastError=null;persist();
      closeModal();showToast("Pobrano aktualne dane z serwera");
    }catch(e){state.lastError=String(e.message||e);persist();showToast("Nie udało się pobrać danych");}
    finally{syncing=false;visualSyncing=false;updateStatus()}
  }

  async function syncNow(manual=false){
    if(!state.initialized){if(manual)showSyncDetails();return {ok:false,reason:"not-initialized"}}
    if(!linked()){if(manual)showSyncDetails();return {ok:false,reason:"not-linked"}}
    if(!navigator.onLine){if(manual)showToast("Brak internetu • zmiany czekają lokalnie");updateStatus();return {ok:false,reason:"offline"}}
    if(syncing)return {ok:false,reason:"busy"};
    const sending=state.pendingOps.slice();
    visualSyncing=manual||sending.length>0;
    syncing=true;state.lastError=null;persist();updateStatus();
    try{
      const r=await request({mode:"pushpull",deviceId:state.deviceId,cursor:state.cursor,ops:sending});
      const ack=new Set(r.ackedOpIds||[]);
      state.pendingOps=state.pendingOps.filter(x=>!ack.has(x.opId));
      const remoteOps=Array.isArray(r.ops)?r.ops:[];
      remoteOps.forEach(applyServerOp);
      state.cursor=Number(r.cursor||state.cursor);state.lastSyncAt=nowISO();state.lastError=null;
      if(remoteOps.length)saveMergedLocal();
      else lastSnapshot=cloneData(data);
      persist();
      if(manual)showToast(state.pendingOps.length?"Część zmian nadal oczekuje":"Synchronizacja zakończona");
      return {ok:true};
    }catch(e){
      state.lastError=String(e.message||e);persist();if(manual)showToast("Synchronizacja nieudana • dane są zapisane lokalnie");return {ok:false,error:state.lastError};
    }finally{syncing=false;visualSyncing=false;updateStatus()}
  }

  function descriptor(){
    const pending=state.pendingOps.length;
    if(!navigator.onLine)return {cls:"offline",short:"🔴 Offline",detail:pending?`Offline • ${pending} zmian czeka`:`Offline • praca lokalna`};
    if(syncing&&visualSyncing)return {cls:"syncing",short:"🔵 Synchronizacja…",detail:"Wymiana zmian z serwerem"};
    if(!linked())return {cls:"local",short:"🟡 Serwer niepołączony",detail:"Kliknij, aby podłączyć to urządzenie"};
    if(!state.initialized)return {cls:"pending",short:"🟠 Wybierz dane startowe",detail:"Urządzenie nie zostało jeszcze zsynchronizowane"};
    if(state.lastError)return {cls:"error",short:`🟠 ${pending} oczekuje`,detail:"Błąd synchronizacji • dane są bezpieczne lokalnie"};
    if(pending)return {cls:"pending",short:`🟠 ${pending} oczekuje`,detail:`${pending} zmian czeka na wysłanie`};
    return {cls:"synced",short:"🟢 Zsynchronizowano",detail:state.lastSyncAt?`Ostatnia synchronizacja: ${new Date(state.lastSyncAt).toLocaleString("pl-PL")}`:"Dane zsynchronizowane"};
  }

  function ensureStatus(){
    let el=document.getElementById("syncStatus");if(el)return el;
    const host=document.querySelector(".appHeaderText");if(!host)return null;
    el=document.createElement("button");el.id="syncStatus";el.type="button";el.className="syncStatus";el.onclick=showSyncDetails;host.appendChild(el);return el;
  }
  function updateStatus(){const el=ensureStatus();if(!el)return;const d=descriptor();el.className=`syncStatus ${d.cls}`;el.textContent=d.short;el.title=d.detail}
  function esc(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

  function showConnectForm(){
    closeModal();
    modal(`<h2>Podłącz urządzenie do serwera</h2>
      <div class="notice">Wpisz klucz API zapisany w pliku <b>api/config.php</b>. Klucz zostanie zapisany tylko w tej przeglądarce.</div>
      <label>Klucz synchronizacji</label><input id="syncTokenInput" type="password" autocomplete="off" placeholder="Klucz API">
      <div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="RWRecordSync.connect(syncTokenInput.value)">Połącz</button></div>`);
  }

  async function connect(t){
    t=String(t||"").trim();if(!t){showToast("Wpisz klucz synchronizacji");return}
    localStorage.setItem(TOKEN_KEY,t);serverInfo.checked=false;state.lastError=null;persist();
    const info=await checkServer();
    if(!info.ok){localStorage.removeItem(TOKEN_KEY);showToast("Nieprawidłowy klucz lub brak połączenia");showConnectForm();return}
    closeModal();
    showSyncDetails();
  }
  async function disconnect(){
    if(state.pendingOps.length){
      const ok=await confirmModal({
        title:"Zmiany czekają na wysłanie",
        message:`${state.pendingOps.length} zmian nie zostało jeszcze wysłanych na serwer. Najpierw połącz się z internetem i zsynchronizuj dane.`,
        confirmText:"Zostań połączony",cancelText:"Anuluj",danger:false
      });
      return;
    }
    const ok=await confirmModal({
      title:"Odłączyć to urządzenie?",
      message:"Dane lokalne pozostaną na urządzeniu, ale automatyczna synchronizacja zostanie wyłączona do ponownego podłączenia.",
      confirmText:"Odłącz",cancelText:"Anuluj",danger:false
    });
    if(!ok)return;
    localStorage.removeItem(TOKEN_KEY);state.initialized=false;state.cursor=0;state.lastError=null;persist();
    serverInfo={checked:false,ok:false,hasData:false,cursor:0,error:null};updateStatus();closeModal();showToast("Urządzenie odłączone od synchronizacji");
  }

  async function showSyncDetails(){
    if(!linked()){
      modal(`<h2>Synchronizacja danych</h2><div class="syncStateCard local"><b>🟡 Serwer niepołączony</b><span>Podłącz urządzenie, aby korzystać ze wspólnej bazy.</span></div><div class="actions"><button class="soft" onclick="closeModal()">Zamknij</button><button class="primary" onclick="RWRecordSync.showConnectForm()">Podłącz urządzenie</button></div>`);return;
    }
    if(!serverInfo.checked)await checkServer();
    const d=descriptor(),pending=state.pendingOps.length;
    let setup="";
    if(!state.initialized){
      setup=serverInfo.ok?(serverInfo.hasData
        ? `<div class="notice"><b>Serwer ma już dane.</b> To urządzenie powinno pobrać wspólną bazę.</div><div class="actions"><button class="primary" onclick="RWRecordSync.adoptServerData()">Pobierz dane z serwera</button></div>`
        : `<div class="notice"><b>Serwer jest pusty.</b> Jeśli to urządzenie ma właściwe i kompletne dane, ustaw je jako początkowe.</div><div class="actions"><button class="primary" onclick="RWRecordSync.bootstrapThisDevice()">Ustaw te dane jako początkowe</button></div>`)
        : `<div class="syncError">Nie udało się połączyć z serwerem: ${esc(serverInfo.error||"błąd")}</div>`;
    }
    modal(`<h2>Synchronizacja danych</h2>
      <div class="syncStateCard ${d.cls}"><b>${d.short}</b><span>${d.detail}</span></div>
      <div class="syncDetailsGrid"><div><span>Oczekuje</span><b>${pending}</b></div><div><span>Kursor serwera</span><b>${state.cursor}</b></div><div><span>Urządzenie</span><b>${state.initialized?"✓":"—"}</b></div></div>
      ${setup}
      ${state.lastSyncAt?`<div class="muted syncMeta">Ostatnia synchronizacja: ${new Date(state.lastSyncAt).toLocaleString("pl-PL")}</div>`:""}
      ${state.lastError?`<div class="syncError">${esc(state.lastError)}</div>`:""}
      <div class="actions"><button class="soft" onclick="closeModal()">Zamknij</button>${state.initialized?`<button class="primary" onclick="RWRecordSync.syncNow(true)">Synchronizuj teraz</button>`:""}<button class="soft" onclick="RWRecordSync.disconnect()">Odłącz</button></div>`);
  }

  const previousSave=window.save;
  if(typeof previousSave==="function"){
    window.save=function(){
      const before=lastSnapshot;
      previousSave();
      const after=cloneData(data);
      if(suppressCapture){lastSnapshot=after;return}
      if(state.initialized){
        const ops=diffData(before,after);
        if(ops.length){state.pendingOps.push(...ops);persist()}
      }
      lastSnapshot=after;updateStatus();
      if(state.initialized&&linked()&&navigator.onLine)queueMicrotask(()=>syncNow(false));
    };
  }

  window.addEventListener("online",()=>{updateStatus();if(state.initialized&&linked())syncNow(false)});
  window.addEventListener("offline",updateStatus);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&state.initialized&&linked()&&navigator.onLine)syncNow(false)});
  window.addEventListener("focus",()=>{if(state.initialized&&linked()&&navigator.onLine)syncNow(false)});
  setInterval(()=>{if(state.initialized&&linked()&&navigator.onLine&&!document.hidden)syncNow(false)},SYNC_INTERVAL_MS);

  window.RWRecordSync={
    getState:()=>cloneData(state),syncNow,checkServer,connect,disconnect,showConnectForm,showSyncDetails,bootstrapThisDevice,adoptServerData,
    refreshStatus:updateStatus
  };
  // Zgodność z dotychczasowym kodem/UI.
  window.RWOfflineSync={getState:()=>cloneData(state),getStatus:()=>({online:navigator.onLine,configured:linked(),pending:state.pendingOps.length,lastSyncAt:state.lastSyncAt,lastSyncError:state.lastError}),syncNow,refreshStatus:updateStatus};
  setTimeout(updateStatus,0);
})();
