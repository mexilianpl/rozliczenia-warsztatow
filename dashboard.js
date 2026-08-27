/* =========================================================
   dashboard.js — Rozliczenia Warsztatów v11.5
   Pełny moduł Start/dashboard.
   Scalono dashboard-base.js i część legacy-workflows.js.
   ========================================================= */
"use strict";

function schoolYearMonthYear(monthName){
 const m=String(data.currentSchoolYear||"").match(/(\d{4}).*?(\d{4})/);
 const a=m?Number(m[1]):new Date().getFullYear(),b=m?Number(m[2]):a+1;
 return ["Wrzesień","Październik","Listopad","Grudzień"].includes(monthName)?a:b;
}
function paymentAmountForMonthYear(ch,monthName,year){
 return data.payments.filter(p=>{
   if(Number(p.childId)!==Number(ch.id)||p.month!==monthName)return false;
   if(!p.date)return true;
   const d=new Date(p.date+"T12:00:00");
   return !Number.isNaN(d.getTime())&&d.getFullYear()===Number(year);
 }).reduce((s,p)=>s+Number(p.amount||0),0);
}

function financeMonthRelation(month,year){
 const mi=monthIndexPL(month),now=new Date();
 const target=new Date(year,mi,1,12),cur=new Date(now.getFullYear(),now.getMonth(),1,12);
 return target>cur?"future":target<cur?"past":"current";
}

