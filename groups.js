/* =========================================================
   groups.js — Rozliczenia Warsztatów v11.3
   Grupy wraz z zapamiętywaniem ostatnich filtrów.
   ========================================================= */
"use strict";

function groups(){
 app.innerHTML=`<div class="eyebrow">ZAJĘCIA</div><h2 class="title">Grupy i listy</h2><div class="card">
 <label>Szkoła</label><select id="gSchool" onchange="updateScheduleSelects('gSchool','gDay','gTime');groupList()">${opt(schools,schools[0])}</select>
 <label>Rodzaj warsztatów</label><select id="gWorkshop" onchange="groupList()"><option value="">Wszystkie warsztaty</option>${workshops.map(w=>`<option>${w}</option>`).join("")}</select>
 <label>Dzień</label><select id="gDay" onchange="updateTimeSelect('gSchool','gDay','gTime');groupList()">${opt(dependentSchedule(schools[0],days[0],times[0]).days,dependentSchedule(schools[0],days[0],times[0]).day)}</select>
 <label>Godzina</label><select id="gTime" onchange="groupList()">${opt(dependentSchedule(schools[0],days[0],times[0]).times,dependentSchedule(schools[0],days[0],times[0]).time)}</select>
 <div class="actions">
   <button class="primary" onclick="showAttendance()">✓ Sprawdź obecność</button>
 </div></div><div id="gList"></div>`;
 groupList()
}

function selectedGroupRows(){
 const s=gSchool.value,w=document.getElementById("gWorkshop")?.value||"",d=gDay.value,t=gTime.value,arr=[];
 data.children.forEach(c=>{if(!childActiveNow(c))return;(c.classes||[]).forEach(cl=>{if(!cl.waitlist&&cl.school==s&&(!w||cl.type==w)&&cl.day==d&&cl.time==t)arr.push({c,cl})})});
 const seen=new Set();return arr.filter(x=>{if(seen.has(x.c.id))return false;seen.add(x.c.id);return true}).sort((a,b)=>pickupSortValue(a.c)-pickupSortValue(b.c)||(a.c.last+" "+a.c.first).localeCompare(b.c.last+" "+b.c.first,"pl"));
}

function groupList(){
 const arr=selectedGroupRows();
 gList.innerHTML=arr.map(x=>`<div class="card"><b class="name">${x.c.last} ${x.c.first}</b>
 <div class="muted">${x.c.class||""} • ${x.c.pickupPlace||"Sala nieustalona"} • ${x.cl.type} • ${x.cl.day} ${x.cl.time}</div>
 ${x.c.parent||x.c.phone?`<div class="groupContact">${x.c.parent||""}${x.c.phone?` • <a href="tel:${x.c.phone}">${x.c.phone}</a>`:""}</div>`:""}</div>`).join("")||'<div class="card">Brak dzieci dla wybranych filtrów.</div>'
}

function printSimpleTable(title,headers,rows){
 if(!rows.length){confirmModal({title:"Brak danych",message:"Brak pozycji dla wybranej grupy.",confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 const win=window.open("","_blank");
 win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aaa;padding:8px;text-align:left}th{background:#f1f4f7}@media print{button{display:none}}</style></head><body><h1>${title}</h1><p>${gSchool.value} • ${gDay.value} • ${gTime.value}</p><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table><button onclick="window.print()">Drukuj</button></body></html>`);
 win.document.close();setTimeout(()=>win.print(),250)
}

function printGroupList(){
 const arr=selectedGroupRows();
 printSimpleTable("Lista grupy",["Dziecko","Klasa","Sala / odbiór","Warsztaty","Dzień","Godzina"],arr.map(x=>[x.c.last+" "+x.c.first,x.c.class||"",x.c.pickupPlace||"",x.cl.type||"",x.cl.day||"",x.cl.time||""]))
}

function printGroupContacts(){
 const arr=selectedGroupRows();
 printSimpleTable("Kontakty grupy",["Dziecko","Rodzic / opiekun","Telefon","E-mail","Sala / odbiór"],arr.map(x=>[x.c.last+" "+x.c.first,x.c.parent||"",x.c.phone||"",x.c.email||"",x.c.pickupPlace||""]))
}

function printGroupArrears(){
 const period=currentDashboardPeriod(),arr=selectedGroupRows().map(x=>{
   const paid=data.payments.filter(p=>Number(p.childId)===Number(x.c.id)&&paymentBelongsToDashboardMonth(p,period)).reduce((s,p)=>s+Number(p.amount||0),0);
   const due=childDue(x.c);return {x,due,paid,missing:Math.max(0,due-paid)}
 }).filter(y=>y.missing>0);
 printSimpleTable(`Braki wpłat — ${period.month} ${period.year}`,["Dziecko","Należne","Wpłacono","Brakuje"],arr.map(y=>[y.x.c.last+" "+y.x.c.first,money(y.due),money(y.paid),money(y.missing)]))
}

window.RWModules=window.RWModules||{};
window.RWModules.groups={version:"10.9"};

(function(){
"use strict";

const RW89_GROUP_KEY = "rw89_group_filters";
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
