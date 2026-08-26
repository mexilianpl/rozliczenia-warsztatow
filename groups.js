/* =========================================================
   groups.js — Rozliczenia Warsztatów v10.9
   Wydzielone z app.js: ekran Grup i operacje na grupie.
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
