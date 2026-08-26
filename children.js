/* =========================================================
   children.js — Rozliczenia Warsztatów v11.4
   Pełny moduł listy i profilu dzieci.
   Scalono children-base.js z children.js.
   ========================================================= */
"use strict";

function quickSearch(q){let el=document.querySelector("#quickResults");q=q.toLowerCase().trim(); if(!q){el.innerHTML="";return} el.innerHTML=data.children.filter(c=>(c.last+" "+c.first).toLowerCase().includes(q)).map(c=>`<div class="card" onclick="openChild(${c.id})"><b class="name">${c.last} ${c.first}</b><div class="muted">${c.class} • ${c.school} • zajęcia: ${c.classes.length}</div></div>`).join("")||"Brak wyników"}
function children(){
 app.innerHTML=`<div class="titleline"><div><div class="eyebrow">BAZA</div><h2 class="title">Dzieci</h2></div></div>
 <div class="search"><input id="cs" placeholder="Szukaj po nazwisku / imieniu..." value="${escapeAttr(childrenViewState.q||"")}" oninput="childrenViewState.q=this.value;childrenViewState.focusChildId=0;filterChildren()"></div>
 <div class="childrenFilters card">
   <label>Szkoła</label>
   <select id="schoolFilter" onchange="childrenViewState.focusChildId=0;childrenViewState.school=this.value;childrenSchoolChanged();if(this.value&&this.value!=='__ALL__')updateScheduleSelects('schoolFilter','dayFilter','timeFilter')">
     <option value="">— wybierz szkołę —</option>
     <option value="__ALL__">Wszystkie szkoły</option>
     ${schools.map(s=>`<option>${s}</option>`).join("")}
   </select>
   <div id="advancedChildrenFilters" class="advancedChildrenFilters" style="display:none">
     <label>Rodzaj warsztatów</label>
     <select id="workshopFilter" onchange="childrenViewState.focusChildId=0;childrenRememberFilters();filterChildren()">
       <option value="">Wszystkie warsztaty</option>
       ${workshops.map(w=>`<option>${w}</option>`).join("")}
     </select>
     <div class="grid2">
       <div><label>Dzień</label><select id="dayFilter" onchange="if(document.getElementById('schoolFilter')?.value&&document.getElementById('schoolFilter').value!=='__ALL__')updateTimeSelect('schoolFilter','dayFilter','timeFilter');filterChildren()"><option value="">Wszystkie dni</option>${days.map(d=>`<option>${d}</option>`).join("")}</select></div>
       <div><label>Godzina</label><select id="timeFilter" onchange="childrenViewState.focusChildId=0;childrenRememberFilters();filterChildren()"><option value="">Wszystkie godziny</option>${times.map(t=>`<option>${t}</option>`).join("")}</select></div>
     </div>

     <label>Sortuj</label>
     <select id="sortFilter" onchange="filterChildren()">
       <option value="roomAsc">Sala 1 → 5, potem przychodzący sami</option>
       <option value="roomDesc">Sala 5 → 1, potem przychodzący sami</option>
       <option value="nameAsc">Nazwisko A → Z</option>
       <option value="nameDesc">Nazwisko Z → A</option>
       <option value="classAsc">Klasa rosnąco</option>
     </select>
     <div class="actions">
       <button class="soft" onclick="clearChildrenFilters()">Wyczyść filtry</button>
     </div>
   </div>
 </div>
 <div id="childrenCount" class="childrenCount"></div>
 <div id="childrenList"></div>`;
 setTimeout(()=>{
   const ids=["schoolFilter","workshopFilter","dayFilter","timeFilter"];
   const vals=[childrenViewState.school,childrenViewState.workshop,childrenViewState.day,childrenViewState.time];
   ids.forEach((id,i)=>{
     const el=document.getElementById(id);
     if(el && [...el.options].some(o=>o.value===vals[i]))el.value=vals[i];
   });
   const sf=document.getElementById("schoolFilter");
   const adv=document.getElementById("advancedChildrenFilters");
   if(adv)adv.style.display=(sf?.value||"")?"block":"none";
   const q=document.getElementById("cs");
   if(q)q.value=childrenViewState.q||"";
   if(childrenViewState.q||childrenViewState.school||childrenViewState.workshop||childrenViewState.day||childrenViewState.time||childrenViewState.focusChildId)filterChildren();
 },0);
}

function childrenSchoolChanged(){
 const school=document.querySelector("#schoolFilter")?.value||"";
 const adv=document.querySelector("#advancedChildrenFilters");
 if(adv)adv.style.display=school?"block":"none";
 filterChildren();
}

