/* =========================================================
   Rozliczenia Warsztatów — wersja 8.9
   25.08.2026

   Zmiany:
   1. Szybka wpłata ze Start.
   2. "Wszyscy obecni" w obecności.
   3. Wyróżnienie aktualnej / zaraz rozpoczynającej się grupy.
   4. Zapamiętywanie ostatnich filtrów w Grupach
      oraz ostatniego miesiąca w szybkiej wpłacie.
   ========================================================= */

(function(){
  "use strict";

  const RW89_GROUP_KEY = "rw89_group_filters";
  const RW89_QUICKPAY_KEY = "rw89_quickpay";

  function esc89(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function todayISO89(){
    const d=new Date();
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const day=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }

  function currentMonth89(){
    if(typeof currentMonthName==="function") return currentMonthName();
    const names=["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
    return names[new Date().getMonth()];
  }

  function activeChildren89(){
    return (data.children||[]).filter(c=>typeof childActiveNow==="function" ? childActiveNow(c) : true);
  }

  /* ---------- 8.9 / SZYBKA WPŁATA ---------- */

  window.openQuickPayment89 = function(){
    const children=activeChildren89().slice().sort((a,b)=>
      `${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`,"pl")
    );
    if(!children.length){
      if(typeof showToast==="function") showToast("Brak aktywnych dzieci");
      return;
    }

    let prefs={};
    try{prefs=JSON.parse(localStorage.getItem(RW89_QUICKPAY_KEY)||"{}")}catch(e){}
    const month=(months||[]).includes(prefs.month)?prefs.month:currentMonth89();
    const preferredChild=children.some(c=>String(c.id)===String(prefs.childId))?String(prefs.childId):String(children[0].id);

    modal(`<div class="quickPaymentBox">
      <h2>⚡ Szybka wpłata</h2>
      <div class="muted">Wybierz dziecko. Kwota ustawi się automatycznie na brakującą należność.</div>

      <label>Dziecko</label>
      <select id="qpayChild89" onchange="refreshQuickPayment89()">
        ${children.map(c=>`<option value="${c.id}" ${String(c.id)===preferredChild?"selected":""}>${esc89(c.last)} ${esc89(c.first)} • ${esc89(c.school||"")}</option>`).join("")}
      </select>

      <label>Miesiąc</label>
      <select id="qpayMonth89" onchange="refreshQuickPayment89()">
        ${(months||[]).map(m=>`<option ${m===month?"selected":""}>${m}</option>`).join("")}
      </select>

      <div id="qpaySummary89"></div>

      <label>Kwota wpłaty</label>
      <input id="qpayAmount89" type="number" min="0" step="0.01" inputmode="decimal">

      <label>Data</label>
      <input id="qpayDate89" type="date" value="${todayISO89()}">

      <div class="actions">
        <button class="soft" onclick="closeModal()">Anuluj</button>
        <button class="primary" onclick="saveQuickPayment89()">Zapisz wpłatę</button>
      </div>
    </div>`);
    refreshQuickPayment89(true);
  };

  window.refreshQuickPayment89 = function(forceAmount){
    const cid=Number(document.getElementById("qpayChild89")?.value||0);
    const month=document.getElementById("qpayMonth89")?.value||currentMonth89();
    const ch=(data.children||[]).find(c=>Number(c.id)===cid);
    if(!ch)return;

    let ps;
    try{
      ps=paymentState(ch,month);
    }catch(e){
      const due=typeof childDue==="function"?childDue(ch):0;
      const paid=typeof childPaymentsForMonth==="function"?childPaymentsForMonth(ch,month):0;
      ps={due,paid,missing:Math.max(0,due-paid),kind:paid>=due?"paid":"unpaid"};
    }

    const summary=document.getElementById("qpaySummary89");
    if(summary){
      summary.innerHTML=`<div class="quickPaymentSummary">
        <div><span>Należne</span><b>${money(ps.due||0)}</b></div>
        <div><span>Wpłacono</span><b>${money(ps.paid||0)}</b></div>
        <div class="quickPaymentMissing"><span>Brakuje</span><b>${money(ps.missing||0)}</b></div>
      </div>`;
    }

    const amount=document.getElementById("qpayAmount89");
    if(amount && (forceAmount || !amount.dataset.userChanged)){
      amount.value=Number(ps.missing||0).toFixed(2);
    }
    if(amount && !amount.dataset.bound89){
      amount.dataset.bound89="1";
      amount.addEventListener("input",()=>amount.dataset.userChanged="1");
    }

    localStorage.setItem(RW89_QUICKPAY_KEY,JSON.stringify({childId:cid,month}));
  };

  window.saveQuickPayment89 = function(){
    const cid=Number(document.getElementById("qpayChild89")?.value||0);
    const month=document.getElementById("qpayMonth89")?.value||currentMonth89();
    const amount=Number(String(document.getElementById("qpayAmount89")?.value||"0").replace(",","."));
    const date=document.getElementById("qpayDate89")?.value||todayISO89();
    const ch=(data.children||[]).find(c=>Number(c.id)===cid);

    if(!ch){
      if(typeof showToast==="function")showToast("Wybierz dziecko");
      return;
    }
    if(!(amount>0)){
      if(typeof showToast==="function")showToast("Podaj kwotę większą od 0");
      return;
    }

    let handledFamily=false;
    try{
      if(typeof familyChildren==="function" && typeof distributeFamilyPayment==="function"){
        const fam=familyChildren(ch).filter(c=>typeof childActiveNow==="function"?childActiveNow(c):true);
        if(fam.length>1){
          const result=distributeFamilyPayment(ch,month,amount,date,"Szybka wpłata");
          handledFamily=!!result;
        }
      }
    }catch(e){}

    if(!handledFamily){
      data.payments.push({
        id:Date.now(),
        childId:ch.id,
        child:`${ch.last} ${ch.first}`,
        month,
        amount,
        date,
        note:"Szybka wpłata"
      });
      if(typeof logHistory==="function"){
        logHistory(ch.id,`Dodano szybką wpłatę ${money(amount)} za ${month}.`);
      }
    }

    localStorage.setItem(RW89_QUICKPAY_KEY,JSON.stringify({childId:cid,month}));
    save();
    closeModal();
    render();
    if(typeof showToast==="function")showToast("Wpłata zapisana");
  };

  /* ---------- 8.9 / OBECNOŚĆ ---------- */

  window.markAllPresent89 = function(key){
    const arr=selectedGroupRows();
    data.attendance[key]=data.attendance[key]||{};
    arr.forEach(({c})=>data.attendance[key][c.id]="present");
    showAttendance();
  };

  // attendance-fix.js jest ładowany wcześniej. Nadpisujemy tylko jego okno,
  // zachowując poprawny powrót na Start / Grupy.
  window.showAttendance = function(){
    const arr=selectedGroupRows();
    if(!arr.length)return;

    if(typeof attendanceReturnPage!=="undefined" && !attendanceReturnPage){
      attendanceReturnPage=page||"groups";
    }

    const key=attendanceKey();
    const saved=data.attendance[key]||{};

    modal(`<h2>Obecność — ${esc89(gSchool.value)}</h2>
      <div class="muted">${esc89(gDay.value)} ${esc89(gTime.value)}</div>
      <div class="attendanceModalDate">${new Intl.DateTimeFormat("pl-PL",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(new Date())}</div>

      <div class="attendanceBulkBar">
        <button class="primary" onclick="markAllPresent89('${key}')">✓ Wszyscy obecni</button>
      </div>

      ${arr.map(({c})=>`<div class="attendanceRow">
        <div><b>${esc89(c.last)} ${esc89(c.first)}</b><small>${esc89(c.class||"")} • ${esc89(c.pickupPlace||"")}</small></div>
        <div class="attendanceBtns">
          <button class="${saved[c.id]==="present"?"attActive presentBtn":"soft"}"
            onclick="setAttendance('${key}',${c.id},'present',this)">Obecny</button>
          <button class="${saved[c.id]==="absent"?"attActive absentBtn":"soft"}"
            onclick="setAttendance('${key}',${c.id},'absent',this)">Nieobecny</button>
        </div>
      </div>`).join("")}

      <div class="actions">
        <button class="primary" onclick="finishAttendance(true)">Zapisz obecność</button>
        <button class="soft" onclick="finishAttendance(false)">Zamknij</button>
      </div>`);
  };

  /* ---------- 8.9 / AKTUALNA GRUPA NA START ---------- */

  function timeMinutes89(t){
    const m=String(t||"").match(/^(\d{1,2}):(\d{2})$/);
    return m?Number(m[1])*60+Number(m[2]):null;
  }

  function currentClassCandidate89(){
    const day=typeof todayDayName==="function"?todayDayName():["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"][new Date().getDay()];
    const map={};

    activeChildren89().forEach(c=>{
      (c.classes||[]).forEach(cl=>{
        if(cl.waitlist || cl.day!==day)return;
        const tm=timeMinutes89(cl.time);
        if(tm===null)return;
        const key=[cl.school||c.school||"",cl.type||"",cl.day||"",cl.time||""].join("|");
        if(!map[key])map[key]={school:cl.school||c.school||"",type:cl.type||"",day:cl.day||"",time:cl.time||"",children:[]};
        if(!map[key].children.some(x=>Number(x.id)===Number(c.id)))map[key].children.push(c);
      });
    });

    const now=new Date();
    const n=now.getHours()*60+now.getMinutes();
    const candidates=Object.values(map).map(g=>({...g,diff:timeMinutes89(g.time)-n}))
      .filter(g=>g.diff>=-90 && g.diff<=60)
      .sort((a,b)=>Math.abs(a.diff)-Math.abs(b.diff));

    return candidates[0]||null;
  }

  function currentClassLabel89(diff){
    if(diff>15)return `Za ${diff} min`;
    if(diff>0)return `Zaraz • za ${diff} min`;
    if(diff===0)return "Teraz";
    const ago=Math.abs(diff);
    if(ago<=15)return `Teraz • rozpoczęte ${ago} min temu`;
    return `Trwające / ostatnie • ${ago} min temu`;
  }

  function injectStart89(){
    if(page!=="start" || !app)return;

    // Szybka wpłata
    if(!document.getElementById("quickPaymentStart89")){
      const anchor=app.querySelector(".dashboardTop")||app.firstElementChild;
      if(anchor){
        anchor.insertAdjacentHTML("afterend",
          `<button id="quickPaymentStart89" class="primary quickPaymentStart" onclick="openQuickPayment89()">⚡ Szybka wpłata</button>`
        );
      }
    }

    // Aktualna / zaraz rozpoczynająca się grupa
    document.getElementById("currentClassNow89")?.remove();
    const g=currentClassCandidate89();
    if(g){
      const btn=document.getElementById("quickPaymentStart89");
      const html=`<div id="currentClassNow89" class="card currentClassNow">
        <span class="currentClassLabel">${currentClassLabel89(g.diff)}</span>
        <h3>${esc89(g.school)} • ${esc89(g.type)}</h3>
        <p>${esc89(g.day)} ${esc89(g.time)} • ${g.children.length} ${g.children.length===1?"dziecko":"dzieci"}</p>
        <button class="primary" onclick="openAttendanceForGroup('${String(g.school).replaceAll("'","\\'")}','${String(g.type).replaceAll("'","\\'")}','${String(g.day).replaceAll("'","\\'")}','${String(g.time).replaceAll("'","\\'")}')">Sprawdź obecność</button>
      </div>`;
      if(btn)btn.insertAdjacentHTML("afterend",html);
      else app.insertAdjacentHTML("afterbegin",html);
    }
  }

  /* ---------- 8.9 / ZAPAMIĘTYWANIE GRUP ---------- */

  function readGroupPrefs89(){
    try{return JSON.parse(localStorage.getItem(RW89_GROUP_KEY)||"{}")}catch(e){return {}}
  }
  function saveGroupPrefs89(){
    const prefs={
      school:document.getElementById("gSchool")?.value||"",
      workshop:document.getElementById("gWorkshop")?.value||"",
      day:document.getElementById("gDay")?.value||"",
      time:document.getElementById("gTime")?.value||""
    };
    localStorage.setItem(RW89_GROUP_KEY,JSON.stringify(prefs));
  }

  function bindGroupMemory89(){
    ["gSchool","gWorkshop","gDay","gTime"].forEach(id=>{
      const el=document.getElementById(id);
      if(el && !el.dataset.memory89){
        el.dataset.memory89="1";
        el.addEventListener("change",()=>setTimeout(saveGroupPrefs89,0));
      }
    });
  }

  function restoreGroupPrefs89(){
    const p=readGroupPrefs89();
    const s=document.getElementById("gSchool");
    const w=document.getElementById("gWorkshop");
    const d=document.getElementById("gDay");
    const t=document.getElementById("gTime");
    if(!s)return;

    if(p.school && [...s.options].some(o=>o.value===p.school))s.value=p.school;
    try{updateScheduleSelects("gSchool","gDay","gTime")}catch(e){}

    if(w && p.workshop && [...w.options].some(o=>o.value===p.workshop))w.value=p.workshop;
    if(d && p.day && [...d.options].some(o=>o.value===p.day))d.value=p.day;
    try{updateTimeSelect("gSchool","gDay","gTime")}catch(e){}
    if(t && p.time && [...t.options].some(o=>o.value===p.time))t.value=p.time;

    try{groupList()}catch(e){}
    bindGroupMemory89();

    const card=s.closest(".card");
    if(card && !card.querySelector(".rememberHint")){
      card.insertAdjacentHTML("beforeend",`<div class="rememberHint">✓ Aplikacja zapamiętuje ostatnią szkołę, warsztaty, dzień i godzinę.</div>`);
    }
  }

  const originalGroups89=window.groups;
  if(typeof originalGroups89==="function"){
    window.groups=function(){
      originalGroups89();
      setTimeout(restoreGroupPrefs89,0);
    };
  }

  // Owijamy Start, nie zmieniając jego istniejącej zawartości.
  const originalStart89=window.start;
  if(typeof originalStart89==="function"){
    window.start=function(){
      originalStart89();
      injectStart89();
    };
  }

  // Jeśli skrypt załadował się już na Start, odśwież dodatki.
  setTimeout(()=>{
    if(page==="start")injectStart89();
    if(page==="groups"){restoreGroupPrefs89();}
  },0);

})();