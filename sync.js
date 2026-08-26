/* =========================================================
   sync.js — Rozliczenia Warsztatów v11.6
   Fundament offline-first i kolejki synchronizacji.

   Wersja 11.6 NIE wysyła danych do serwera, dopóki nie zostanie
   skonfigurowany endpoint. Wszystkie zmiany są zapisywane lokalnie,
   otrzymują numer rewizji i pozostają jako oczekujące do synchronizacji.
   ========================================================= */
"use strict";

(function(){
  const STATE_KEY="rw_sync_state_v1";
  const ENDPOINT_KEY="rw_sync_endpoint_v1";
  const DATA_KEY="rw45";
  const MAX_EVENT_LOG=80;

  function isoNow(){
    return new Date().toISOString();
  }

  function randomId(){
    if(globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return "dev-"+Date.now()+"-"+Math.random().toString(36).slice(2);
  }

  function loadState(){
    let state=null;
    try{
      state=JSON.parse(localStorage.getItem(STATE_KEY)||"null");
    }catch(e){}

    if(!state || typeof state!=="object"){
      const hasExistingData=!!localStorage.getItem(DATA_KEY);
      state={
        version:1,
        deviceId:randomId(),
        localRevision:hasExistingData?1:0,
        syncedRevision:0,
        pendingSince:hasExistingData?isoNow():null,
        lastLocalSaveAt:hasExistingData?isoNow():null,
        lastSyncAt:null,
        lastSyncError:null,
        events:hasExistingData?[{
          revision:1,
          at:isoNow(),
          type:"initial-snapshot"
        }]:[]
      };
      persistState(state);
    }

    state.events=Array.isArray(state.events)?state.events:[];
    state.localRevision=Number(state.localRevision||0);
    state.syncedRevision=Number(state.syncedRevision||0);
    return state;
  }

  function persistState(state){
    try{
      localStorage.setItem(STATE_KEY,JSON.stringify(state));
    }catch(e){
      console.warn("Nie udało się zapisać stanu synchronizacji",e);
    }
  }

  let state=loadState();
  let syncing=false;
  let suppressNextRevision=false;

  function endpoint(){
    return String(localStorage.getItem(ENDPOINT_KEY)||"").trim();
  }

  function pendingCount(){
    return Math.max(0,state.localRevision-state.syncedRevision);
  }

  function isConfigured(){
    return !!endpoint();
  }

  function recordEvent(type="save"){
    state.localRevision+=1;
    state.lastLocalSaveAt=isoNow();
    state.lastSyncError=null;
    if(!state.pendingSince) state.pendingSince=state.lastLocalSaveAt;

    state.events.push({
      revision:state.localRevision,
      at:state.lastLocalSaveAt,
      type
    });
    if(state.events.length>MAX_EVENT_LOG){
      state.events=state.events.slice(-MAX_EVENT_LOG);
    }

    persistState(state);
    updateSyncStatus();
  }

  function statusDescriptor(){
    const pending=pendingCount();

    if(!navigator.onLine){
      return {
        cls:"offline",
        short:"🔴 Offline",
        detail:pending
          ? `Offline • ${pending} zmian oczekuje`
          : "Offline • dane zapisują się lokalnie"
      };
    }

    if(syncing){
      return {cls:"syncing",short:"🔵 Synchronizacja…",detail:"Wysyłanie zmian na serwer"};
    }

    if(!isConfigured()){
      return {
        cls:pending?"pending":"local",
        short:pending?`🟠 ${pending} oczekuje`:"🟡 Tryb lokalny",
        detail:pending
          ? `${pending} zmian czeka na podłączenie serwera`
          : "Serwer synchronizacji jeszcze nie jest podłączony"
      };
    }

    if(state.lastSyncError){
      return {
        cls:"error",
        short:`🟠 ${pending} oczekuje`,
        detail:"Nie udało się zsynchronizować • dane są bezpieczne lokalnie"
      };
    }

    if(pending){
      return {
        cls:"pending",
        short:`🟠 ${pending} oczekuje`,
        detail:`${pending} zmian oczekuje na synchronizację`
      };
    }

    return {
      cls:"synced",
      short:"🟢 Zsynchronizowano",
      detail:state.lastSyncAt
        ? `Ostatnia synchronizacja: ${new Date(state.lastSyncAt).toLocaleString("pl-PL")}`
        : "Dane zsynchronizowane"
    };
  }

  function ensureStatusElement(){
    let el=document.getElementById("syncStatus");
    if(el) return el;

    const host=document.querySelector(".appHeaderText");
    if(!host) return null;

    el=document.createElement("button");
    el.id="syncStatus";
    el.type="button";
    el.className="syncStatus";
    el.addEventListener("click",showSyncDetails);
    host.appendChild(el);
    return el;
  }

  function updateSyncStatus(){
    const el=ensureStatusElement();
    if(!el) return;

    const d=statusDescriptor();
    el.className=`syncStatus ${d.cls}`;
    el.textContent=d.short;
    el.title=d.detail;
  }

  function showSyncDetails(){
    const d=statusDescriptor();
    const pending=pendingCount();
    const configured=isConfigured();

    const html=`<h2>Synchronizacja danych</h2>
      <div class="syncStateCard ${d.cls}">
        <b>${d.short}</b>
        <span>${d.detail}</span>
      </div>

      <div class="syncDetailsGrid">
        <div><span>Zmiany lokalne</span><b>${state.localRevision}</b></div>
        <div><span>Zsynchronizowane</span><b>${state.syncedRevision}</b></div>
        <div><span>Oczekuje</span><b>${pending}</b></div>
      </div>

      <div class="notice">
        ${configured
          ? "Serwer synchronizacji jest skonfigurowany. Przy odzyskaniu internetu aplikacja spróbuje wysłać oczekujące zmiany automatycznie."
          : "Tryb przygotowawczy. Serwer zostanie podłączony później. Do tego czasu wszystkie dane i zmiany pozostają bezpiecznie zapisane na tym urządzeniu."}
      </div>

      ${state.lastLocalSaveAt?`<div class="muted syncMeta">Ostatni zapis lokalny: ${new Date(state.lastLocalSaveAt).toLocaleString("pl-PL")}</div>`:""}
      ${state.lastSyncError?`<div class="syncError">Ostatni błąd synchronizacji: ${escapeSyncHtml(state.lastSyncError)}</div>`:""}

      <div class="actions">
        <button class="soft" onclick="closeModal()">Zamknij</button>
        <button class="primary" onclick="RWOfflineSync.syncNow(true)" ${configured&&navigator.onLine?"":"disabled"}>
          Synchronizuj teraz
        </button>
      </div>`;

    if(typeof modal==="function") modal(html);
  }

  function escapeSyncHtml(s){
    return String(s??"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  async function syncNow(manual=false){
    const url=endpoint();

    if(!url){
      if(manual && typeof showToast==="function"){
        showToast("Serwer synchronizacji nie jest jeszcze podłączony");
      }
      updateSyncStatus();
      return {ok:false,reason:"not-configured"};
    }

    if(!navigator.onLine){
      if(manual && typeof showToast==="function"){
        showToast("Brak internetu • zmiany pozostają zapisane lokalnie");
      }
      updateSyncStatus();
      return {ok:false,reason:"offline"};
    }

    if(syncing) return {ok:false,reason:"already-syncing"};

    syncing=true;
    state.lastSyncError=null;
    persistState(state);
    updateSyncStatus();

    try{
      const snapshot=JSON.parse(localStorage.getItem(DATA_KEY)||"{}");
      const sendingRevision=state.localRevision;

      const response=await fetch(url,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          protocol:1,
          deviceId:state.deviceId,
          localRevision:sendingRevision,
          lastSyncedRevision:state.syncedRevision,
          sentAt:isoNow(),
          data:snapshot
        })
      });

      if(!response.ok){
        throw new Error(`HTTP ${response.status}`);
      }

      const result=await response.json().catch(()=>({ok:true}));
      if(result && result.ok===false){
        throw new Error(result.error||"Serwer odrzucił synchronizację");
      }

      /*
        Backend, który podłączymy później, może zwrócić scalone dane:
        { ok:true, data:{...} }
        Wtedy aktualizujemy lokalny stan bez tworzenia nowej rewizji.
      */
      if(result?.data && typeof result.data==="object"){
        suppressNextRevision=true;
        data=result.data;
        localStorage.setItem(DATA_KEY,JSON.stringify(data));
        suppressNextRevision=false;

        if(typeof render==="function") render();
      }

      state.syncedRevision=Math.max(state.syncedRevision,sendingRevision);
      state.lastSyncAt=isoNow();
      state.lastSyncError=null;
      state.pendingSince=pendingCount()?state.pendingSince:null;
      state.events=state.events.filter(e=>Number(e.revision)>state.syncedRevision);
      persistState(state);

      if(manual && typeof showToast==="function"){
        showToast("Synchronizacja zakończona");
      }

      return {ok:true};
    }catch(err){
      state.lastSyncError=String(err?.message||err||"Błąd synchronizacji");
      persistState(state);

      if(manual && typeof showToast==="function"){
        showToast("Synchronizacja nieudana • dane zostały lokalnie");
      }

      return {ok:false,reason:"error",error:state.lastSyncError};
    }finally{
      syncing=false;
      updateSyncStatus();
    }
  }

  function configureEndpoint(url){
    const value=String(url||"").trim();

    if(value){
      localStorage.setItem(ENDPOINT_KEY,value);
    }else{
      localStorage.removeItem(ENDPOINT_KEY);
    }

    updateSyncStatus();
    if(value && navigator.onLine) syncNow(false);
  }

  function markSynced(revision=state.localRevision){
    state.syncedRevision=Math.min(state.localRevision,Number(revision||0));
    state.lastSyncAt=isoNow();
    state.lastSyncError=null;
    if(!pendingCount()) state.pendingSince=null;
    state.events=state.events.filter(e=>Number(e.revision)>state.syncedRevision);
    persistState(state);
    updateSyncStatus();
  }

  /*
    Przechwytujemy centralny save(), więc nie trzeba dodawać kodu synchronizacji
    osobno do każdej funkcji płatności, dziecka, obecności itd.
  */
  const originalSave=window.save;
  if(typeof originalSave==="function"){
    window.save=function(){
      originalSave();
      if(suppressNextRevision){
        suppressNextRevision=false;
        return;
      }
      recordEvent("save");
      if(isConfigured() && navigator.onLine){
        queueMicrotask(()=>syncNow(false));
      }
    };
  }

  window.addEventListener("online",()=>{
    updateSyncStatus();
    if(isConfigured()) syncNow(false);
  });

  window.addEventListener("offline",updateSyncStatus);

  window.RWOfflineSync={
    getState:()=>JSON.parse(JSON.stringify(state)),
    getStatus:()=>({
      online:navigator.onLine,
      configured:isConfigured(),
      endpoint:endpoint(),
      pending:pendingCount(),
      localRevision:state.localRevision,
      syncedRevision:state.syncedRevision,
      lastLocalSaveAt:state.lastLocalSaveAt,
      lastSyncAt:state.lastSyncAt,
      lastSyncError:state.lastSyncError
    }),
    configureEndpoint,
    syncNow,
    markSynced,
    refreshStatus:updateSyncStatus
  };

  const css=document.createElement("style");
  css.textContent=`
  .syncStatus{
    display:inline-flex;
    align-items:center;
    width:max-content;
    margin-top:6px;
    padding:5px 9px;
    border:0;
    border-radius:999px;
    font-size:11px;
    line-height:1;
    font-weight:900;
    cursor:pointer;
  }
  .syncStatus.local{background:#fff5d9;color:#856400}
  .syncStatus.pending{background:#fff0d9;color:#9a5b00}
  .syncStatus.offline{background:#fde9ec;color:#b1283d}
  .syncStatus.syncing{background:#e7f2fb;color:#176796}
  .syncStatus.synced{background:#e7f8f1;color:#11745d}
  .syncStatus.error{background:#fff0d9;color:#9a5b00}
  .syncStateCard{
    padding:14px;
    border-radius:16px;
    margin-bottom:14px;
    background:#f4f7f9;
  }
  .syncStateCard b,.syncStateCard span{display:block}
  .syncStateCard span{margin-top:5px;color:#65717b;font-size:13px;font-weight:700}
  .syncDetailsGrid{
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:8px;
    margin:12px 0;
  }
  .syncDetailsGrid>div{
    padding:11px 8px;
    border-radius:14px;
    background:#f5f8fa;
    text-align:center;
  }
  .syncDetailsGrid span,.syncDetailsGrid b{display:block}
  .syncDetailsGrid span{font-size:11px;color:#77818b;font-weight:800}
  .syncDetailsGrid b{margin-top:4px;font-size:19px;color:#17324b}
  .syncMeta{margin:12px 0}
  .syncError{
    margin:10px 0;
    padding:10px 12px;
    border-radius:12px;
    background:#fde9ec;
    color:#b1283d;
    font-size:13px;
    font-weight:800;
  }
  @media(max-width:420px){
    .syncDetailsGrid{grid-template-columns:1fr 1fr 1fr}
    .syncStatus{font-size:10px}
  }`;
  document.head.appendChild(css);

  setTimeout(updateSyncStatus,0);
})();