function pickupSortValue(c){
 const v=String(c.pickupPlace||"").trim();
 const m=v.match(/(\d+)/);
 if(m)return Number(m[1]);
 if(v==="Przychodzi sam/a")return 999;
 return 998;
}
function classSortValue(v){
 const s=String(v||"").toUpperCase().trim();
 const m=s.match(/(\d+)\s*([A-ZĄĆĘŁŃÓŚŹŻ]*)/);
 if(!m)return [999,s];
 return [Number(m[1]),m[2]||""];
}
function sortChildrenList(arr){
 const mode=document.querySelector("#sortFilter")?.value||"roomAsc";
 return [...arr].sort((a,b)=>{
   if(mode==="nameAsc"||mode==="nameDesc"){
     const cmp=(a.last+" "+a.first).localeCompare(b.last+" "+b.first,"pl",{sensitivity:"base"});
     return mode==="nameAsc"?cmp:-cmp;
   }
   if(mode==="classAsc"){
     const ca=classSortValue(a.class), cb=classSortValue(b.class);
     if(ca[0]!==cb[0])return ca[0]-cb[0];
     const c=ca[1].localeCompare(cb[1],"pl",{sensitivity:"base"});
     return c || (a.last+" "+a.first).localeCompare(b.last+" "+b.first,"pl",{sensitivity:"base"});
   }
   const ra=pickupSortValue(a), rb=pickupSortValue(b);
   if(ra!==rb){
     if(mode==="roomDesc"){
       // "Przychodzi sam/a" zawsze na końcu.
       if(ra>=998)return 1;
       if(rb>=998)return -1;
       return rb-ra;
     }
     return ra-rb;
   }
   return (a.last+" "+a.first).localeCompare(b.last+" "+b.first,"pl",{sensitivity:"base"});
 });
}
function getFilteredChildren(){
 const q=(document.querySelector("#cs")?.value||"").trim().toLowerCase();
 const sf=document.querySelector("#schoolFilter")?.value||"";
 const wf=document.querySelector("#workshopFilter")?.value||"";
 const df=document.querySelector("#dayFilter")?.value||"";
 const tf=document.querySelector("#timeFilter")?.value||"";
 if(!sf&&!q)return [];
 const filtered=data.children.filter(c=>{
   const nameOk=!q||(c.last+" "+c.first).toLowerCase().includes(q);
   const schoolOk=!sf||sf==="__ALL__"||c.school===sf||(c.classes||[]).some(cl=>cl.school===sf);
   if(!nameOk||!schoolOk)return false;
   if(!wf&&!df&&!tf)return true;
   return (c.classes||[]).some(cl=>
     (!wf||cl.type===wf)&&(!df||cl.day===df)&&(!tf||cl.time===tf)&&(!sf||sf==="__ALL__"||cl.school===sf||c.school===sf)
   );
 });
 if(childrenViewState.focusChildId){
   const focused=data.children.find(c=>Number(c.id)===Number(childrenViewState.focusChildId));
   if(focused && !filtered.some(c=>Number(c.id)===Number(focused.id))){
     const qOk=!q||(focused.last+" "+focused.first).toLowerCase().includes(q);
     if(qOk)filtered.push(focused);
   }
 }
 return sortChildrenList(filtered);
}
function childrenRememberFilters(){
 childrenViewState.q=document.getElementById("cs")?.value??childrenViewState.q??"";
 childrenViewState.school=document.getElementById("schoolFilter")?.value??childrenViewState.school??"";
 childrenViewState.workshop=document.getElementById("workshopFilter")?.value||"";
 childrenViewState.day=document.getElementById("dayFilter")?.value||"";
 childrenViewState.time=document.getElementById("timeFilter")?.value||"";
}
function filterChildren(){
 childrenRememberFilters();
 const list=document.querySelector("#childrenList"),count=document.querySelector("#childrenCount");
 if(!list)return;
 const q=(document.querySelector("#cs")?.value||"").trim(),sf=document.querySelector("#schoolFilter")?.value||"";
 if(!q&&!sf){list.innerHTML="";if(count)count.innerHTML="";return}
 const arr=getFilteredChildren();
 if(count)count.innerHTML=arr.length?`Znaleziono: <b>${arr.length}</b>`:"";
 list.innerHTML=arr.map(childCard).join("")||'<div class="card muted">Brak dzieci spełniających wybrane kryteria.</div>';
}
function clearChildrenFilters(){
 ["workshopFilter","dayFilter","timeFilter"].forEach(id=>{const e=document.getElementById(id);if(e)e.value=""});
 filterChildren();
}
function printFilteredChildren(){
 const arr=getFilteredChildren();
 if(!arr.length){
   confirmModal({title:"Brak dzieci do wydruku",message:"Wybierz szkołę lub zmień filtry.",confirmText:"OK",cancelText:"Zamknij",danger:false});
   return;
 }
 const sf=document.querySelector("#schoolFilter")?.value||"";
 const wf=document.querySelector("#workshopFilter")?.value||"Wszystkie warsztaty";
 const df=document.querySelector("#dayFilter")?.value||"Wszystkie dni";
 const tf=document.querySelector("#timeFilter")?.value||"Wszystkie godziny";
 let rows=[];
 arr.forEach(c=>{
   let cls=(c.classes||[]).filter(cl=>(!sf||sf==="__ALL__"||cl.school===sf||c.school===sf)&&(!wf||wf==="Wszystkie warsztaty"||cl.type===wf)&&(!df||df==="Wszystkie dni"||cl.day===df)&&(!tf||tf==="Wszystkie godziny"||cl.time===tf));
   if(!cls.length)cls=[{}];
   cls.forEach(cl=>rows.push(`<tr><td>${c.last} ${c.first}</td><td>${c.class||""}</td><td>${c.pickupPlace||""}</td><td>${cl.type||""}</td><td>${cl.day||""}</td><td>${cl.time||""}</td></tr>`));
 });
 const win=window.open("","_blank");
 win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Lista dzieci</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #bbb;padding:8px;text-align:left}th{background:#f2f4f7}@media print{button{display:none}}</style></head><body><h1>Lista dzieci</h1><p>${sf} • ${wf} • ${df} • ${tf}</p><table><thead><tr><th>Nazwisko i imię</th><th>Klasa</th><th>Sala / odbiór</th><th>Warsztaty</th><th>Dzień</th><th>Godzina</th></tr></thead><tbody>${rows.join("")}</tbody></table><button onclick="window.print()">Drukuj</button></body></html>`);
 win.document.close();setTimeout(()=>win.print(),250);
}

function printAttendanceList(){
 const arr=getFilteredChildren();
 if(!arr.length){
   confirmModal({title:"Brak dzieci na liście",message:"Wybierz szkołę i ewentualnie warsztaty, dzień lub godzinę.",confirmText:"OK",cancelText:"Zamknij",danger:false});
   return;
 }
 const sfRaw=document.querySelector("#schoolFilter")?.value||"";
 const sf=sfRaw==="__ALL__"?"Wszystkie szkoły":sfRaw;
 const wf=document.querySelector("#workshopFilter")?.value||"Wszystkie warsztaty";
 const df=document.querySelector("#dayFilter")?.value||"Wszystkie dni";
 const tf=document.querySelector("#timeFilter")?.value||"Wszystkie godziny";
 const rows=arr.map((c,i)=>`<tr><td>${i+1}</td><td>${c.last} ${c.first}</td><td>${c.class||""}</td><td>${c.pickupPlace||""}</td><td></td><td></td><td></td></tr>`).join("");
 const win=window.open("","_blank");
 win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Lista obecności</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #999;padding:9px;text-align:left}td:nth-child(4),td:nth-child(5){height:28px;width:70px}@media print{button{display:none}}</style></head><body><h1>Lista obecności</h1><p>${sf} • ${wf} • ${df} • ${tf}</p><table><thead><tr><th>Lp.</th><th>Nazwisko i imię</th><th>Klasa</th><th>Sala / odbiór</th><th>Obecny</th><th>Nieobecny</th><th>Uwagi</th></tr></thead><tbody>${rows}</tbody></table><button onclick="window.print()">Drukuj</button></body></html>`);
 win.document.close();setTimeout(()=>win.print(),250);
}
function childCard(c){
 const ps=paymentState(c,"Wrzesień");
 return `<div class="card"><div class="childhead"><div><div class="name">${c.last} ${c.first}</div><div class="muted">${c.class} • ${c.school} • ${c.sex}${c.pickupPlace?` • ${c.pickupPlace}`:""}</div>
 <div class="imageConsentStatus ${consentLabel(c.consents?.image)==="Tak"?"consentYes":consentLabel(c.consents?.image)==="Nie"?"consentNo":"consentUnknown"}">
   Wizerunek: ${consentLabel(c.consents?.image)||"brak danych"}
 </div>
 <div class="due">Należne Wrzesień: ${money(ps.due)} • wpłacono ${money(ps.paid)}</div><div class="paymentBadgeText ${paymentStatusClass(ps.kind)}">${ps.label}</div></div><button class="soft" onclick="editChild(${c.id})">Profil</button></div>
 ${c.classes.map(cl=>`<div class="classrow"><h3>${cl.type}</h3><div class="muted">${cl.day} ${cl.time} • ${cl.school}</div><div class="muted">Cena ${money(dueClass(cl))}${cl.discount?` • rabat ${cl.discount}%`:""}${cl.startDate?` • od ${new Date(cl.startDate+"T12:00:00").toLocaleDateString("pl-PL")}`:""}</div>${cl.firstMonthOverride!==""&&cl.firstMonthOverride!==undefined?`<div class="firstMonthBadge">Pierwszy miesiąc: ${money(cl.firstMonthOverride)} — korekta ręczna</div>`:""}<div class="actions"><button class="soft" onclick="editClass(${c.id},${cl.id})">Edytuj zajęcia</button><button class="danger" onclick="deleteClass(${c.id},${cl.id})">Usuń zajęcia</button></div></div>`).join("")}
 <div class="actions"><button class="primary" onclick="editClass(${c.id})">+ Dodaj zajęcia</button></div></div>`}