function childFinanceRows(ch){
 return months.map(month=>{
   const year=schoolYearMonthYear(month);
   const due=childDueForMonth(ch,month,year);
   const paid=paymentAmountForMonthYear(ch,month,year);
   const missing=Math.max(0,due-paid),extra=Math.max(0,paid-due);
   const mi=monthIndexPL(month), monthEnd=new Date(year,mi+1,0,12);
   const starts=(ch.classes||[]).map(cl=>cl.startDate||ch.startDate||"").filter(Boolean)
     .map(v=>new Date(String(v).slice(0,10)+"T12:00:00")).filter(d=>!Number.isNaN(d.getTime()));
   const firstStart=starts.length?new Date(Math.min(...starts.map(d=>d.getTime()))):null;
   const before=firstStart&&monthEnd<firstStart;
   const relation=financeMonthRelation(month,year); const kind=before?"before":relation==="future"?"future":due<=0?"free":paid<=0?"unpaid":paid<due?"partial":paid>due?"overpaid":"paid";
   return {month,year,due,paid,missing,extra,kind};
 });
}
function monthIndexPL(name){
 const names=["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
 return names.indexOf(name);
}
function datesForWeekdayInMonth(year,monthIndex,dayName){
 const wanted=dayIndex(dayName),out=[];
 if(wanted===99)return out;
 const d=new Date(year,monthIndex,1,12);
 while(d.getMonth()===monthIndex){
   if(d.getDay()===wanted)out.push(new Date(d));
   d.setDate(d.getDate()+1);
 }
 return out;
}
function classDueForMonth(ch,cl,monthName,year){
 if(cl.status==="bezplatne")return 0;
 if(typeof childActiveNow==="function"&&!childActiveNow(ch))return 0;
 const mi=monthIndexPL(monthName);
 if(mi<0)return dueClass(cl);
 const full=dueClass(cl),startRaw=cl.startDate||ch.startDate||"",endRaw=cl.endDate||ch.endDate||"";
 const start=startRaw?new Date(startRaw+"T12:00:00"):null,end=endRaw?new Date(endRaw+"T12:00:00"):null;
 const first=new Date(year,mi,1,12),last=new Date(year,mi+1,0,12);
 if(start&&start>last)return 0;
 if(end&&end<first)return 0;
 if(start&&start.getFullYear()===year&&start.getMonth()===mi){
   if(cl.firstMonthOverride!==undefined && cl.firstMonthOverride!==null && cl.firstMonthOverride!=="")return Math.max(0,Number(cl.firstMonthOverride)||0);
   const all=datesForWeekdayInMonth(year,mi,cl.day);
   if(!all.length)return full;
   const left=all.filter(d=>d>=start&&(!end||d<=end)).length;
   return left>0?full*(left/all.length):0;
 }
 return full;
}
function childDueForMonth(ch,monthName,year){
 return (ch.classes||[]).reduce((s,cl)=>s+classDueForMonth(ch,cl,monthName,year),0);
}

function currentMonthName(){
 const names=["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
 return names[new Date().getMonth()];
}
function taskCounts(){
 const period=currentDashboardPeriod();
 const activeSchoolMonth=months.includes(period.month);
 let unpaid=0,partial=0,noConsent=0;
 data.children.forEach(c=>{
   if(activeSchoolMonth){
     const paid=data.payments.filter(p=>Number(p.childId)===Number(c.id)&&paymentBelongsToDashboardMonth(p,period))
       .reduce((s,p)=>s+Number(p.amount||0),0);
     const due=childDue(c);
     if(due>0&&paid<=0)unpaid++;
     else if(due>0&&paid<due)partial++;
   }
   if(consentLabel(c.consents?.image)==="")noConsent++;
 });
 return {unpaid,partial,noConsent};
}
function dayIndex(name){
 return {"Niedziela":0,"Poniedziałek":1,"Wtorek":2,"Środa":3,"Czwartek":4,"Piątek":5,"Sobota":6}[name]??99;
}
function nextClassDayInfo(){
 const today=new Date(),td=today.getDay(),entries=[];
 data.children.forEach(c=>(c.classes||[]).forEach(cl=>{
   const di=dayIndex(cl.day);if(di===99)return;
   entries.push({delta:(di-td+7)%7,cl,c});
 }));
 if(!entries.length)return {delta:null,items:[]};
 const min=Math.min(...entries.map(x=>x.delta));
 return {delta:min,items:entries.filter(x=>x.delta===min)};
}

function formatNextClassDate(delta){
 if(delta===null || delta===undefined)return "";
 const d=new Date();
 d.setHours(12,0,0,0);
 d.setDate(d.getDate()+Number(delta||0));
 return new Intl.DateTimeFormat("pl-PL",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(d);
}
function classesGroupedForDay(items){
 const map={};
 items.forEach(({c,cl})=>{
   const key=[cl.school,cl.type,cl.day,cl.time].join("|");
   if(!map[key])map[key]={school:cl.school,type:cl.type,day:cl.day,time:cl.time,children:[]};
   if(!map[key].children.some(x=>x.id===c.id))map[key].children.push(c);
 });
 return Object.values(map).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
}
function goToGroup(school,day,time,type=""){
 page="groups";render();
 setTimeout(()=>{
   const s=document.querySelector("#gSchool"),d=document.querySelector("#gDay"),t=document.querySelector("#gTime");
   if(s)s.value=school;if(d)d.value=day;if(t)t.value=time;
   if(typeof groupList==="function")groupList();
 },0);
}
function currentDashboardPeriod(){
 const now=new Date();
 return {month:currentMonthName(),year:now.getFullYear(),monthNumber:now.getMonth()+1};
}
function paymentBelongsToDashboardMonth(p,period){
 const ym=paymentYearMonth(p);
 if(ym.year && ym.year!==period.year)return false;
 if(ym.month && ym.month!==period.monthNumber)return false;
 // Dla starszych wpisów bez roku używamy nazwy miesiąca.
 if(!ym.year && String(p.month||"")!==period.month)return false;
 return true;
}
function incomeBelongsToDashboardMonth(i,period){
 const ym=incomeYearMonth(i);
 return ym.year===period.year && ym.month===period.monthNumber;
}

/* ===== PODSUMOWANIA MIESIĘCZNE ===== */
function currentMonthDashboard(){
 const period=currentDashboardPeriod();
 const activeSchoolMonth=months.includes(period.month);
 const due=activeSchoolMonth?data.children.reduce((s,c)=>s+childDueForMonth(c,period.month,period.year),0):0;
 const childPaid=data.payments.filter(p=>paymentBelongsToDashboardMonth(p,period)).reduce((s,p)=>s+Number(p.amount||0),0);
 const extra=data.income.filter(i=>incomeBelongsToDashboardMonth(i,period)).reduce((s,i)=>s+Number(i.amount||0),0);
 const missing=Math.max(0,due-childPaid);
 let missingPeople=0,partialPeople=0;
 if(activeSchoolMonth){
   data.children.forEach(c=>{
     if(typeof childActiveNow==="function"&&!childActiveNow(c))return;
     const d=childDueForMonth(c,period.month,period.year); if(d<=0)return;
     const p=data.payments.filter(x=>Number(x.childId)===Number(c.id)&&paymentBelongsToDashboardMonth(x,period)).reduce((s,x)=>s+Number(x.amount||0),0);
     if(p<d)missingPeople++;
     if(p>0&&p<d)partialPeople++;
   });
 }
 const schoolStats={};
 (data.settings?.schools||schools).forEach(s=>schoolStats[s]={total:0,girls:0,boys:0});
 data.children.forEach(c=>{
   if(typeof childActiveNow==="function"&&!childActiveNow(c))return;
   const s=c.school||c.classes?.[0]?.school||"";
   schoolStats[s]=schoolStats[s]||{total:0,girls:0,boys:0}; schoolStats[s].total++;
   if(c.sex==="Dziewczynka")schoolStats[s].girls++; else if(c.sex==="Chłopiec")schoolStats[s].boys++;
 });
 return {period,due,childPaid,extra,total:childPaid+extra,missing,missingPeople,partialPeople,schoolStats,activeSchoolMonth};
}

function todayDayName(){
 return ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"][new Date().getDay()];
}
function todayClassForChild(c){
 const day=todayDayName();
 return (c.classes||[]).find(cl=>cl.day===day&&!cl.waitlist&&cl.status!=="bezplatne")||
        (c.classes||[]).find(cl=>cl.day===day&&!cl.waitlist);
}
function groupAttendanceState(g){
 const key=`${new Date().toISOString().slice(0,10)}|${g.school}|${g.day}|${g.time}`;
 const saved=data.attendance[key]||{};
 const ids=(g.children||[]).map(c=>String(c.id));
 const done=ids.length>0&&ids.every(id=>saved[id]==="present"||saved[id]==="absent");
 return {key,done,count:ids.filter(id=>saved[id]==="present"||saved[id]==="absent").length,total:ids.length};
}
function openAttendanceForGroup(school,type,day,time){
 page="groups";render();
 setTimeout(()=>{
   const s=document.getElementById("gSchool"),w=document.getElementById("gWorkshop"),d=document.getElementById("gDay"),t=document.getElementById("gTime");
   if(s)s.value=school;
   updateScheduleSelects("gSchool","gDay","gTime");
   if(w)w.value=type||"";
   if(d&&[...d.options].some(o=>o.value===day))d.value=day;
   updateTimeSelect("gSchool","gDay","gTime");
   if(t&&[...t.options].some(o=>o.value===time))t.value=time;
   groupList();
   showAttendance();
 },0);
}
function quickAttendanceForChild(cid){
 const c=data.children.find(x=>Number(x.id)===Number(cid));if(!c)return;
 const cl=todayClassForChild(c);
 if(!cl){showToast("Dziś dziecko nie ma zajęć");return}
 openAttendanceForGroup(cl.school,cl.type,cl.day,cl.time);
}


function attentionSummary(){
 const period=currentDashboardPeriod();
 let unpaid=[],partial=[],missingPhone=[];
 data.children.forEach(c=>{
   if(typeof childActiveNow==="function"&&!childActiveNow(c))return;
   if(!String(c.phone||"").trim())missingPhone.push(c);
   if(!months.includes(period.month))return;
   const due=childDueForMonth(c,period.month,period.year);
   if(due<=0)return;
   const paid=data.payments.filter(p=>Number(p.childId)===Number(c.id)&&paymentBelongsToDashboardMonth(p,period))
     .reduce((s,p)=>s+Number(p.amount||0),0);
   if(paid<=0)unpaid.push({c,due,paid,missing:due});
   else if(paid<due)partial.push({c,due,paid,missing:due-paid});
 });
 return {unpaid,partial,missingPhone,total:unpaid.length+partial.length+missingPhone.length,period};
}
function openAttentionPanel(){
 const a=attentionSummary();
 modal(`<div class="attentionHeader"><div><h2>🔔 Wymaga uwagi</h2><div class="muted">${a.period.month} ${a.period.year}</div></div><span class="attentionTotal">${a.total}</span></div>
 <div class="attentionList">
  <button class="attentionItem dangerAttention" onclick="closeModal();openDashboardArrears('all')"><span><b>Brak wpłaty</b><small>${a.unpaid.length} ${a.unpaid.length===1?"dziecko":"dzieci"}</small></span><strong>${a.unpaid.length}</strong></button>
  <button class="attentionItem warningAttention" onclick="closeModal();openDashboardArrears('partial')"><span><b>Niepełne wpłaty</b><small>${a.partial.length} ${a.partial.length===1?"dziecko":"dzieci"}</small></span><strong>${a.partial.length}</strong></button>
  <button class="attentionItem infoAttention" onclick="showMissingPhoneList()"><span><b>Brak telefonu</b><small>${a.missingPhone.length} ${a.missingPhone.length===1?"profil":"profile"}</small></span><strong>${a.missingPhone.length}</strong></button>
 </div>
 ${a.total===0?'<div class="attentionEmpty">✓ Nic nie wymaga uwagi.</div>':""}
 <div class="actions"><button class="soft" onclick="closeModal()">Zamknij</button></div>`);
}
function showMissingPhoneList(){
 const a=attentionSummary(),rows=a.missingPhone;
 const box=document.querySelector("#modal .modalbox");if(!box)return;
 box.innerHTML=`<h2>Brak telefonu</h2><div class="muted">Profile bez numeru kontaktowego: ${rows.length}</div>
 ${rows.map(c=>`<div class="attentionChildRow"><div><b>${c.last} ${c.first}</b><span>${c.school||""} • ${c.class||""}</span></div><button class="soft" onclick="closeModal();editChild(${c.id})">Profil</button></div>`).join("")||'<div class="attentionEmpty">✓ Wszystkie aktywne dzieci mają numer telefonu.</div>'}
 <div class="actions"><button class="soft" onclick="closeModal();openAttentionPanel()">← Wróć</button><button class="soft" onclick="closeModal()">Zamknij</button></div>`;
}


/* ===== START / DASHBOARD ===== */
function start(){
 const dash=currentMonthDashboard(),payStats=dashboardPaidStats();
 const next=nextClassDayInfo(),groupsToday=classesGroupedForDay(next.items);
 const dayText=next.delta===0?"Dzisiejsze zajęcia":next.delta===1?"Jutrzejsze zajęcia":next.delta!==null?`Najbliższe zajęcia za ${next.delta} dni`:"Najbliższe zajęcia";
 const attention=attentionSummary();
 app.innerHTML=`<div class="dashboardTop"><div><div class="eyebrow">PANEL GŁÓWNY</div><h2 class="title">Podsumowanie miesiąca</h2></div><button class="attentionBell ${attention.total?"hasAttention":""}" onclick="openAttentionPanel()" aria-label="Powiadomienia wymagające uwagi">🔔${attention.total?`<span>${attention.total}</span>`:""}</button></div>
 <div class="currentPeriodLabel">${dash.period.month} ${dash.period.year}</div>
 <div class="summary dashboardSummary">
   <button class="stat dashboardTile" onclick="page='reports';render()"><span>Należne w miesiącu</span><b>${money(dash.due)}</b><small>${payStats.dueCount} ${childWord(payStats.dueCount)} z należnością</small></button>
   <button class="stat paidStat dashboardTile" onclick="page='payments';render()"><span>Wpłaty dzieci</span><b>${money(dash.childPaid)}</b><small>${payStats.paidCount}/${payStats.dueCount} opłaconych</small></button>
   <button class="stat missingStat dashboardTile" onclick="openDashboardArrears('all')"><span>Brakuje wpłat</span><b>${money(dash.missing)}</b><small>${dash.missingPeople} ${personArrearsWord(dash.missingPeople)}</small></button>
   <button class="stat partialStat dashboardTile" onclick="openDashboardArrears('partial')"><span>Niepełne wpłaty</span><b>${dash.partialPeople}</b><small>${payStats.partialCount} częściowych</small></button>
   <button class="stat dashboardTile" onclick="page='income';render()"><span>Dodatkowe przychody</span><b>${money(dash.extra)}</b><small>otwórz przychody</small></button>
   <button class="stat dashboardTile" onclick="page='reports';render()"><span>Razem wpływy</span><b>${money(dash.total)}</b><small>zobacz raport</small></button>
 </div>
 ${!dash.activeSchoolMonth?`<div class="notice dashboardNotice">Aktualny miesiąc (${dash.period.month}) jest poza standardowym okresem zajęć Wrzesień–Czerwiec, dlatego należność miesięczna wynosi 0,00 zł.</div>`:""}
 <div class="schoolStatsGrid">
 ${(data.settings?.schools||schools).map(s=>{const x=dash.schoolStats[s]||{total:0,girls:0,boys:0};return `<button class="schoolStatCard" onclick="openChildrenForSchool('${s.replace(/'/g,"\\'")}')"><b>${s}</b><strong>${activeChildrenText(x.total)}</strong><span>👧 ${x.girls} dziewczynek • 👦 ${x.boys} chłopców</span><small>Dotknij, aby otworzyć dzieci tej szkoły</small></button>`}).join("")}
 </div>
 <div class="card"><h2>${dayText}</h2>${next.delta!==null?`<div class="nextClassDate">${formatNextClassDate(next.delta)}</div>`:""}${groupsToday.map(g=>{const a=groupAttendanceState(g),isToday=next.delta===0;return `<div class="nextClassActionCard"><div><b>${g.school} • ${g.type}</b><span>${g.day} ${g.time} • ${g.children.length} dzieci</span>${isToday?`<small class="${a.done?"attendanceDone":"attendancePending"}">${a.done?"✓ Obecność sprawdzona":`Obecność: ${a.count}/${a.total}`}</small>`:""}</div><button class="${a.done?"doneAttendanceBtn":"primary"}" onclick="${isToday?`openAttendanceForGroup('${g.school}','${g.type}','${g.day}','${g.time}')`:`goToGroup('${g.school}','${g.day}','${g.time}','${g.type}')`}">${isToday?(a.done?"✓ Sprawdzone":"Sprawdź obecność"):"Otwórz grupę"}</button></div>`}).join("")||'<div class="muted">Brak zaplanowanych zajęć.</div>'}</div>`;
}

function dashboardPaidStats(){
 const period=currentDashboardPeriod();
 let dueCount=0,paidCount=0,partialCount=0,unpaidCount=0;
 if(!months.includes(period.month))return {dueCount,paidCount,partialCount,unpaidCount};
 data.children.forEach(c=>{
   if(typeof childActiveNow==="function"&&!childActiveNow(c))return;
   const due=childDueForMonth(c,period.month,period.year);
   if(due<=0)return;
   dueCount++;
   const paid=data.payments.filter(p=>Number(p.childId)===Number(c.id)&&paymentBelongsToDashboardMonth(p,period)).reduce((s,p)=>s+Number(p.amount||0),0);
   if(paid>=due)paidCount++;
   else if(paid>0)partialCount++;
   else unpaidCount++;
 });
 return {dueCount,paidCount,partialCount,unpaidCount};
}
function openDashboardArrears(mode="all"){
 window.dashboardArrearsMode=mode;
 page="lists";render();
 setTimeout(()=>{
   const t=document.getElementById("lType");
   if(t){t.value="arrears";refreshListPreview()}
 },0);
}

function openChildrenForSchool(school){
 childrenViewState={q:"",school:school,workshop:"",day:"",time:"",focusChildId:0};
 page="children";render();
}

(function(){
"use strict";


function dashboardActiveChildren(){
  return (data.children||[]).filter(c=>typeof childActiveNow==="function" ? childActiveNow(c) : true);
}
/* ---------- 8.9 / AKTUALNA GRUPA NA START ---------- */

  function timeMinutes(t){
    const m=String(t||"").match(/^(\d{1,2}):(\d{2})$/);
    return m?Number(m[1])*60+Number(m[2]):null;
  }

  function currentClassCandidate(){
    const day=typeof todayDayName==="function"?todayDayName():["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"][new Date().getDay()];
    const map={};

    dashboardActiveChildren().forEach(c=>{
      (c.classes||[]).forEach(cl=>{
        if(cl.waitlist || cl.day!==day)return;
        const tm=timeMinutes(cl.time);
        if(tm===null)return;
        const key=[cl.school||c.school||"",cl.type||"",cl.day||"",cl.time||""].join("|");
        if(!map[key])map[key]={school:cl.school||c.school||"",type:cl.type||"",day:cl.day||"",time:cl.time||"",children:[]};
        if(!map[key].children.some(x=>Number(x.id)===Number(c.id)))map[key].children.push(c);
      });
    });

    const now=new Date();
    const n=now.getHours()*60+now.getMinutes();
    const candidates=Object.values(map).map(g=>({...g,diff:timeMinutes(g.time)-n}))
      .filter(g=>g.diff>=-90 && g.diff<=60)
      .sort((a,b)=>Math.abs(a.diff)-Math.abs(b.diff));

    return candidates[0]||null;
  }

  function currentClassLabel(diff){
    if(diff>15)return `Za ${diff} min`;
    if(diff>0)return `Zaraz • za ${diff} min`;
    if(diff===0)return "Teraz";
    const ago=Math.abs(diff);
    if(ago<=15)return `Teraz • rozpoczęte ${ago} min temu`;
    return `Trwające / ostatnie • ${ago} min temu`;
  }

  function injectStart(){
    if(page!=="start" || !app)return;

    // Szybka wpłata
    if(!document.getElementById("quickPaymentStart")){
      const anchor=app.querySelector(".dashboardTop")||app.firstElementChild;
      if(anchor){
        anchor.insertAdjacentHTML("afterend",
          `<button id="quickPaymentStart" class="primary quickPaymentStart" onclick="openQuickPayment()">⚡ Szybka wpłata</button>`
        );
      }
    }

    // Aktualna / zaraz rozpoczynająca się grupa
    document.getElementById("currentClassNow")?.remove();
    const g=currentClassCandidate();
    if(g){
      const btn=document.getElementById("quickPaymentStart");
      const html=`<div id="currentClassNow" class="card currentClassNow">
        <span class="currentClassLabel">${currentClassLabel(g.diff)}</span>
        <h3>${escapeHtml(g.school)} • ${escapeHtml(g.type)}</h3>
        <p>${escapeHtml(g.day)} ${escapeHtml(g.time)} • ${g.children.length} ${g.children.length===1?"dziecko":"dzieci"}</p>
        <button class="primary" onclick="openAttendanceForGroup('${String(g.school).replaceAll("'","\\'")}','${String(g.type).replaceAll("'","\\'")}','${String(g.day).replaceAll("'","\\'")}','${String(g.time).replaceAll("'","\\'")}')">Sprawdź obecność</button>
      </div>`;
      if(btn)btn.insertAdjacentHTML("afterend",html);
      else app.insertAdjacentHTML("afterbegin",html);
    }
  }

  

  window.injectStart=injectStart;
})();
(function(){
"use strict";

window.paymentBelongsToDashboardMonth=function(p,period){
  return !!p && String(p.month||"")===String(period.month||"");
};

window.currentDashboardPeriod=function(){
  const now=new Date();
  const names=["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
  let month=names[now.getMonth()];
  let year=now.getFullYear();

  if(!months.includes(month)){
    month="Wrzesień";
    year=now.getFullYear();
  }

  return {month,year,monthNumber:names.indexOf(month)+1};
};

function actualCashPeriod(){
  const now=new Date();
  const names=["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
  return {
    year:now.getFullYear(),
    month:now.getMonth()+1,
    monthName:names[now.getMonth()]
  };
}

function dateYearMonth(date){
  const s=String(date||"");
  const m=s.match(/^(\d{4})-(\d{2})/);
  if(!m)return null;
  return {year:Number(m[1]),month:Number(m[2])};
}

function paymentCashBelongs(p,cashPeriod){
  const ym=dateYearMonth(p?.date);

  // Nowe i prawidłowe wpisy: zawsze według faktycznej daty wpływu.
  if(ym){
    return ym.year===cashPeriod.year && ym.month===cashPeriod.month;
  }

  // Zgodność ze starymi wpisami bez daty:
  // nie pozwalamy im zniknąć całkowicie z zestawienia.
  const names=["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
  return String(p?.month||"")===names[cashPeriod.month-1];
}

function incomeCashBelongs(i,cashPeriod){
  const ym=dateYearMonth(i?.date);
  return !!ym && ym.year===cashPeriod.year && ym.month===cashPeriod.month;
}

/*
  Owijamy istniejące obliczenia dashboardu.
  Nie ruszamy należności, zaległości, liczby opłaconych ani statystyk szkół.
  Zmieniamy wyłącznie pola przepływu gotówki: extra i total.
*/
const previousCurrentMonthDashboard=window.currentMonthDashboard;

if(typeof previousCurrentMonthDashboard==="function"){
  window.currentMonthDashboard=function(){
    const dash=previousCurrentMonthDashboard();
    const cashPeriod=actualCashPeriod();

    const cashChildPaid=(data.payments||[])
      .filter(p=>paymentCashBelongs(p,cashPeriod))
      .reduce((sum,p)=>sum+Number(p.amount||0),0);

    const cashExtra=(data.income||[])
      .filter(i=>incomeCashBelongs(i,cashPeriod))
      .reduce((sum,i)=>sum+Number(i.amount||0),0);

    dash.cashChildPaid=cashChildPaid;
    dash.extra=cashExtra;
    dash.total=cashChildPaid+cashExtra;
    dash.cashPeriod=cashPeriod;

    return dash;
  };
}

/*
  Dodajemy małe objaśnienie pod kaflem "Razem wpływy", żeby było jasne,
  że ten kafel jest liczony wg daty wpływu, a nie miesiąca rozliczeniowego.
*/
function annotateCashTile(){
  if(typeof page==="undefined" || page!=="start" || !app)return;

  const tiles=[...app.querySelectorAll(".dashboardTile")];
  const tile=tiles.find(x=>(x.querySelector("span")?.textContent||"").trim()==="Razem wpływy");
  if(!tile)return;

  const small=tile.querySelector("small");
  if(!small)return;

  const cp=actualCashPeriod();
  small.textContent=`wg daty wpływu • ${cp.monthName} ${cp.year}`;
}

const previousStartDashboard=window.start;
if(typeof previousStartDashboard==="function"){
  window.start=function(){
    previousStartDashboard();
    annotateCashTile();
  };
}

setTimeout(()=>{
  if(typeof render==="function" && typeof page!=="undefined" && page==="start"){
    render();
  }
},0);

window.RWModules=window.RWModules||{};
window.RWModules.dashboard={version:"11.5",cashflowByTransactionDate:true};

})();