function modal(html){document.body.insertAdjacentHTML("beforeend",`<div class="modal" id="modal"><div class="modalbox">${html}</div></div>`)}
function closeModal(){document.querySelector("#modal")?.remove()}
function consentLabel(v){
 const x=String(v||"").trim().toLowerCase();
 if(["tak","yes","1","true","zgoda"].includes(x))return "Tak";
 if(["nie","no","0","false","brak"].includes(x))return "Nie";
 return "";
}
function attendanceHistoryForChild(cid){
 const out=[];
 Object.entries(data.attendance||{}).forEach(([key,vals])=>{
   let status=vals?.[cid]||vals?.[String(cid)];
   if(!status && Number(vals?.childId)===Number(cid))status=vals?.status;
   if(!status)return;
   const parts=key.split("|");
   out.push({date:vals?.date||parts[0]||"",school:vals?.school||parts[1]||"",day:vals?.day||parts[2]||"",time:vals?.time||parts[3]||"",status});
 });
 return out.sort((a,b)=>a.date.localeCompare(b.date));
}
function attendanceSummary(cid){
 const h=attendanceHistoryForChild(cid),present=h.filter(x=>x.status==="present").length,absent=h.filter(x=>x.status==="absent").length,total=present+absent;
 return {h,present,absent,total,pct:total?Math.round(present*100/total):0};
}
function attendanceDatePL(d){if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(d))return d;const [y,m,day]=d.split("-");return `${day}.${m}.${y}`}
function editChild(id){
 let c=data.children.find(x=>x.id==id)||{id:Date.now(),last:"",first:"",sex:"Dziewczynka",class:"",school:schools[0],parent:"",phone:"",email:"",pickupPlace:"",consents:{rules:"",personal:"",image:""},classes:[]};
 c.consents=c.consents||{rules:"",personal:"",image:""};
 modal(`<h2>${id?"Edytuj profil dziecka":"Dodaj dziecko"}</h2>
 <div class="grid2">
  <div><label>Nazwisko</label><input id="fLast" value="${c.last}"></div>
  <div><label>Imię</label><input id="fFirst" value="${c.first}"></div>
  <div><label>Płeć</label><select id="fSex">${opt(["Dziewczynka","Chłopiec"],c.sex)}</select></div>
  <div><label>Klasa</label><input id="fClass" value="${c.class}"></div>
 </div>
 <label>Szkoła</label><select id="fSchool" onchange="updateScheduleSelects('fSchool','fDay','fTime')">${opt(schools,c.school)}</select>
 <label>Rodzaj warsztatów</label><select id="fWorkshop">${opt(workshops,c.classes?.[0]?.type||workshops[0])}</select>
 <div class="grid2">
   <div><label>Dzień tygodnia</label><select id="fDay" onchange="updateTimeSelect('fSchool','fDay','fTime')">${opt(dependentSchedule(c.school,c.classes?.[0]?.day||days[0],c.classes?.[0]?.time||times[0]).days,dependentSchedule(c.school,c.classes?.[0]?.day||days[0],c.classes?.[0]?.time||times[0]).day)}</select></div>
   <div><label>Godzina</label><select id="fTime">${opt(dependentSchedule(c.school,c.classes?.[0]?.day||days[0],c.classes?.[0]?.time||times[0]).times,dependentSchedule(c.school,c.classes?.[0]?.day||days[0],c.classes?.[0]?.time||times[0]).time)}</select></div>
 </div>
 <label>Sala / sposób odbioru</label><select id="fPickup">${opt(["",...pickupPlaces],c.pickupPlace||"")}</select>
 <div class="muted" style="margin-top:8px">Wybranie sali oznacza, że dziecko jest odbierane ze świetlicy. „Przychodzi sam/a” oznacza brak odbioru ze świetlicy.</div>
 <label>Rodzic / opiekun</label><input id="fParent" value="${c.parent||""}">
 <label>Telefon</label><input id="fPhone" value="${c.phone||""}">
 <label>E-mail</label><input id="fEmail" value="${c.email||""}">
 <div class="consentBox">
   <h3>Zgody z formularza</h3>
   <div class="consentRow">
     <span>Zgoda na wizerunek</span>
     <select id="fImageConsent">${opt(["","Tak","Nie"],consentLabel(c.consents.image))}</select>
   </div>
   <div class="consentRow">
     <span>Dane osobowe</span>
     <select id="fPersonalConsent">${opt(["","Tak","Nie"],consentLabel(c.consents.personal))}</select>
   </div>
   <div class="consentRow">
     <span>Regulamin zajęć</span>
     <select id="fRulesConsent">${opt(["","Tak","Nie"],consentLabel(c.consents.rules))}</select>
   </div>
 </div>
 ${id?(()=>{const a=attendanceSummary(c.id);return `<div class="consentBox"><h3>Frekwencja</h3><div class="attendanceStats"><div><b>${a.total}</b><span>Zajęć</span></div><div><b>${a.present}</b><span>Obecności</span></div><div><b>${a.absent}</b><span>Nieobecności</span></div><div><b>${a.pct}%</b><span>Frekwencja</span></div></div>${a.h.filter(x=>x.status==="absent").length?`<div class="muted attendanceDates"><b>Daty nieobecności:</b> ${a.h.filter(x=>x.status==="absent").map(x=>attendanceDatePL(x.date)).join(", ")}</div>`:`<div class="muted attendanceDates">Brak zapisanych nieobecności.</div>`}</div>`})():""}
 <div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="saveChild(${c.id},${id?1:0})">Zapisz</button></div>`)
}
function saveChild(id,exists){
 const old=exists?data.children.find(c=>c.id==id):null;
 let obj={
  id,
  last:fLast.value,
  first:fFirst.value,
  sex:fSex.value,
  class:fClass.value,
  school:fSchool.value,
  club:fPickup.value==="Przychodzi sam/a"?"Nie":(fPickup.value?"Tak":(old?.club||"")),
  pickupPlace:fPickup.value,
  parent:fParent.value,
  phone:fPhone.value,
  email:fEmail.value,
  consents:{
    rules:fRulesConsent.value,
    personal:fPersonalConsent.value,
    image:fImageConsent.value
  },
  classes:old?.classes||[],
  notes:old?.notes||"",
  sourceEntryId:old?.sourceEntryId||"",
  sourceCreatedAt:old?.sourceCreatedAt||""
 };
 const selectedType=document.getElementById("fWorkshop")?.value||"";
 if(selectedType){
   const prev=obj.classes?.[0];
   const firstClass=prev?{...prev}:{id:Date.now(),price:defaultWorkshopPrice(selectedType),discount:0,status:"brak"};
   firstClass.school=fSchool.value;
   firstClass.type=selectedType;
   firstClass.day=document.getElementById("fDay")?.value||days[0];
   firstClass.time=document.getElementById("fTime")?.value||times[0];
   if(!firstClass.price)firstClass.price=defaultWorkshopPrice(selectedType);
   if(obj.classes?.length)obj.classes[0]=firstClass;else obj.classes=[firstClass];
 }
 if(exists)data.children[data.children.findIndex(c=>c.id==id)]=obj;else data.children.push(obj);
 save();closeModal();render()
}


function dependentSchedule(school,currentDay,currentTime){
 const allowedDays=schoolScheduleDays(school);
 const useDays=allowedDays.length?allowedDays:days;
 const chosenDay=useDays.includes(currentDay)?currentDay:(useDays[0]||currentDay||days[0]);
 const allowedTimes=schoolScheduleTimes(school,chosenDay);
 const useTimes=allowedTimes.length?allowedTimes:times;
 const chosenTime=useTimes.includes(currentTime)?currentTime:(useTimes[0]||currentTime||times[0]);
 return {days:useDays,times:useTimes,day:chosenDay,time:chosenTime};
}
function updateScheduleSelects(schoolId,dayId,timeId){
 const school=document.getElementById(schoolId)?.value||"";
 const d=document.getElementById(dayId),t=document.getElementById(timeId);
 if(!d||!t)return;
 const cfg=dependentSchedule(school,d.value,t.value);
 d.innerHTML=cfg.days.map(x=>`<option ${x===cfg.day?"selected":""}>${x}</option>`).join("");
 t.innerHTML=cfg.times.map(x=>`<option ${x===cfg.time?"selected":""}>${x}</option>`).join("");
}
function updateTimeSelect(schoolId,dayId,timeId){
 const school=document.getElementById(schoolId)?.value||"";
 const day=document.getElementById(dayId)?.value||"";
 const t=document.getElementById(timeId); if(!t)return;
 const allowed=schoolScheduleTimes(school,day),use=allowed.length?allowed:times,current=t.value;
 t.innerHTML=use.map(x=>`<option ${x===current?"selected":""}>${x}</option>`).join("");
}
function classScheduleOptions(school,currentDay,currentTime){
 const schedule=ensureSchoolSchedule(school);
 const allowedDays=schoolScheduleDays(school);
 const useDays=allowedDays.length?allowedDays:days;
 const selectedDay=useDays.includes(currentDay)?currentDay:(useDays[0]||currentDay);
 const allowedTimes=schoolScheduleTimes(school,selectedDay);
 const useTimes=allowedTimes.length?allowedTimes:times;
 const selectedTime=useTimes.includes(currentTime)?currentTime:(useTimes[0]||currentTime);
 return {days:useDays,times:useTimes,day:selectedDay,time:selectedTime};
}
function refreshClassScheduleFields(){
 const school=document.querySelector("#clSchool")?.value;
 const d=document.querySelector("#clDay"),t=document.querySelector("#clTime");
 if(!school||!d||!t)return;
 const cfg=classScheduleOptions(school,d.value,t.value);
 d.innerHTML=cfg.days.map(x=>`<option ${x===cfg.day?"selected":""}>${x}</option>`).join("");
 t.innerHTML=cfg.times.map(x=>`<option ${x===cfg.time?"selected":""}>${x}</option>`).join("");
}
function refreshClassTimesForDay(){
 const school=document.querySelector("#clSchool")?.value,day=document.querySelector("#clDay")?.value,t=document.querySelector("#clTime");
 if(!school||!t)return;
 const allowed=schoolScheduleTimes(school,day),use=allowed.length?allowed:times;
 t.innerHTML=use.map(x=>`<option>${x}</option>`).join("");
}

function editClass(cid,clid){let ch=data.children.find(c=>c.id==cid),cl=ch.classes.find(x=>x.id==clid)||{id:Date.now(),type:workshops[0],day:days[0],time:times[0],school:ch.school,price:defaultWorkshopPrice(workshops[0]),discount:0,status:"brak"};
 modal(`<h2>${clid?"Edytuj":"Dodaj"} zajęcia</h2><label>Rodzaj zajęć</label><select id="clType" onchange="if(!this.dataset.edited){clPrice.value=defaultWorkshopPrice(this.value)}">${opt(workshops,cl.type)}</select><label>Szkoła</label><select id="clSchool" onchange="refreshClassScheduleFields()">${opt(schools,cl.school)}</select>
 <div class="grid2"><div><label>Dzień</label><select id="clDay" onchange="refreshClassTimesForDay()">${opt(classScheduleOptions(cl.school,cl.day,cl.time).days,classScheduleOptions(cl.school,cl.day,cl.time).day)}</select></div><div><label>Godzina</label><select id="clTime">${opt(classScheduleOptions(cl.school,cl.day,cl.time).times,classScheduleOptions(cl.school,cl.day,cl.time).time)}</select></div></div>
 <div class="grid2"><div><label>Cena regularna</label><input id="clPrice" type="number" value="${cl.price}" oninput="clType.dataset.edited=1"></div><div><label>Rabat %</label><select id="clDisc">${opt([0,10,20,30,50,100],cl.discount)}</select></div></div>
 <div class="grid2"><div><label>Data rozpoczęcia tych zajęć</label><input id="clStartDate" type="date" value="${cl.startDate||ch.startDate||""}"></div><div><label>Data zakończenia / przerwy</label><input id="clEndDate" type="date" value="${cl.endDate||""}"></div></div>
 <label>Kwota pierwszego miesiąca — korekta ręczna (opcjonalnie)</label><input id="clFirstMonthOverride" type="number" min="0" step="0.01" value="${cl.firstMonthOverride??""}" placeholder="Puste = system wyliczy automatycznie">
 <div class="muted firstMonthHint">Jeżeli pole zostawisz puste, pierwszy miesiąc zostanie policzony proporcjonalnie do liczby zajęć pozostałych od daty rozpoczęcia. Od następnego miesiąca obowiązuje pełna stawka.</div>
 <label>Status</label><select id="clStatus"><option value="brak" ${cl.status=="brak"?"selected":""}>Brak wpłaty</option><option value="oplacone" ${cl.status=="oplacone"?"selected":""}>Wpłacono</option><option value="bezplatne" ${cl.status=="bezplatne"?"selected":""}>Bezpłatne</option></select>
 <div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="saveClass(${cid},${cl.id},${clid?1:0})">Zapisz</button></div>`) }
function saveClass(cid,id,exists){let ch=data.children.find(c=>c.id==cid),cl={id,type:clType.value,school:clSchool.value,day:clDay.value,time:clTime.value,price:+clPrice.value,discount:+clDisc.value,status:clStatus.value};if(exists)ch.classes[ch.classes.findIndex(x=>x.id==id)]=cl;else ch.classes.push(cl);save();closeModal();render()}
function confirmModal({title,message,confirmText="Usuń",cancelText="Anuluj",danger=true}){
 return new Promise(resolve=>{
  const existing=document.getElementById("confirmModal"); if(existing)existing.remove();
  const wrap=document.createElement("div"); wrap.id="confirmModal"; wrap.className="confirmOverlay";
  wrap.innerHTML=`<div class="confirmBox"><div class="confirmIcon ${danger?"dangerIcon":""}">${danger?"!":"?"}</div><h2>${title}</h2><p>${message}</p><div class="confirmActions"><button class="soft" data-no>${cancelText}</button><button class="${danger?"confirmDanger":"primary"}" data-yes>${confirmText}</button></div></div>`;
  const done=v=>{wrap.remove();resolve(v)};
  wrap.querySelector("[data-no]").onclick=()=>done(false); wrap.querySelector("[data-yes]").onclick=()=>done(true); wrap.onclick=e=>{if(e.target===wrap)done(false)}; document.body.appendChild(wrap);
 });
}
async function deleteClass(cid,id){let ch=data.children.find(c=>c.id==cid),cl=ch?.classes.find(x=>x.id==id);let ok=await confirmModal({title:"Usunąć zajęcia?",message:`${cl?cl.type+" • "+cl.day+" "+cl.time+". ":""}Tej operacji nie można cofnąć.`,confirmText:"Usuń zajęcia"});if(!ok)return;ch.classes=ch.classes.filter(x=>x.id!=id);childrenRememberFilters();childrenViewState.focusChildId=cid;save();page='children';render()}
function openChild(id){page="children";render();setTimeout(()=>editChild(id),0)}

function logHistory(childId,text){
 data.history.push({id:Date.now()+Math.random(),childId:Number(childId),date:new Date().toISOString(),text});
 if(data.history.length>5000)data.history=data.history.slice(-5000);
}

function pauseChild(cid){
 const c=data.children.find(x=>x.id==cid);if(!c)return;
 c.activityStatus="Wstrzymane";c.endDate=new Date().toISOString().slice(0,10);
 logHistory(c.id,"Wstrzymano uczestnictwo.");save();closeModal();page="children";render();
}

function resumeChild(cid){
 const c=data.children.find(x=>x.id==cid);if(!c)return;
 c.activityStatus="Aktywne";c.startDate=new Date().toISOString().slice(0,10);c.endDate="";
 logHistory(c.id,"Wznowiono uczestnictwo.");save();closeModal();page="children";render();
}

function childHistory(childId){return data.history.filter(h=>Number(h.childId)===Number(childId)).sort((a,b)=>b.date.localeCompare(a.date))}

function childActiveNow(c){
 if(c.activityStatus==="Zrezygnował"||c.activityStatus==="Wstrzymane")return false;
 const today=new Date().toISOString().slice(0,10);
 if(c.startDate&&today<c.startDate)return false;
 if(c.endDate&&today>c.endDate)return false;
 return true;
}

function childDue(ch){return childActiveNow(ch)?(ch.classes||[]).reduce((s,c)=>s+dueClass(c),0):0}

function groupActiveCount(school,type,day,time,excludeCid=0){
 let count=0;
 data.children.forEach(c=>{
   if(!childActiveNow(c)||Number(c.id)===Number(excludeCid))return;
   if((c.classes||[]).some(cl=>!cl.waitlist&&cl.school===school&&cl.type===type&&cl.day===day&&cl.time===time))count++;
 });
 return count;
}

function enforceClassCapacity(ch,cl){
 const limit=Number(data.settings.groupLimit||0);
 if(!limit||cl.status==="bezplatne")return cl;
 const count=groupActiveCount(cl.school,cl.type,cl.day,cl.time,ch.id);
 cl.waitlist=count>=limit;
 return cl;
}

function switchChildProfileTab(name,btn){
 const box=document.querySelector("#modal .modalbox");if(!box)return;
 box.querySelectorAll(".childProfileSection").forEach(x=>x.classList.toggle("active",x.dataset.section===name));
 box.querySelectorAll(".childProfileTab").forEach(x=>x.classList.remove("active"));
 btn?.classList.add("active");
 const content=box.querySelector(".childProfileBody");
 if(content)content.scrollTop=0;
}

function editChild(id){
 let c=data.children.find(x=>x.id==id)||{id:Date.now(),last:"",first:"",sex:"Dziewczynka",class:"",school:schools[0],parent:"",phone:"",email:"",pickupPlace:"",activityStatus:"Aktywne",startDate:"",endDate:"",payerGroup:"",consents:{rules:"",personal:"",image:""},classes:[]};
 c.consents=c.consents||{rules:"",personal:"",image:""};
 const hist=id?childHistory(c.id).slice(0,30):[];
 const att=id?attendanceSummary(c.id):{total:0,present:0,absent:0,pct:0,h:[]};
 const finance=id?childFinanceRows(c):[];
 modal(`<div class="childProfileHeader"><div><h2>${id?`${c.first} ${c.last}`:"Dodaj dziecko"}</h2>${id?`<div class="muted">${c.class||"bez klasy"} • ${c.school||""} • ${c.activityStatus||"Aktywne"}</div>`:""}</div>${id?`<span class="profileStatus ${c.activityStatus==="Aktywne"?"active":"inactive"}">${c.activityStatus||"Aktywne"}</span>`:""}</div>
 <div class="childProfileTabs">
  <button class="childProfileTab active" onclick="switchChildProfileTab('data',this)">Dane</button>
  <button class="childProfileTab" onclick="switchChildProfileTab('classes',this)">Zajęcia</button>
  ${id?`<button class="childProfileTab" onclick="switchChildProfileTab('payments',this)">Płatności</button><button class="childProfileTab" onclick="switchChildProfileTab('attendance',this)">Frekwencja</button>`:""}
  <button class="childProfileTab" onclick="switchChildProfileTab('consents',this)">Zgody</button>
  ${id?`<button class="childProfileTab" onclick="switchChildProfileTab('history',this)">Historia</button>`:""}
 </div>
 <div class="childProfileBody">
  <section class="childProfileSection active" data-section="data">
   <h3>Dane dziecka</h3>
   <div class="grid2">
    <div><label>Nazwisko</label><input id="fLast" value="${escapeAttr(c.last)}"></div>
    <div><label>Imię</label><input id="fFirst" value="${escapeAttr(c.first)}"></div>
    <div><label>Płeć</label><select id="fSex">${opt(["Dziewczynka","Chłopiec"],c.sex)}</select></div>
    <div><label>Klasa</label><input id="fClass" value="${escapeAttr(c.class)}"></div>
   </div>
   <div class="grid2">
    <div><label>Status dziecka</label><select id="fActivity">${opt(["Aktywne","Wstrzymane","Zrezygnował"],c.activityStatus||"Aktywne")}</select></div>
    <div><label>Wspólny płatnik / rodzina</label><input id="fPayerGroup" value="${escapeAttr(c.payerGroup||"")}" placeholder="np. Rodzina Kolasa"></div>
   </div>
   <div class="grid2"><div><label>Od kiedy</label><input id="fStartDate" type="date" value="${c.startDate||""}"></div><div><label>Do kiedy / przerwa</label><input id="fEndDate" type="date" value="${c.endDate||""}"></div></div>
   <label>Sala / sposób odbioru</label><select id="fPickup">${opt(["",...pickupPlaces],c.pickupPlace||"")}</select>
   <h3>Rodzic / opiekun</h3>
   <label>Imię i nazwisko</label><input id="fParent" value="${escapeAttr(c.parent||"")}">
   <div class="grid2"><div><label>Telefon</label><input id="fPhone" value="${escapeAttr(c.phone||"")}"></div><div><label>E-mail</label><input id="fEmail" value="${escapeAttr(c.email||"")}"></div></div>
  </section>

  <section class="childProfileSection" data-section="classes">
   <h3>Zajęcia</h3>
   <label>Szkoła</label><select id="fSchool" onchange="updateScheduleSelects('fSchool','fDay','fTime')">${opt(schools,c.school)}</select>
   <label>Główne warsztaty</label><select id="fWorkshop">${opt(workshops,c.classes?.[0]?.type||workshops[0])}</select>
   <div class="grid2">
    <div><label>Dzień tygodnia</label><select id="fDay" onchange="updateTimeSelect('fSchool','fDay','fTime')">${opt(dependentSchedule(c.school,c.classes?.[0]?.day||days[0],c.classes?.[0]?.time||times[0]).days,dependentSchedule(c.school,c.classes?.[0]?.day||days[0],c.classes?.[0]?.time||times[0]).day)}</select></div>
    <div><label>Godzina</label><select id="fTime">${opt(dependentSchedule(c.school,c.classes?.[0]?.day||days[0],c.classes?.[0]?.time||times[0]).times,dependentSchedule(c.school,c.classes?.[0]?.day||days[0],c.classes?.[0]?.time||times[0]).time)}</select></div>
   </div>
   ${id?`<div class="profileClassList">${(c.classes||[]).map(cl=>`<div class="profileClassItem"><div><b>${cl.type}</b><span>${cl.school} • ${cl.day} ${cl.time}</span><small>${money(dueClass(cl))}${cl.startDate?` • od ${new Date(cl.startDate+"T12:00:00").toLocaleDateString("pl-PL")}`:""}</small></div><button class="soft compactBtn" onclick="closeModal();editClass(${c.id},${cl.id})">Edytuj</button></div>`).join("")||'<div class="muted">Brak zajęć.</div>'}</div><button class="primary fullBtn" onclick="closeModal();editClass(${c.id})">+ Dodaj kolejne zajęcia</button>`:""}
  </section>

  ${id?`<section class="childProfileSection" data-section="payments">
   <h3>Rozliczenia — ${data.currentSchoolYear}</h3>
   <div class="profilePaymentQuick"><button class="primary" onclick="closeModal();addPayment(${c.id},'${escapeAttr(c.last)}')">+ Dodaj wpłatę</button>${c.phone?`<button class="smsBtn" onclick="sendReminderSMS(${c.id},'${months.includes(currentMonthName())?currentMonthName():"Wrzesień"}')">💬 SMS</button>`:""}</div>
   <div class="financeTable"><div class="financeHead"><span>Miesiąc</span><span>Należne</span><span>Wpłacono</span><span>Status</span></div>${finance.map(r=>`<div class="financeRow"><span><b>${r.month}</b><small>${r.year}</small></span><span>${money(r.due)}</span><span>${money(r.paid)}</span><span class="${paymentStatusClass(r.kind)}">${r.kind==="paid"?"✓ Opłacone":r.kind==="partial"?`Brakuje ${money(r.missing)}`:r.kind==="unpaid"&&r.due>0?`Brakuje ${money(r.due)}`:r.kind==="overpaid"?`Nadpłata ${money(r.extra)}`:r.kind==="before"?"Przed zapisem":r.kind==="future"?`Do zapłaty ${money(r.due)}`:"—"}</span></div>`).join("")}</div>
  </section>
  <section class="childProfileSection" data-section="attendance">
   <h3>Frekwencja</h3>
   <div class="attendanceStats"><div><b>${att.total}</b><span>Zajęć</span></div><div><b>${att.present}</b><span>Obecności</span></div><div><b>${att.absent}</b><span>Nieobecności</span></div><div><b>${att.pct}%</b><span>Frekwencja</span></div></div>
   ${att.h.length?`<div class="profileAttendanceHistory">${[...att.h].reverse().slice(0,20).map(x=>`<div><b>${attendanceDatePL(x.date)}</b><span>${x.status==="present"?"✓ Obecny":"Nieobecny"} • ${x.school||""} ${x.time||""}</span></div>`).join("")}</div>`:'<div class="muted">Brak zapisanej frekwencji.</div>'}
  </section>`:""}

  <section class="childProfileSection" data-section="consents">
   <h3>Zgody</h3>
   <div class="consentRow"><span>Zgoda na wizerunek</span><select id="fImageConsent">${opt(["","Tak","Nie"],consentLabel(c.consents.image))}</select></div>
   <div class="consentRow"><span>Dane osobowe</span><select id="fPersonalConsent">${opt(["","Tak","Nie"],consentLabel(c.consents.personal))}</select></div>
   <div class="consentRow"><span>Regulamin zajęć</span><select id="fRulesConsent">${opt(["","Tak","Nie"],consentLabel(c.consents.rules))}</select></div>
  </section>

  ${id?`<section class="childProfileSection" data-section="history"><h3>Historia zmian</h3>${hist.length?hist.map(h=>`<div class="historyLine"><b>${new Date(h.date).toLocaleString("pl-PL")}</b><span>${escapeHtml(h.text)}</span></div>`).join(""):'<div class="muted">Brak historii zmian.</div>'}</section>`:""}
 </div>
 <div class="profileFooter actions">${id?`<button class="${c.activityStatus==="Aktywne"?"warnBtn":"resumeBtn"}" onclick="${c.activityStatus==="Aktywne"?`pauseChild(${c.id})`:`resumeChild(${c.id})`}">${c.activityStatus==="Aktywne"?"Wstrzymaj":"Wznów"}</button>`:""}<button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="saveChild(${c.id},${id?1:0})">Zapisz</button></div>`)
}

function saveChild(id,exists){
 const old=exists?data.children.find(c=>c.id==id):null;
 let obj={id,last:fLast.value,first:fFirst.value,sex:fSex.value,class:fClass.value,school:fSchool.value,
  club:fPickup.value==="Przychodzi sam/a"?"Nie":(fPickup.value?"Tak":(old?.club||"")),pickupPlace:fPickup.value,parent:fParent.value,phone:fPhone.value,email:fEmail.value,
  activityStatus:fActivity.value,startDate:fStartDate.value,endDate:fEndDate.value,payerGroup:fPayerGroup.value.trim(),
  consents:{rules:fRulesConsent.value,personal:fPersonalConsent.value,image:fImageConsent.value},
  classes:old?.classes||[],notes:old?.notes||"",sourceEntryId:old?.sourceEntryId||"",sourceCreatedAt:old?.sourceCreatedAt||""};
 const selectedType=fWorkshop.value;
 if(selectedType){
   const prev=obj.classes?.[0];
   const cl=prev?{...prev}:{id:Date.now(),price:defaultWorkshopPrice(selectedType),discount:0,status:"brak"};
   cl.school=fSchool.value;cl.type=selectedType;cl.day=fDay.value;cl.time=fTime.value;
   if(!cl.price)cl.price=defaultWorkshopPrice(selectedType);
   enforceClassCapacity(obj,cl);
   if(obj.classes.length)obj.classes[0]=cl;else obj.classes=[cl];
 }
 if(old){
   const changes=[];
   [["activityStatus","status"],["school","szkołę"],["pickupPlace","salę / odbiór"],["phone","telefon"],["payerGroup","wspólnego płatnika"],["startDate","datę rozpoczęcia"],["endDate","datę zakończenia"]].forEach(([k,label])=>{if(String(old[k]||"")!==String(obj[k]||""))changes.push(`Zmieniono ${label}: „${old[k]||"brak"}” → „${obj[k]||"brak"}”.`)});
   if(JSON.stringify(old.consents||{})!==JSON.stringify(obj.consents||{}))changes.push("Zmieniono zgody.");
   changes.forEach(t=>logHistory(id,t));
 }else logHistory(id,"Dodano dziecko do bazy.");
 if(exists)data.children[data.children.findIndex(c=>c.id==id)]=obj;else data.children.push(obj);
 childrenRememberFilters();childrenViewState.focusChildId=id;save();closeModal();page='children';render();
 if(obj.classes?.[0]?.waitlist)confirmModal({title:"Grupa jest pełna",message:`Limit grupy to ${data.settings.groupLimit}. Dziecko zostało oznaczone jako lista rezerwowa.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
}

function childCard(c){
 const month=currentMonthName(),billMonth=months.includes(month)?month:"Wrzesień",ps=paymentState(c,billMonth),active=childActiveNow(c),todayCl=todayClassForChild(c);
 return `<div class="card childCardModern ${active?"":"inactiveChild"}"><div class="childhead"><div><div class="name">${c.last} ${c.first}</div>
 <div class="muted">${c.class} • ${c.school} • ${c.sex}${c.pickupPlace?` • ${c.pickupPlace}`:""} • ${c.activityStatus||"Aktywne"}</div>
 <div class="due">Należne ${billMonth}: ${money(ps.due)} • wpłacono ${money(ps.paid)}</div>
 <div class="paymentBadgeText ${paymentStatusClass(ps.kind)}">${ps.label}</div></div><button class="soft profileBtn" onclick="editChild(${c.id})">Profil</button></div>
 <div class="childQuickActions">
   <button onclick="addPayment(${c.id},'${escapeAttr(c.last)}')">＋ Wpłata</button>
   ${c.phone?`<button onclick="sendReminderSMS(${c.id},'${billMonth}')">💬 SMS</button>`:""}
   <button onclick="${todayCl?`quickAttendanceForChild(${c.id})`:`showToast('Dziś brak zajęć')`}">✓ Obecność</button>
   <button onclick="${c.classes?.length?`editClass(${c.id},${c.classes[0].id})`:`editClass(${c.id})`}">✎ Zajęcia</button>
 </div>
 ${(c.classes||[]).map(cl=>`<div class="classrow compactClassRow"><h3>${cl.type}${cl.waitlist?' <span class="waitBadge">LISTA REZERWOWA</span>':''}</h3><div class="muted">${cl.day} ${cl.time} • ${cl.school}</div></div>`).join("")}
 </div>`
}

function saveClass(cid,id,exists){
 let ch=data.children.find(c=>c.id==cid),old=exists?ch.classes.find(x=>x.id==id):null;
 let cl={id,type:clType.value,school:clSchool.value,day:clDay.value,time:clTime.value,price:+clPrice.value,discount:+clDisc.value,status:clStatus.value,waitlist:old?.waitlist||false,startDate:clStartDate?.value||(old?.startDate||ch.startDate||new Date().toISOString().slice(0,10)),endDate:clEndDate?.value||"",firstMonthOverride:(clFirstMonthOverride?.value===""?"":Number(clFirstMonthOverride.value))};
 enforceClassCapacity(ch,cl);
 if(exists)ch.classes[ch.classes.findIndex(x=>x.id==id)]=cl;else ch.classes.push(cl);
 logHistory(cid,`${exists?"Zmieniono":"Dodano"} zajęcia: ${cl.type}, ${cl.school}, ${cl.day} ${cl.time}${cl.waitlist?" — lista rezerwowa":""}.`);
 childrenRememberFilters();childrenViewState.focusChildId=cid;save();closeModal();page='children';render();
 if(cl.waitlist)confirmModal({title:"Lista rezerwowa",message:`Grupa osiągnęła limit ${data.settings.groupLimit} osób. Dziecko zapisano na listę rezerwową.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
}

(function(){
"use strict";

function normalizeChildText(s){
  return String(s||"")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .trim();
}

function childLifecycle(card, child){
  const text=normalizeChildText(card?.textContent||"");

  if(text.includes("zrezygnowal")){
    return {kind:"resigned",label:"🔴 Zrezygnował"};
  }
  if(text.includes("wstrzymane") || text.includes("wstrzymany")){
    return {kind:"paused",label:"⏸ Wstrzymane"};
  }

  try{
    if(typeof childActiveNow==="function" && childActiveNow(child)){
      return {kind:"active",label:"🟢 Aktywne"};
    }
  }catch(e){}

  return {kind:"active",label:"🟢 Aktywne"};
}

function replaceLeafText(root, fromValues, to){
  if(!root)return;
  [...root.querySelectorAll("*")].forEach(el=>{
    if(el.children.length)return;
    const t=(el.textContent||"").trim();
    if(fromValues.includes(t))el.textContent=to;
  });
}

function patchChildCardStatus(card, child){
  if(!card || !child)return;
  const state=childLifecycle(card,child);

  replaceLeafText(card,["Aktywne","🟢 Aktywne"],"🟢 Aktywne");
  replaceLeafText(card,["Wstrzymane"],"⏸ Wstrzymane");
  replaceLeafText(card,["Zrezygnował","Zrezygnowal"],"🔴 Zrezygnował");

  if(state.kind!=="active"){
    const badge=card.querySelector(".paymentBadgeText");
    if(badge){
      badge.classList.remove("free","paid","partial","unpaid","overpaid");
      badge.classList.add(state.kind==="resigned"?"childResigned107":"childPaused107");
      badge.textContent=state.label;
    }else{
      const free=[...card.querySelectorAll("*")].find(el=>
        el.children.length===0 && (el.textContent||"").trim()==="BEZPŁATNE"
      );
      if(free){
        free.textContent=state.label;
        free.classList.add(state.kind==="resigned"?"childResigned107":"childPaused107");
      }
    }
  }
}

function patchChildrenListStatuses(){
  if(typeof page!=="undefined" && page!=="children")return;
  const list=document.getElementById("childrenList");
  if(!list)return;

  let visible=[];
  try{
    visible=typeof getFilteredChildren==="function"
      ? getFilteredChildren()
      : (data.children||[]);
  }catch(e){
    visible=data.children||[];
  }

  const cards=[...list.children].filter(el=>el.classList?.contains("card"));
  cards.forEach((card,i)=>patchChildCardStatus(card,visible[i]));
}

function patchProfileStatus(box){
  if(!box)return;
  replaceLeafText(box,["Aktywne","🟢 Aktywne"],"🟢 Aktywne");
  replaceLeafText(box,["Wstrzymane"],"⏸ Wstrzymane");
  replaceLeafText(box,["Zrezygnował","Zrezygnowal"],"🔴 Zrezygnował");
}

/* ---------- SZYBKA WPŁATA Z PROFILU ---------- */
function patchProfileQuickPay(childId, box){
  if(!box)return;
  const section=box.querySelector('.childProfileSection[data-section="payments"]');
  if(!section)return;

  const btn=[...section.querySelectorAll("button")]
    .find(b=>(b.textContent||"").includes("Dodaj wpłatę"));

  if(!btn || btn.dataset.quickPay107==="1")return;
  btn.dataset.quickPay107="1";

  btn.onclick=function(e){
    e.preventDefault();
    e.stopPropagation();

    if(typeof closeModal==="function")closeModal();

    if(typeof openQuickPayForChild==="function"){
      openQuickPayForChild(Number(childId));
      return;
    }

    if(typeof openQuickPayment89==="function"){
      let prefs={};
      try{prefs=JSON.parse(localStorage.getItem("rw89_quickpay")||"{}")}catch(err){}
      prefs.childId=Number(childId);
      if(!prefs.month && typeof currentMonthName==="function"){
        prefs.month=currentMonthName();
      }
      localStorage.setItem("rw89_quickpay",JSON.stringify(prefs));
      openQuickPayment89();
    }
  };
}

/* ---------- USUWANIE DZIECKA — TYLKO DANE ---------- */
function injectDeleteChildButton(childId, box){
  if(!box || box.querySelector("#deleteChild"))return;

  const dataSection=box.querySelector('.childProfileSection[data-section="data"]');
  if(!dataSection)return;

  const actions=[...dataSection.querySelectorAll(".actions")].pop();

  const btn=document.createElement("button");
  btn.id="deleteChild";
  btn.type="button";
  btn.className="danger deleteChild";
  btn.textContent="Usuń dziecko";
  btn.onclick=()=>deleteChild(Number(childId));

  if(actions)actions.insertAdjacentElement("beforebegin",btn);
  else dataSection.appendChild(btn);
}

window.deleteChild=async function(childId){
  const child=(data.children||[]).find(c=>Number(c.id)===Number(childId));
  if(!child)return;

  const name=`${child.last||""} ${child.first||""}`.trim();
  let ok=false;

  if(typeof confirmModal==="function"){
    try{
      ok=await confirmModal({
        title:"Usunąć dziecko?",
        message:`${name}. Zostanie usunięty profil dziecka oraz jego wpłaty, obecności i zaplanowane odrabiania. Tej operacji nie można cofnąć.`,
        confirmText:"Usuń dziecko",
        cancelText:"Anuluj",
        danger:true
      });
    }catch(e){
      ok=window.confirm(`Usunąć dziecko ${name}? Tej operacji nie można cofnąć.`);
    }
  }else{
    ok=window.confirm(`Usunąć dziecko ${name}? Tej operacji nie można cofnąć.`);
  }

  if(!ok)return;

  data.children=(data.children||[]).filter(c=>Number(c.id)!==Number(childId));
  data.payments=(data.payments||[]).filter(p=>Number(p.childId)!==Number(childId));

  if(Array.isArray(data.makeups)){
    data.makeups=data.makeups.filter(m=>Number(m.childId)!==Number(childId));
  }
  if(Array.isArray(data.history)){
    data.history=data.history.filter(h=>Number(h.childId)!==Number(childId));
  }

  if(data.attendance && typeof data.attendance==="object"){
    Object.keys(data.attendance).forEach(key=>{
      const rec=data.attendance[key];
      if(!rec || typeof rec!=="object")return;

      if(Number(rec.childId)===Number(childId)){
        delete data.attendance[key];
        return;
      }
      delete rec[childId];
      delete rec[String(childId)];
    });
  }

  save();
  closeModal();
  page="children";
  render();

  if(typeof showToast==="function")showToast("Dziecko usunięte");
};

/* ---------- PODPINANIE DO ISTNIEJĄCYCH EKRANÓW ---------- */

/* Dzieci: patch bez obserwatora całego dokumentu. */
const originalChildrenView=window.children;
if(typeof originalChildrenView==="function"){
  window.children=function(){
    originalChildrenView();
    setTimeout(patchChildrenListStatuses,0);
  };
}

/* Profil: v94 jest ładowany przed children.js, więc zachowujemy odrabianie. */
const originalEditChildProfile=window.editChild;
if(typeof originalEditChildProfile==="function"){
  window.editChild=function(id){
    originalEditChildProfile(id);
    if(!id)return;

    const patch=()=>{
      const box=document.querySelector("#modal .modalbox");
      if(!box)return;
      patchProfileStatus(box);
      patchProfileQuickPay(id,box);
      injectDeleteChildButton(id,box);
    };

    setTimeout(patch,0);
    setTimeout(patch,60);
  };
}

/* Przełączanie zakładek profilu może przebudować fragment DOM.
   Delegowany click jest lekki i działa tylko po kliknięciu zakładki profilu. */
document.addEventListener("click",e=>{
  const btn=e.target.closest?.("button");
  if(!btn)return;
  const label=(btn.textContent||"").trim();
  if(!["Dane","Zajęcia","Płatności","Frekwencja","Historia","Uwagi"].includes(label))return;

  setTimeout(()=>{
    const box=document.querySelector("#modal .modalbox");
    if(!box)return;

    const deleteBtn=box.querySelector("#deleteChild");
    if(deleteBtn){
      /* Przycisk fizycznie znajduje się w sekcji Dane,
         więc nie występuje w innych zakładkach. */
      deleteBtn.style.display=label==="Dane" ? "" : "none";
    }

    if(label==="Płatności"){
      const selected=box.querySelector('.childProfileSection[data-section="payments"] button[onclick*="addPayment("]');
      const match=selected?.getAttribute("onclick")?.match(/addPayment\((\d+)/);
      if(match)patchProfileQuickPay(Number(match[1]),box);
    }
  },0);
},true);

const style=document.createElement("style");
style.textContent=`
.childPaused107{color:#9a6800!important;font-weight:900}
.childResigned107{color:#c63b4b!important;font-weight:900}
.deleteChild{width:100%;margin:18px 0 8px}
`;
document.head.appendChild(style);

window.RWModules=window.RWModules||{};
window.RWModules.children={version:"11.4"};

})();
