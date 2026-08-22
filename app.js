
const VERSION="6.1";
const months=["Wrzesień","Październik","Listopad","Grudzień","Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec"];
const schools=["SP 162","ZSP 17"];
const workshops=["Rękodzieło","Zaawansowane","Artystyczne"];
const days=["Poniedziałek","Wtorek","Środa","Czwartek","Piątek"];
const times=["13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
const pickupPlaces=["Sala 1","Sala 2","Sala 3","Sala 4","Sala 5","Przychodzi sam/a"];
let data=JSON.parse(localStorage.getItem("rw45")||"null")||{
 children:[
 {id:1,last:"Kolasa",first:"Nikola",sex:"Dziewczynka",class:"4A",school:"SP 162",club:"Tak",parent:"Łukasz Kolasa",phone:"50340488",email:"mexilianpl@gmail.com",classes:[
  {id:11,type:"Rękodzieło",day:"Wtorek",time:"15:00",school:"SP 162",price:defaultWorkshopPrice(workshops[0]),discount:0,status:"brak"},
  {id:12,type:"Zaawansowane",day:"Środa",time:"15:30",school:"SP 162",price:165,discount:10,status:"brak"}]},
 {id:2,last:"Kowalski",first:"Jan",sex:"Chłopiec",class:"5A",school:"ZSP 17",club:"Nie",parent:"",phone:"",email:"",classes:[{id:21,type:"Rękodzieło",day:"Wtorek",time:"15:30",school:"ZSP 17",price:defaultWorkshopPrice(workshops[0]),discount:0,status:"brak"}]},
 {id:3,last:"Nowak",first:"Maja",sex:"Dziewczynka",class:"3B",school:"SP 162",club:"Tak",parent:"",phone:"",email:"",classes:[{id:31,type:"Artystyczne",day:"Wtorek",time:"15:30",school:"SP 162",price:155,discount:100,status:"bezplatne"}]}
 ],payments:[],income:[]};
data.attendance=data.attendance||{};

data.settings=data.settings||{};
data.settings.schools=data.settings.schools||[...schools];
data.settings.workshops=data.settings.workshops||workshops.map((name,i)=>({name,price:[155,165,155][i]||155}));
data.settings.days=data.settings.days||[...days];
data.settings.times=data.settings.times||[...times];
function syncSettingsArrays(){
 schools.splice(0,schools.length,...data.settings.schools);
 workshops.splice(0,workshops.length,...data.settings.workshops.map(x=>x.name));
 days.splice(0,days.length,...data.settings.days);
 times.splice(0,times.length,...data.settings.times);
}
syncSettingsArrays();

let page="start"; const app=document.querySelector("#app"), nav=document.querySelector("#nav");
function save(){localStorage.setItem("rw45",JSON.stringify(data))}
function money(v){return Number(v||0).toLocaleString("pl-PL",{minimumFractionDigits:2,maximumFractionDigits:2})+" zł"}
function dueClass(c){return c.status==="bezplatne"?0:Math.max(0,c.price*(1-(c.discount||0)/100))}
function childDue(ch){return ch.classes.reduce((s,c)=>s+dueClass(c),0)}

function childPaymentsForMonth(ch,month="Wrzesień"){
  return data.payments.filter(p=>Number(p.childId)===Number(ch.id)&&p.month===month)
    .reduce((s,p)=>s+Number(p.amount||0),0);
}
function paymentState(ch,month="Wrzesień"){
  const due=childDue(ch), paid=childPaymentsForMonth(ch,month);
  if(due<=0)return {kind:"free",due,paid,missing:0,extra:Math.max(0,paid),label:"BEZPŁATNE"};
  if(paid<=0)return {kind:"unpaid",due,paid,missing:due,extra:0,label:"BRAK WPŁATY"};
  if(paid<due)return {kind:"partial",due,paid,missing:due-paid,extra:0,label:`CZĘŚCIOWO WPŁACONO • BRAKUJE ${money(due-paid)}`};
  if(paid>due)return {kind:"overpaid",due,paid,missing:0,extra:paid-due,label:`NADPŁATA ${money(paid-due)}`};
  return {kind:"paid",due,paid,missing:0,extra:0,label:"WPŁACONO"};
}
function paymentStatusClass(kind){
  return kind==="paid"?"paid":kind==="partial"?"partial":kind==="overpaid"?"overpaid":kind==="free"?"free":"unpaid";
}
function paymentFingerprint({date="",amount=0,payer="",title="",childId=""}){
  const clean=s=>normPerson(String(s||"")).replace(/\s+/g," ");
  return [date,Number(amount||0).toFixed(2),clean(payer),clean(title),String(childId||"")].join("|");
}
function existingPaymentFingerprint(p){
  if(p.sourceFingerprint)return p.sourceFingerprint;
  const note=String(p.note||"").replace(/^Import OCR:\s*/i,"");
  const parts=note.split(" • ");
  return paymentFingerprint({date:p.date,amount:p.amount,payer:parts[0]||"",title:parts.slice(1).join(" • "),childId:p.childId});
}
function findDuplicatePayment(candidate){
  const fp=paymentFingerprint(candidate);
  return data.payments.find(p=>existingPaymentFingerprint(p)===fp) || null;
}


function defaultWorkshopPrice(type){
 const row=data.settings?.workshops?.find(x=>x.name===type);
 return Number(row?.price||155);
}
function opt(arr,val){return arr.map(x=>`<option ${x==val?"selected":""}>${x}</option>`).join("")}
const tabs=[["start","⌂","Start"],["children","👥","Dzieci"],["payments","✓","Wpłaty"],["income","+","Przychody"],["signups","✉","Zapisy"],["groups","☷","Grupy"],["reports","▥","Raporty"],["lists","☑","Listy"],["settings","⚙","Ustawienia"]];
function renderNav(){nav.innerHTML=tabs.map(t=>`<button class="${page==t[0]?"active":""}" onclick="go('${t[0]}')"><div>${t[1]}</div>${t[2]}</button>`).join("")}
function go(p){page=p;render()}
function render(){renderNav(); ({start,children,payments,income,signups,groups,reports,lists,settings}[page]||start)()}


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
function classesGroupedForDay(items){
 const map={};
 items.forEach(({c,cl})=>{
   const key=[cl.school,cl.type,cl.day,cl.time].join("|");
   if(!map[key])map[key]={school:cl.school,type:cl.type,day:cl.day,time:cl.time,children:[]};
   if(!map[key].children.some(x=>x.id===c.id))map[key].children.push(c);
 });
 return Object.values(map).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
}
function goToGroup(school,day,time){
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
function currentMonthDashboard(){
 const period=currentDashboardPeriod();
 const activeSchoolMonth=months.includes(period.month);
 const due=activeSchoolMonth?data.children.reduce((s,c)=>s+childDue(c),0):0;
 const childPaid=data.payments.filter(p=>paymentBelongsToDashboardMonth(p,period))
   .reduce((s,p)=>s+Number(p.amount||0),0);
 const extra=data.income.filter(i=>incomeBelongsToDashboardMonth(i,period))
   .reduce((s,i)=>s+Number(i.amount||0),0);
 const missing=Math.max(0,due-childPaid);
 return {period,due,childPaid,extra,total:childPaid+extra,missing,activeSchoolMonth};
}
function start(){
 const dash=currentMonthDashboard();
 const tasks=taskCounts(), next=nextClassDayInfo(), groupsToday=classesGroupedForDay(next.items);
 const dayText=next.delta===0?"Dzisiejsze zajęcia":next.delta===1?"Jutrzejsze zajęcia":next.delta!==null?`Najbliższe zajęcia za ${next.delta} dni`:"Najbliższe zajęcia";
 app.innerHTML=`<div class="eyebrow">PANEL GŁÓWNY</div><h2 class="title">Wszystko w jednym miejscu</h2>
 <div class="currentPeriodLabel">${dash.period.month} ${dash.period.year}</div>
 <div class="summary dashboardSummary">
   <div class="stat">Należne w miesiącu<b>${money(dash.due)}</b></div>
   <div class="stat">Wpłaty dzieci<b>${money(dash.childPaid)}</b></div>
   <div class="stat missingStat">Brakuje wpłat<b>${money(dash.missing)}</b></div>
   <div class="stat">Dodatkowe przychody<b>${money(dash.extra)}</b></div>
   <div class="stat">Razem wpływy<b>${money(dash.total)}</b></div>
 </div>
 ${!dash.activeSchoolMonth?`<div class="notice dashboardNotice">Aktualny miesiąc (${dash.period.month}) jest poza standardowym okresem zajęć Wrzesień–Czerwiec, dlatego należność miesięczna wynosi 0,00 zł.</div>`:""}
 <div class="card"><h2>Do zrobienia</h2><div class="todoGrid">
   <div class="todoItem dangerLite"><b>${tasks.unpaid}</b><span>brakujących wpłat</span></div>
   <div class="todoItem warnLite"><b>${tasks.partial}</b><span>częściowych wpłat</span></div>
   <div class="todoItem infoLite"><b>${tasks.noConsent}</b><span>braków danych o zgodzie na wizerunek</span></div>
 </div></div>
 <div class="card"><h2>${dayText}</h2>${groupsToday.map(g=>`<button class="nextClassCard" onclick="goToGroup('${g.school}','${g.day}','${g.time}')"><b>${g.school} • ${g.type}</b><span>${g.day} ${g.time} • ${g.children.length} dzieci</span></button>`).join("")||'<div class="muted">Brak zaplanowanych zajęć.</div>'}</div>
 <div class="card"><h2>Szybkie wyszukiwanie dziecka</h2><div class="search"><input id="quick" placeholder="Nazwisko lub imię..." oninput="quickSearch(this.value)"></div><div id="quickResults"></div></div>`;
}
function quickSearch(q){let el=document.querySelector("#quickResults");q=q.toLowerCase().trim(); if(!q){el.innerHTML="";return} el.innerHTML=data.children.filter(c=>(c.last+" "+c.first).toLowerCase().includes(q)).map(c=>`<div class="card" onclick="openChild(${c.id})"><b class="name">${c.last} ${c.first}</b><div class="muted">${c.class} • ${c.school} • zajęcia: ${c.classes.length}</div></div>`).join("")||"Brak wyników"}
function children(){
 app.innerHTML=`<div class="titleline"><div><div class="eyebrow">BAZA</div><h2 class="title">Dzieci</h2></div></div>
 <div class="search"><input id="cs" placeholder="Szukaj po nazwisku / imieniu..." oninput="filterChildren()"></div>
 <div class="childrenFilters card">
   <label>Szkoła</label>
   <select id="schoolFilter" onchange="childrenSchoolChanged()">
     <option value="">— wybierz szkołę —</option>
     <option value="__ALL__">Wszystkie szkoły</option>
     ${schools.map(s=>`<option>${s}</option>`).join("")}
   </select>
   <div id="advancedChildrenFilters" class="advancedChildrenFilters" style="display:none">
     <label>Rodzaj warsztatów</label>
     <select id="workshopFilter" onchange="filterChildren()">
       <option value="">Wszystkie warsztaty</option>
       ${workshops.map(w=>`<option>${w}</option>`).join("")}
     </select>
     <div class="grid2">
       <div><label>Dzień</label><select id="dayFilter" onchange="filterChildren()"><option value="">Wszystkie dni</option>${days.map(d=>`<option>${d}</option>`).join("")}</select></div>
       <div><label>Godzina</label><select id="timeFilter" onchange="filterChildren()"><option value="">Wszystkie godziny</option>${times.map(t=>`<option>${t}</option>`).join("")}</select></div>
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
       <button class="dark" onclick="printFilteredChildren()">🖨 Drukuj wybraną listę</button>
       <button class="soft" onclick="printAttendanceList()">✓ Lista obecności</button>
       <button class="soft" onclick="clearChildrenFilters()">Wyczyść filtry</button>
     </div>
   </div>
 </div>
 <div id="childrenCount" class="childrenCount"></div>
 <div id="childrenList"></div>`;
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
 return sortChildrenList(filtered);;
}
function filterChildren(){
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
 ${c.classes.map(cl=>`<div class="classrow"><h3>${cl.type}</h3><div class="muted">${cl.day} ${cl.time} • ${cl.school}</div><div class="muted">Cena ${money(dueClass(cl))}${cl.discount?` • rabat ${cl.discount}%`:""}</div><div class="actions"><button class="soft" onclick="editClass(${c.id},${cl.id})">Edytuj zajęcia</button><button class="danger" onclick="deleteClass(${c.id},${cl.id})">Usuń zajęcia</button></div></div>`).join("")}
 <div class="actions"><button class="primary" onclick="editClass(${c.id})">+ Dodaj zajęcia</button></div></div>`}
function modal(html){document.body.insertAdjacentHTML("beforeend",`<div class="modal" id="modal"><div class="modalbox">${html}</div></div>`)}
function closeModal(){document.querySelector("#modal")?.remove()}
function consentLabel(v){
 const x=String(v||"").trim().toLowerCase();
 if(["tak","yes","1","true","zgoda"].includes(x))return "Tak";
 if(["nie","no","0","false","brak"].includes(x))return "Nie";
 return "";
}
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
 <label>Szkoła</label><select id="fSchool">${opt(schools,c.school)}</select>
 <label>Sala / sposób odbioru</label><select id="fPickup">${opt(["","Sala 1","Sala 2","Sala 3","Sala 4","Sala 5","Przychodzi sam/a"],c.pickupPlace||"")}</select>
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
 if(exists)data.children[data.children.findIndex(c=>c.id==id)]=obj;else data.children.push(obj);
 save();closeModal();render()
}
function editClass(cid,clid){let ch=data.children.find(c=>c.id==cid),cl=ch.classes.find(x=>x.id==clid)||{id:Date.now(),type:workshops[0],day:days[0],time:times[0],school:ch.school,price:defaultWorkshopPrice(workshops[0]),discount:0,status:"brak"};
 modal(`<h2>${clid?"Edytuj":"Dodaj"} zajęcia</h2><label>Rodzaj zajęć</label><select id="clType" onchange="if(!this.dataset.edited){clPrice.value=defaultWorkshopPrice(this.value)}">${opt(workshops,cl.type)}</select><label>Szkoła</label><select id="clSchool">${opt(schools,cl.school)}</select>
 <div class="grid2"><div><label>Dzień</label><select id="clDay">${opt(days,cl.day)}</select></div><div><label>Godzina</label><select id="clTime">${opt(times,cl.time)}</select></div></div>
 <div class="grid2"><div><label>Cena regularna</label><input id="clPrice" type="number" value="${cl.price}" oninput="clType.dataset.edited=1"></div><div><label>Rabat %</label><select id="clDisc">${opt([0,10,20,30,50,100],cl.discount)}</select></div></div>
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
async function deleteClass(cid,id){let ch=data.children.find(c=>c.id==cid),cl=ch?.classes.find(x=>x.id==id);let ok=await confirmModal({title:"Usunąć zajęcia?",message:`${cl?cl.type+" • "+cl.day+" "+cl.time+". ":""}Tej operacji nie można cofnąć.`,confirmText:"Usuń zajęcia"});if(!ok)return;ch.classes=ch.classes.filter(x=>x.id!=id);save();render()}
function openChild(id){page="children";render();setTimeout(()=>editChild(id),0)}
function payments(){
 let paid=data.payments.reduce((s,p)=>s+Number(p.amount),0), due=data.children.reduce((s,c)=>s+childDue(c),0),inc=data.income.reduce((s,p)=>s+Number(p.amount),0);
 app.innerHTML=`<div class="eyebrow">FINANSE</div><h2 class="title">Wpłaty</h2><div class="summary"><div class="stat">Należne<b>${money(due)}</b></div><div class="stat">Wpłaty dzieci<b>${money(paid)}</b></div><div class="stat">Dodatkowe przychody<b>${money(inc)}</b></div><div class="stat">Razem wpływy<b>${money(paid+inc)}</b></div></div>
 <div class="card"><h2>Dodaj wpłatę</h2><div class="search"><input id="paySearch" placeholder="Szukaj dziecka..." oninput="payHints(this.value)"></div><div id="payHints"></div><button class="primary" onclick="addPayment()">+ Dodaj wpłatę ręcznie</button></div>
 <div class="card"><h2>Import wpłat ze screena</h2><p class="muted">Dodaj zrzut ekranu z aplikacji bankowej. Aplikacja sprawdzi kwotę względem należności i ostrzeże także przed powtórnym dodaniem tego samego przelewu.</p><div class="drop" onclick="screenInput.click()">📷<h3>Dodaj zrzut ekranu</h3><div>PNG lub JPG</div></div><button class="dark" onclick="screenInput.click()">📷 Rozpoznaj wpłaty ze screena</button><div id="ocrStatus"></div></div>
 <div class="card"><h2>Lista wpłat</h2>${data.payments.map(p=>{
   const ch=data.children.find(c=>Number(c.id)===Number(p.childId));
   const ps=ch?paymentState(ch,p.month):null;
   return `<div class="classrow"><b>${p.child}</b><div>${money(p.amount)} • ${p.month} • ${p.date||""}</div>${ps?`<div class="paymentBadgeText ${paymentStatusClass(ps.kind)}">${ps.label}</div>`:""}<button class="danger" onclick="deletePayment(${p.id})">Usuń</button></div>`;
 }).join("")||'<div class="muted">Brak wpłat.</div>'}</div>`}
function payHints(q){q=q.toLowerCase();payHints.innerHTML=data.children.filter(c=>(c.last+" "+c.first).toLowerCase().includes(q)&&q).map(c=>`<button class="soft" onclick="addPayment(${c.id})">${c.last} ${c.first}</button>`).join("")}
function addPayment(cid){let ch=data.children.find(c=>c.id==cid);modal(`<h2>Dodaj wpłatę</h2><label>Dziecko</label><select id="pChild">${data.children.map(c=>`<option value="${c.id}" ${c.id==cid?"selected":""}>${c.last} ${c.first}</option>`).join("")}</select><div class="grid2"><div><label>Miesiąc</label><select id="pMonth">${opt(months,"Wrzesień")}</select></div><div><label>Kwota</label><input id="pAmount" type="number"></div></div><label>Data</label><input id="pDate" type="date"><label>Tytuł / uwagi</label><input id="pNote"><div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="savePayment()">Zapisz</button></div>`)}
async function savePayment(){
 let ch=data.children.find(c=>c.id==pChild.value), amount=+pAmount.value, month=pMonth.value;
 const candidate={date:pDate.value,amount,payer:"RĘCZNIE",title:pNote.value,childId:ch.id};
 const dup=findDuplicatePayment(candidate);
 if(dup){
   await confirmModal({title:"Ta wpłata już istnieje",message:`${ch.last} ${ch.first} • ${money(amount)} • ${pDate.value||"brak daty"}. Nie zapisuję jej ponownie.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
   return;
 }
 data.payments.push({id:Date.now(),childId:ch.id,child:ch.last+" "+ch.first,month,amount,date:pDate.value,note:pNote.value,sourceFingerprint:paymentFingerprint(candidate)});
 save();closeModal();render();
 const ps=paymentState(ch,month);
 if(ps.kind==="partial") await confirmModal({title:"Wpłata częściowa",message:`Wpłacono ${money(ps.paid)} z ${money(ps.due)}. Brakuje ${money(ps.missing)}.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
 else if(ps.kind==="overpaid") await confirmModal({title:"Nadpłata",message:`Wpłacono ${money(ps.paid)}, należne ${money(ps.due)}. Nadpłata: ${money(ps.extra)}.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
}
async function deletePayment(id){let p=data.payments.find(x=>x.id==id);let ok=await confirmModal({title:"Usunąć wpłatę?",message:`${p?p.child+" • "+money(p.amount)+". ":""}Tej operacji nie można cofnąć.`,confirmText:"Usuń wpłatę"});if(!ok)return;data.payments=data.payments.filter(p=>p.id!=id);save();render()}

function normalizeOCR(s){return (s||"").replace(/\u00a0/g," ").replace(/[|]/g,"I").replace(/\s+/g," ").trim()}
function parseMoney(s){
  let m=(s||"").match(/(\d{1,4}(?:[ .]\d{3})*[,.]\d{2})\s*(?:PLN|zł)?/i);
  if(!m)return null;
  return Number(m[1].replace(/[ .](?=\d{3}(?:[,.]|$))/g,"").replace(",","."));
}
function parseDate(s){
  let m=(s||"").match(/\b([0-3]?\d)[.\/-]([01]?\d)[.\/-](20\d{2})\b/);
  if(!m)return "";
  return `${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
}
function normPerson(s){
  return (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase()
    .replace(/[^A-Z0-9 -]/g," ").replace(/\s+/g," ").trim();
}
function nameTokens(s){
  return normPerson(s).split(" ").filter(x=>x.length>=2);
}
function probableName(line){
  let cleaned=(line||"")
    .replace(/\b\d{1,4}(?:[ .]\d{3})*[,.]\d{2}\s*(?:PLN|ZŁ)?\b/ig," ")
    .replace(/\bPRZELEW\b.*$/i," ").trim();
  let words=cleaned.split(/\s+/).filter(w=>/^[A-ZĄĆĘŁŃÓŚŹŻ-]{2,}$/.test(w));
  if(words.length>=2)return words.slice(0,4).join(" ");
  return "";
}
function personPairMatch(sourceName,targetName){
  const s=nameTokens(sourceName), t=nameTokens(targetName);
  if(s.length<2||t.length<2)return 0;
  const sFirst=s[0], sLast=s[s.length-1], tFirst=t[0], tLast=t[t.length-1];
  const firstOk=sFirst===tFirst || (Math.min(sFirst.length,tFirst.length)>=3 && (sFirst.startsWith(tFirst)||tFirst.startsWith(sFirst)));
  const lastMin=Math.min(sLast.length,tLast.length);
  const lastOk=sLast===tLast || (lastMin>=4 && (sLast.startsWith(tLast)||tLast.startsWith(sLast)));
  if(sFirst===tFirst && sLast===tLast)return 100;
  if(firstOk && lastOk)return 88;
  return 0;
}
function textContainsPerson(text,person){
  const src=normPerson(text), p=nameTokens(person);
  if(p.length<2)return 0;
  const first=p[0], last=p[p.length-1];
  const words=src.split(" ");
  const firstOk=words.some(w=>w===first || (Math.min(w.length,first.length)>=3 && (w.startsWith(first)||first.startsWith(w))));
  const lastOk=words.some(w=>w===last || (Math.min(w.length,last.length)>=4 && (w.startsWith(last)||last.startsWith(w))));
  if(firstOk&&lastOk)return words.includes(first)&&words.includes(last)?82:72;
  return 0;
}
function bestChildMatch(tx){
  let candidates=[];
  data.children.forEach(c=>{
    let parentScore=personPairMatch(tx.payer,c.parent||"");
    let childScore=textContainsPerson(tx.title||tx.raw,`${c.first} ${c.last}`);
    let parentInText=textContainsPerson(tx.payer||tx.raw,c.parent||"");
    let score=Math.max(parentScore,parentInText?90:0,childScore);
    if(score>0)candidates.push({child:c,score});
  });
  candidates.sort((a,b)=>b.score-a.score);
  if(!candidates.length)return null;
  // Automatyczne zaznaczenie tylko przy mocnym, jednoznacznym dopasowaniu.
  if(candidates[0].score<70)return null;
  if(candidates[1] && candidates[1].score===candidates[0].score)return null;
  return candidates[0];
}
function stripAmount(line){
  return (line||"").replace(/\b\d{1,4}(?:[ .]\d{3})*[,.]\d{2}\s*(?:PLN|ZŁ)?\b/ig," ").replace(/\s+/g," ").trim();
}
function parseBankOCR(text){
  const raw=(text||"").split(/\n+/).map(x=>normalizeOCR(x)).filter(Boolean);
  let currentDate="",tx=[];
  for(let i=0;i<raw.length;i++){
    const line=raw[i],d=parseDate(line);
    if(d){currentDate=d;continue}
    const amount=parseMoney(line);
    if(amount===null)continue;

    const prev=raw[i-1]||"";
    const next=raw[i+1]||"";
    const prevIsDate=!!parseDate(prev), prevHasAmount=parseMoney(prev)!==null;
    const nextIsDate=!!parseDate(next), nextHasAmount=parseMoney(next)!==null;

    // W widoku bankowym nadawca jest zwykle w wierszu nad tytułem/kwotą.
    const payerLine=(!prevIsDate&&!prevHasAmount)?prev:"";
    const payer=probableName(payerLine);
    let title=stripAmount(line);
    if(!nextIsDate&&!nextHasAmount && next && !probableName(next)) title += " "+next;

    const item={
      id:Date.now()+i,
      date:currentDate,
      amount,
      payer:payer||"",
      title:title.trim(),
      raw:[payerLine,line].filter(Boolean).join(" ")
    };
    item.match=bestChildMatch(item);
    tx.push(item);
  }
  const seen=new Set();
  return tx.filter(t=>{
    const k=`${t.date}|${t.amount}|${normPerson(t.payer)}|${normPerson(t.title)}`;
    if(seen.has(k))return false; seen.add(k); return true;
  });
}
function ocrChildOptions(selected){
  return `<option value="">— wybierz dziecko —</option>`+
    data.children.slice().sort((a,b)=>a.last.localeCompare(b.last,"pl"))
      .map(c=>`<option value="${c.id}" ${String(c.id)===String(selected)?"selected":""}>${c.last} ${c.first}</option>`).join("");
}
function showOCRReview(items,fileName){
  if(!items.length){
    modal(`<h2>Nie udało się rozpoznać wpłat</h2><div class="notice">Plik: <b>${fileName}</b></div><p>Spróbuj zrobić screen tak, aby były widoczne całe wiersze: data, nadawca/tytuł i kwota.</p><div class="actions"><button class="soft" onclick="closeModal()">Zamknij</button><button class="dark" onclick="closeModal();screenInput.click()">Spróbuj inny screen</button></div>`);
    return;
  }
  window.__ocrItems=items;
  modal(`<h2>Weryfikacja rozpoznanych wpłat</h2>
    <div class="notice">Rozpoznano <b>${items.length}</b> pozycji. Każdą wpłatę możesz zaakceptować osobno.</div>
    <div id="ocrReview">${items.map((t,idx)=>`<div class="ocrLine" id="ocrLine${idx}">
      <h4>${t.payer||"Niepewny nadawca"} — ${money(t.amount)}</h4>
      <div class="muted">${t.date||"brak daty"}${t.title?`<br>${t.title}`:""}</div>
      <div class="ocrGrid">
        <div><label>Przypisz do dziecka</label><select id="ocrChild${idx}">${ocrChildOptions(t.match?.child?.id||"")}</select></div>
        <div><label>Miesiąc</label><select id="ocrMonth${idx}">${months.map(m=>`<option>${m}</option>`).join("")}</select></div>
      </div>
      <div class="${t.match?'ocrOk':'ocrWarn'}" id="ocrHint${idx}">
        ${t.match?`Propozycja: ${t.match.child.last} ${t.match.child.first}`:"Brak pewnego automatycznego dopasowania"}
      </div>
      <div class="actions ocrItemActions">
        <button class="primary" id="ocrAccept${idx}" onclick="acceptOCRPayment(${idx})">✓ Akceptuję tę wpłatę</button>
        <button class="soft" onclick="skipOCRPayment(${idx})">Pomiń</button>
      </div>
    </div>`).join("")}</div>
    <div class="actions"><button class="soft" onclick="closeModal()">Zamknij</button><button class="dark" onclick="saveAllAssignedOCR()">Zapisz wszystkie przypisane</button></div>`);
}
function persistOCRItem(t,idx){
  const select=document.querySelector(`#ocrChild${idx}`);
  const monthEl=document.querySelector(`#ocrMonth${idx}`);
  if(!select||!monthEl)return {ok:false,reason:"missing"};
  const cid=Number(select.value||0);
  if(!cid)return {ok:false,reason:"nochild"};
  const ch=data.children.find(c=>c.id===cid);
  if(!ch)return {ok:false,reason:"nochild"};
  const candidate={date:t.date||"",amount:t.amount,payer:t.payer||"",title:t.title||"",childId:cid};
  const duplicate=findDuplicatePayment(candidate);
  if(duplicate)return {ok:false,reason:"duplicate",duplicate,ch};
  data.payments.push({
    id:Date.now()+idx,
    childId:cid,
    child:ch.last+" "+ch.first,
    month:monthEl.value,
    amount:t.amount,
    date:t.date||"",
    note:`Import OCR: ${t.payer||"nadawca niepewny"}${t.title?" • "+t.title:""}`,
    sourceFingerprint:paymentFingerprint(candidate)
  });
  return {ok:true,ch,month:monthEl.value,state:paymentState(ch,monthEl.value)};
}
function markOCRDone(idx,label="Zapisano"){
  const line=document.querySelector(`#ocrLine${idx}`);
  if(!line)return;
  line.classList.add("ocrAccepted");
  line.querySelectorAll("select,button").forEach(el=>el.disabled=true);
  const btn=document.querySelector(`#ocrAccept${idx}`);
  if(btn){btn.textContent="✓ "+label;btn.classList.add("acceptedBtn")}
}
async function acceptOCRPayment(idx){
  const t=window.__ocrItems?.[idx];
  if(!t)return;
  const cid=Number(document.querySelector(`#ocrChild${idx}`)?.value||0);
  if(!cid){document.querySelector(`#ocrHint${idx}`).textContent="Najpierw wybierz dziecko.";document.querySelector(`#ocrHint${idx}`).className="ocrWarn";return}
  const result=persistOCRItem(t,idx);
  if(result.reason==="duplicate"){
    document.querySelector(`#ocrHint${idx}`).textContent="⚠ Ta sama wpłata została już wcześniej zapisana — pomijam duplikat.";
    document.querySelector(`#ocrHint${idx}`).className="ocrDuplicate";
    markOCRDone(idx,"Duplikat — nie zapisano");
    return;
  }
  if(result.ok){
    save();
    const ps=result.state;
    if(ps.kind==="partial"){
      document.querySelector(`#ocrHint${idx}`).textContent=`CZĘŚCIOWO WPŁACONO • BRAKUJE ${money(ps.missing)}`;
      document.querySelector(`#ocrHint${idx}`).className="ocrPartial";
      markOCRDone(idx,"Wpłata częściowa");
    }else if(ps.kind==="overpaid"){
      document.querySelector(`#ocrHint${idx}`).textContent=`NADPŁATA ${money(ps.extra)}`;
      document.querySelector(`#ocrHint${idx}`).className="ocrOverpaid";
      markOCRDone(idx,"Wpłata z nadpłatą");
    }else{
      document.querySelector(`#ocrHint${idx}`).textContent=ps.label;
      document.querySelector(`#ocrHint${idx}`).className="ocrOk";
      markOCRDone(idx,"Wpłata zaakceptowana");
    }
  }
}
function skipOCRPayment(idx){markOCRDone(idx,"Pominięto")}
function saveAllAssignedOCR(){
  let saved=0,duplicates=0;
  (window.__ocrItems||[]).forEach((t,idx)=>{
    const line=document.querySelector(`#ocrLine${idx}`);
    if(line?.classList.contains("ocrAccepted"))return;
    const result=persistOCRItem(t,idx);
    if(result.reason==="duplicate"){
      duplicates++;
      const hint=document.querySelector(`#ocrHint${idx}`);
      if(hint){hint.textContent="⚠ Duplikat — ta wpłata już istnieje.";hint.className="ocrDuplicate"}
      markOCRDone(idx,"Duplikat — nie zapisano");
      return;
    }
    if(result.ok){saved++;markOCRDone(idx,result.state.kind==="partial"?"Wpłata częściowa":"Wpłata zaakceptowana")}
  });
  if(saved)save();
}
function saveOCRPayments(items){ window.__ocrItems=items; saveAllAssignedOCR(); }
screenInput.onchange=async e=>{
  let f=e.target.files[0]; if(!f)return;
  if(typeof Tesseract==="undefined"){alert("Nie udało się załadować modułu OCR. Sprawdź internet i odśwież stronę.");return}
  modal(`<h2>Rozpoznawanie screena</h2><div class="notice">Plik: <b>${f.name}</b></div><p id="ocrMsg">Uruchamiam OCR…</p><div class="ocrProgress"><div id="ocrBar"></div></div><p class="muted">Pierwsze uruchomienie może potrwać kilkanaście–kilkadziesiąt sekund.</p>`);
  try{
    const result=await Tesseract.recognize(f,'eng',{
      logger:m=>{
        let bar=document.querySelector("#ocrBar"),msg=document.querySelector("#ocrMsg");
        if(bar&&m.progress!=null)bar.style.width=Math.round(m.progress*100)+"%";
        if(msg)msg.textContent=m.status?`${m.status} ${m.progress!=null?Math.round(m.progress*100)+"%":""}`:"Rozpoznaję…";
      }
    });
    let text=result.data.text||"";
    let items=parseBankOCR(text);
    closeModal(); showOCRReview(items,f.name);
  }catch(err){
    closeModal();
    modal(`<h2>Błąd OCR</h2><p>${String(err.message||err)}</p><p class="muted">Sprawdź połączenie z internetem i spróbuj ponownie.</p><button class="soft" onclick="closeModal()">Zamknij</button>`);
  }finally{e.target.value=""}
};
function income(){app.innerHTML=`<div class="eyebrow">FINANSE</div><h2 class="title">Dodatkowe przychody</h2><button class="primary" onclick="addIncome()">+ Dodaj przychód</button><div class="card">${data.income.map(i=>`<div class="classrow"><b>${i.title}</b><div>${money(i.amount)} • ${i.date}</div></div>`).join("")||"Brak dodatkowych przychodów."}</div>`}
function addIncome(){modal(`<h2>Dodaj przychód</h2><label>Tytuł</label><input id="iTitle"><label>Kwota</label><input id="iAmount" type="number"><label>Data</label><input id="iDate" type="date"><div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="data.income.push({id:Date.now(),title:iTitle.value,amount:+iAmount.value,date:iDate.value});save();closeModal();render()">Zapisz</button></div>`)}
function groups(){
 app.innerHTML=`<div class="eyebrow">ZAJĘCIA</div><h2 class="title">Grupy i listy</h2><div class="card">
 <label>Szkoła</label><select id="gSchool" onchange="groupList()">${opt(schools,schools[0])}</select>
 <label>Dzień</label><select id="gDay" onchange="groupList()">${opt(days,"Wtorek")}</select>
 <label>Godzina</label><select id="gTime" onchange="groupList()">${opt(times,"15:00")}</select>
 <div class="actions">
   <button class="dark" onclick="printGroupList()">🖨 Drukuj listę</button>
   <button class="soft" onclick="showAttendance()">✓ Obecność</button>
   <button class="soft" onclick="printGroupContacts()">☎ Kontakty</button>
   <button class="soft" onclick="printGroupArrears()">Braki wpłat</button>
 </div></div><div id="gList"></div>`;
 groupList()
}
function selectedGroupRows(){
 const s=gSchool.value,d=gDay.value,t=gTime.value,arr=[];
 data.children.forEach(c=>(c.classes||[]).forEach(cl=>{if(cl.school==s&&cl.day==d&&cl.time==t)arr.push({c,cl})}));
 const seen=new Set();
 return arr.filter(x=>{if(seen.has(x.c.id))return false;seen.add(x.c.id);return true})
   .sort((a,b)=>pickupSortValue(a.c)-pickupSortValue(b.c)||(a.c.last+" "+a.c.first).localeCompare(b.c.last+" "+b.c.first,"pl"));
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
function attendanceKey(){return `${new Date().toISOString().slice(0,10)}|${gSchool.value}|${gDay.value}|${gTime.value}`}
function showAttendance(){
 const arr=selectedGroupRows();if(!arr.length)return;
 const key=attendanceKey(),saved=data.attendance[key]||{};
 modal(`<h2>Obecność — ${gSchool.value}</h2><div class="muted">${gDay.value} ${gTime.value}</div>
 ${arr.map(({c})=>`<div class="attendanceRow"><div><b>${c.last} ${c.first}</b><small>${c.class||""} • ${c.pickupPlace||""}</small></div>
 <div class="attendanceBtns"><button class="${saved[c.id]==="present"?"attActive presentBtn":"soft"}" onclick="setAttendance('${key}',${c.id},'present',this)">Obecny</button>
 <button class="${saved[c.id]==="absent"?"attActive absentBtn":"soft"}" onclick="setAttendance('${key}',${c.id},'absent',this)">Nieobecny</button></div></div>`).join("")}
 <div class="actions"><button class="primary" onclick="save();closeModal()">Zapisz obecność</button><button class="soft" onclick="closeModal()">Zamknij</button></div>`)
}
function setAttendance(key,cid,status,btn){
 data.attendance[key]=data.attendance[key]||{};data.attendance[key][cid]=status;
 const row=btn.closest(".attendanceBtns");row.querySelectorAll("button").forEach(b=>b.className="soft");
 btn.className=status==="present"?"attActive presentBtn":"attActive absentBtn";
}
function reportMonthNumber(name){
  const map={"Styczeń":1,"Luty":2,"Marzec":3,"Kwiecień":4,"Maj":5,"Czerwiec":6,"Lipiec":7,"Sierpień":8,"Wrzesień":9,"Październik":10,"Listopad":11,"Grudzień":12};
  return map[name]||0;
}
function paymentYearMonth(p){
  const d=String(p.date||"");
  if(/^\d{4}-\d{2}/.test(d))return {year:+d.slice(0,4),month:+d.slice(5,7)};
  return {year:null,month:reportMonthNumber(p.month)};
}
function incomeYearMonth(i){
  const d=String(i.date||"");
  if(/^\d{4}-\d{2}/.test(d))return {year:+d.slice(0,4),month:+d.slice(5,7)};
  return {year:null,month:null};
}
function reportFilterYearMonth(item,year,month,type="payment"){
  const ym=type==="income"?incomeYearMonth(item):paymentYearMonth(item);
  if(year && ym.year!==+year)return false;
  if(month && ym.month!==+month)return false;
  return true;
}
function workshopAllocation(payment){
  const ch=data.children.find(c=>Number(c.id)===Number(payment.childId));
  if(!ch||!ch.classes?.length)return [{"type":"Nieprzypisane",amount:Number(payment.amount||0)}];
  const active=ch.classes.filter(c=>c.status!=="bezplatne");
  if(!active.length)return [{"type":"Bezpłatne / brak należności",amount:Number(payment.amount||0)}];
  const dues=active.map(c=>({type:c.type||"Inne",due:Math.max(0,dueClass(c))}));
  const total=dues.reduce((s,x)=>s+x.due,0);
  if(total<=0){
    const each=Number(payment.amount||0)/active.length;
    return active.map(c=>({type:c.type||"Inne",amount:each}));
  }
  let remaining=Number(payment.amount||0);
  return dues.map((x,idx)=>{
    let amount=idx===dues.length-1?remaining:Number(payment.amount||0)*(x.due/total);
    remaining-=amount;
    return {type:x.type,amount};
  });
}
function aggregateReport(year,month){
  const pays=data.payments.filter(p=>reportFilterYearMonth(p,year,month,"payment"));
  const inc=data.income.filter(i=>reportFilterYearMonth(i,year,month,"income"));
  const childPaid=pays.reduce((s,p)=>s+Number(p.amount||0),0);
  const extra=inc.reduce((s,i)=>s+Number(i.amount||0),0);

  const schoolMap={};
  pays.forEach(p=>{
    const ch=data.children.find(c=>Number(c.id)===Number(p.childId));
    const school=ch?.school||"Nieprzypisane";
    schoolMap[school]=(schoolMap[school]||0)+Number(p.amount||0);
  });

  const workshopMap={};
  pays.forEach(p=>workshopAllocation(p).forEach(a=>{
    workshopMap[a.type]=(workshopMap[a.type]||0)+Number(a.amount||0);
  }));

  const monthMap={};
  for(let m=1;m<=12;m++)monthMap[m]=0;
  data.payments.filter(p=>reportFilterYearMonth(p,year,null,"payment")).forEach(p=>{
    const ym=paymentYearMonth(p); if(ym.month)monthMap[ym.month]+=Number(p.amount||0);
  });
  data.income.filter(i=>reportFilterYearMonth(i,year,null,"income")).forEach(i=>{
    const ym=incomeYearMonth(i); if(ym.month)monthMap[ym.month]+=Number(i.amount||0);
  });

  return {pays,inc,childPaid,extra,total:childPaid+extra,schoolMap,workshopMap,monthMap};
}
function reportTable(obj,emptyText){
  const rows=Object.entries(obj).sort((a,b)=>b[1]-a[1]);
  if(!rows.length)return `<div class="muted">${emptyText}</div>`;
  const total=rows.reduce((s,x)=>s+x[1],0)||1;
  return rows.map(([name,val])=>`<div class="reportRow">
    <div class="reportRowHead"><b>${name}</b><span>${money(val)}</span></div>
    <div class="reportBar"><div style="width:${Math.min(100,(val/total)*100)}%"></div></div>
  </div>`).join("");
}
function reportYears(){
  const years=new Set([new Date().getFullYear()]);
  data.payments.forEach(p=>{const ym=paymentYearMonth(p);if(ym.year)years.add(ym.year)});
  data.income.forEach(i=>{const ym=incomeYearMonth(i);if(ym.year)years.add(ym.year)});
  return [...years].sort((a,b)=>b-a);
}

function excelSafeDate(v){
 const s=String(v||"");
 return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:"";
}
function exportReportsExcel(){
 if(typeof XLSX==="undefined"){
   confirmModal({title:"Eksport Excel niedostępny",message:"Nie udało się załadować modułu Excel. Sprawdź połączenie z internetem i odśwież stronę.",confirmText:"OK",cancelText:"Zamknij",danger:false});
   return;
 }
 const year=Number(document.querySelector("#rYear")?.value||new Date().getFullYear());
 const monthVal=document.querySelector("#rMonth")?.value||"";
 const month=monthVal?Number(monthVal):null;
 const r=aggregateReport(year,month);
 const monthName=month?["","Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"][month]:"Cały rok";

 const wb=XLSX.utils.book_new();

 const summary=[
  ["Raport",`${monthName} ${year}`],
  ["Wpłaty dzieci",r.childPaid],
  ["Dodatkowe przychody",r.extra],
  ["Łączne wpływy",r.total],
  ["Liczba wpłat",r.pays.length]
 ];
 XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(summary),"Podsumowanie");

 const paymentsRows=r.pays.map(p=>{
   const ch=data.children.find(c=>Number(c.id)===Number(p.childId));
   const ps=ch?paymentState(ch,p.month):null;
   return {
    "Data":excelSafeDate(p.date),
    "Miesiąc":p.month||"",
    "Dziecko":p.child||"",
    "Szkoła":ch?.school||"",
    "Kwota":Number(p.amount||0),
    "Należne":ps?Number(ps.due||0):0,
    "Wpłacono łącznie":ps?Number(ps.paid||0):0,
    "Brakuje":ps?Number(ps.missing||0):0,
    "Status":ps?ps.label:"",
    "Uwagi":p.note||""
   };
 });
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(paymentsRows.length?paymentsRows:[{"Brak danych":""}]),"Wpłaty");

 const schoolRows=Object.entries(r.schoolMap).sort((a,b)=>b[1]-a[1]).map(([school,val])=>({
   "Szkoła":school,"Wpływy":Number(val||0)
 }));
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(schoolRows.length?schoolRows:[{"Brak danych":""}]),"Szkoły");

 const workshopRows=Object.entries(r.workshopMap).sort((a,b)=>b[1]-a[1]).map(([type,val])=>({
   "Rodzaj warsztatów":type,"Wpływy":Number(val||0)
 }));
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(workshopRows.length?workshopRows:[{"Brak danych":""}]),"Warsztaty");

 const arrearsRows=data.children.map(c=>{
   let paid=0;
   if(month){
     const mName=["","Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"][month];
     paid=data.payments.filter(p=>Number(p.childId)===Number(c.id)&&p.month===mName&&reportFilterYearMonth(p,year,month,"payment"))
       .reduce((s,p)=>s+Number(p.amount||0),0);
   }else{
     paid=data.payments.filter(p=>Number(p.childId)===Number(c.id)&&reportFilterYearMonth(p,year,null,"payment"))
       .reduce((s,p)=>s+Number(p.amount||0),0);
   }
   const due=month?childDue(c):childDue(c)*months.length;
   const missing=Math.max(0,due-paid);
   return missing>0?{
     "Dziecko":`${c.last} ${c.first}`,
     "Szkoła":c.school||"",
     "Należne":due,
     "Wpłacono":paid,
     "Brakuje":missing
   }:null;
 }).filter(Boolean);
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(arrearsRows.length?arrearsRows:[{"Brak zaległości":""}]),"Zaległości");

 const incomeRows=r.inc.map(i=>({
   "Data":excelSafeDate(i.date),
   "Tytuł":i.title||"",
   "Kwota":Number(i.amount||0)
 }));
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(incomeRows.length?incomeRows:[{"Brak danych":""}]),"Przychody");

 const childrenRows=data.children.map(c=>({
   "Nazwisko":c.last||"",
   "Imię":c.first||"",
   "Klasa":c.class||"",
   "Szkoła":c.school||"",
   "Sala / odbiór":c.pickupPlace||"",
   "Rodzic / opiekun":c.parent||"",
   "Telefon":c.phone||"",
   "E-mail":c.email||"",
   "Zgoda na wizerunek":consentLabel(c.consents?.image)||"brak danych",
   "Dane osobowe":consentLabel(c.consents?.personal)||"brak danych",
   "Regulamin":consentLabel(c.consents?.rules)||"brak danych",
   "Liczba zajęć":(c.classes||[]).length
 }));
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(childrenRows),"Dzieci");

 const classesRows=[];
 data.children.forEach(c=>(c.classes||[]).forEach(cl=>classesRows.push({
   "Dziecko":`${c.last} ${c.first}`,
   "Szkoła":cl.school||c.school||"",
   "Rodzaj warsztatów":cl.type||"",
   "Dzień":cl.day||"",
   "Godzina":cl.time||"",
   "Cena regularna":Number(cl.price||0),
   "Rabat %":Number(cl.discount||0),
   "Należne":Number(dueClass(cl)||0),
   "Status":cl.status||""
 })));
 XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(classesRows.length?classesRows:[{"Brak danych":""}]),"Zajęcia");

 const filename=`raport-rozliczenia-${year}-${month?String(month).padStart(2,"0"):"caly-rok"}.xlsx`;
 XLSX.writeFile(wb,filename);
}
function reports(){
  const years=reportYears();
  const defaultYear=years[0]||new Date().getFullYear();
  app.innerHTML=`<div class="eyebrow">RAPORTY</div><h2 class="title">Raporty i podsumowania</h2>
  <div class="card reportFilters">
    <div class="grid2">
      <div><label>Rok</label><select id="rYear" onchange="refreshReports()">${years.map(y=>`<option value="${y}">${y}</option>`).join("")}</select></div>
      <div><label>Miesiąc</label><select id="rMonth" onchange="refreshReports()">
        <option value="">Cały rok</option>
        ${["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"].map((m,i)=>`<option value="${i+1}">${m}</option>`).join("")}
      </select></div>
    </div>
    <label>Porównaj rok do roku</label>
    <select id="rCompare" onchange="refreshReports()">
      <option value="">Bez porównania</option>
      ${years.filter(y=>y!==defaultYear).map(y=>`<option value="${y}">${y}</option>`).join("")}
    </select>
  </div>
  <div id="reportContent"></div>`;
  refreshReports();
}
function refreshReports(){
  const year=Number(document.querySelector("#rYear")?.value||new Date().getFullYear());
  const monthVal=document.querySelector("#rMonth")?.value||"";
  const month=monthVal?Number(monthVal):null;
  const compareVal=document.querySelector("#rCompare")?.value||"";
  const compare=compareVal?Number(compareVal):null;
  const r=aggregateReport(year,month);
  const monthName=month?["","Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"][month]:"Cały rok";
  let compareHtml="";
  if(compare){
    const c=aggregateReport(compare,month);
    const diff=r.total-c.total;
    const pct=c.total?((diff/c.total)*100):null;
    compareHtml=`<div class="card">
      <h2>Rok do roku</h2>
      <div class="yoyGrid">
        <div class="stat">${year}<b>${money(r.total)}</b></div>
        <div class="stat">${compare}<b>${money(c.total)}</b></div>
        <div class="stat">Różnica<b class="${diff>=0?'positive':'negative'}">${diff>=0?'+':''}${money(diff)}</b>${pct!==null?`<small>${pct>=0?'+':''}${pct.toFixed(1)}%</small>`:""}</div>
      </div>
    </div>`;
  }

  document.querySelector("#reportContent").innerHTML=`
    <div class="card">
      <h2>${monthName} ${year}</h2>
      <div class="summary">
        <div class="stat">Wpłaty dzieci<b>${money(r.childPaid)}</b></div>
        <div class="stat">Dodatkowe przychody<b>${money(r.extra)}</b></div>
        <div class="stat">Łączne wpływy<b>${money(r.total)}</b></div>
        <div class="stat">Liczba wpłat<b>${r.pays.length}</b></div>
      </div>
    </div>
    ${compareHtml}
    <div class="card">
      <h2>Wpływy według szkół</h2>
      ${reportTable(r.schoolMap,"Brak wpłat przypisanych do szkół w wybranym okresie.")}
    </div>
    <div class="card">
      <h2>Wpływy według rodzaju warsztatów</h2>
      <p class="muted">Jeżeli dziecko chodzi na kilka zajęć, jego wpłata jest dzielona proporcjonalnie do należności za poszczególne zajęcia.</p>
      ${reportTable(r.workshopMap,"Brak wpłat przypisanych do warsztatów w wybranym okresie.")}
    </div>
    ${!month?`<div class="card"><h2>Miesiąc po miesiącu — ${year}</h2>
      ${Object.entries(r.monthMap).map(([m,val])=>`<div class="reportMonthRow"><span>${["","Sty","Lut","Mar","Kwi","Maj","Cze","Lip","Sie","Wrz","Paź","Lis","Gru"][+m]}</span><b>${money(val)}</b></div>`).join("")}
    </div>`:""}
    <div class="card print-hide">
      <button class="dark" onclick="window.print()">Drukuj raport</button><button class="primary" onclick="exportReportsExcel()">⬇ Eksport do Excel</button>
    </div>`;
}
function listFilteredChildren(){
 const sf=document.querySelector("#lSchool")?.value||"__ALL__";
 const wf=document.querySelector("#lWorkshop")?.value||"";
 const df=document.querySelector("#lDay")?.value||"";
 const tf=document.querySelector("#lTime")?.value||"";
 let arr=data.children.filter(c=>{
  const schoolOk=sf==="__ALL__"||c.school===sf||(c.classes||[]).some(cl=>cl.school===sf);
  if(!schoolOk)return false;
  if(!wf&&!df&&!tf)return true;
  return (c.classes||[]).some(cl=>(!wf||cl.type===wf)&&(!df||cl.day===df)&&(!tf||cl.time===tf)&&(sf==="__ALL__"||cl.school===sf||c.school===sf));
 });
 return arr.sort((a,b)=>pickupSortValue(a)-pickupSortValue(b)||(a.last+" "+a.first).localeCompare(b.last+" "+b.first,"pl"));
}
function listRows(type){
 const arr=listFilteredChildren(),month=currentMonthName();
 if(type==="children")return {title:"Lista dzieci",headers:["Dziecko","Klasa","Szkoła","Sala / odbiór"],rows:arr.map(c=>[`${c.last} ${c.first}`,c.class||"",c.school||"",c.pickupPlace||""])};
 if(type==="attendance")return {title:"Lista obecności",headers:["Lp.","Dziecko","Klasa","Sala / odbiór","Obecny","Nieobecny","Uwagi"],rows:arr.map((c,i)=>[i+1,`${c.last} ${c.first}`,c.class||"",c.pickupPlace||"","","",""])};
 if(type==="pickup")return {title:"Lista odbioru dzieci",headers:["Lp.","Sala / odbiór","Dziecko","Klasa"],rows:arr.map((c,i)=>[i+1,c.pickupPlace||"Nieustalone",`${c.last} ${c.first}`,c.class||""])};
 if(type==="contacts")return {title:"Lista kontaktowa",headers:["Dziecko","Rodzic / opiekun","Telefon","E-mail","Sala / odbiór"],rows:arr.map(c=>[`${c.last} ${c.first}`,c.parent||"",c.phone||"",c.email||"",c.pickupPlace||""])};
 if(type==="arrears"){
   const rows=arr.map(c=>{const ps=paymentState(c,month);return ["unpaid","partial"].includes(ps.kind)?[`${c.last} ${c.first}`,c.school||"",money(ps.due),money(ps.paid),money(ps.missing),ps.label]:null}).filter(Boolean);
   return {title:`Lista zaległości — ${month}`,headers:["Dziecko","Szkoła","Należne","Wpłacono","Brakuje","Status"],rows};
 }
 if(type==="consents")return {title:"Lista zgód",headers:["Dziecko","Wizerunek","Dane osobowe","Regulamin"],rows:arr.map(c=>[`${c.last} ${c.first}`,consentLabel(c.consents?.image)||"brak danych",consentLabel(c.consents?.personal)||"brak danych",consentLabel(c.consents?.rules)||"brak danych"])};
 if(type==="free"){
   const f=arr.filter(c=>(c.classes||[]).some(cl=>cl.status==="bezplatne"));
   return {title:"Lista dzieci bezpłatnych",headers:["Dziecko","Szkoła","Warsztaty"],rows:f.map(c=>[`${c.last} ${c.first}`,c.school||"",(c.classes||[]).filter(cl=>cl.status==="bezplatne").map(cl=>cl.type).join(", ")])};
 }
 if(type==="workshops"){
   const rows=[];
   arr.forEach(c=>(c.classes||[]).forEach(cl=>{
     const sf=document.querySelector("#lSchool")?.value||"__ALL__",wf=document.querySelector("#lWorkshop")?.value||"",df=document.querySelector("#lDay")?.value||"",tf=document.querySelector("#lTime")?.value||"";
     if((sf==="__ALL__"||cl.school===sf||c.school===sf)&&(!wf||cl.type===wf)&&(!df||cl.day===df)&&(!tf||cl.time===tf))
       rows.push([`${c.last} ${c.first}`,c.class||"",cl.school||c.school||"",cl.type||"",cl.day||"",cl.time||"",c.pickupPlace||""]);
   }));
   return {title:"Lista zapisów na warsztaty",headers:["Dziecko","Klasa","Szkoła","Warsztaty","Dzień","Godzina","Sala / odbiór"],rows};
 }
 return {title:"Lista",headers:[],rows:[]};
}
function lists(){
 app.innerHTML=`<div class="eyebrow">LISTY ROBOCZE</div><h2 class="title">Listy</h2>
 <div class="card">
  <div class="grid2"><div><label>Szkoła</label><select id="lSchool" onchange="refreshListPreview()"><option value="__ALL__">Wszystkie szkoły</option>${schools.map(s=>`<option>${s}</option>`).join("")}</select></div>
  <div><label>Rodzaj listy</label><select id="lType" onchange="refreshListPreview()">
   <option value="children">Lista dzieci</option><option value="attendance">Lista obecności</option><option value="pickup">Lista odbioru dzieci</option>
   <option value="contacts">Lista kontaktowa</option><option value="arrears">Lista zaległości</option><option value="consents">Lista zgód</option>
   <option value="free">Lista dzieci bezpłatnych</option><option value="workshops">Lista zapisów na warsztaty</option>
  </select></div></div>
  <label>Warsztaty</label><select id="lWorkshop" onchange="refreshListPreview()"><option value="">Wszystkie warsztaty</option>${workshops.map(w=>`<option>${w}</option>`).join("")}</select>
  <div class="grid2"><div><label>Dzień</label><select id="lDay" onchange="refreshListPreview()"><option value="">Wszystkie dni</option>${days.map(d=>`<option>${d}</option>`).join("")}</select></div>
  <div><label>Godzina</label><select id="lTime" onchange="refreshListPreview()"><option value="">Wszystkie godziny</option>${times.map(t=>`<option>${t}</option>`).join("")}</select></div></div>
  <div class="actions"><button class="dark" onclick="printSelectedList()">🖨 Drukuj</button><button class="primary" onclick="exportSelectedListExcel()">⬇ Excel</button></div>
 </div>
 <div id="listPreview"></div>`;
 refreshListPreview();
}
function refreshListPreview(){
 const d=listRows(document.querySelector("#lType")?.value||"children");
 document.querySelector("#listPreview").innerHTML=`<div class="card"><h2>${d.title}</h2><div class="muted">Pozycji: <b>${d.rows.length}</b></div>
 ${d.rows.slice(0,30).map(r=>`<div class="listPreviewRow">${r.slice(0,4).map(x=>`<span>${x}</span>`).join("")}</div>`).join("")||'<div class="muted">Brak danych dla wybranych filtrów.</div>'}
 ${d.rows.length>30?`<div class="muted">Podgląd pierwszych 30 pozycji.</div>`:""}</div>`;
}
function printSelectedList(){
 const d=listRows(document.querySelector("#lType").value);printSimpleStandalone(d.title,d.headers,d.rows);
}
function printSimpleStandalone(title,headers,rows){
 if(!rows.length){confirmModal({title:"Brak danych",message:"Brak pozycji dla wybranych filtrów.",confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 const win=window.open("","_blank");
 win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aaa;padding:8px;text-align:left}th{background:#f2f4f7}@media print{button{display:none}}</style></head><body><h1>${title}</h1><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table><button onclick="window.print()">Drukuj</button></body></html>`);
 win.document.close();setTimeout(()=>win.print(),250)
}
function exportSelectedListExcel(){
 if(typeof XLSX==="undefined"){confirmModal({title:"Excel niedostępny",message:"Sprawdź internet i odśwież stronę.",confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 const d=listRows(document.querySelector("#lType").value);
 const rows=d.rows.map(r=>Object.fromEntries(d.headers.map((h,i)=>[h,r[i]??""])));
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?rows:[{"Brak danych":""}]),"Lista");
 XLSX.writeFile(wb,`${d.title.toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi,"-")}.xlsx`);
}


function showToast(text){
 let t=document.getElementById("appToast");
 if(!t){t=document.createElement("div");t.id="appToast";t.className="appToast";document.body.appendChild(t)}
 t.textContent=text;t.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.remove("show"),1300);
}

function settings(){
 app.innerHTML=`<div class="eyebrow">KONFIGURACJA</div><h2 class="title">Ustawienia</h2>
 <div class="card"><h2>Warsztaty i ceny</h2><div id="setWorkshops">${data.settings.workshops.map((w,i)=>`<div class="settingsRow"><input value="${escapeAttr(w.name)}" oninput="data.settings.workshops[${i}].name=this.value"><input type="number" step="0.01" value="${Number(w.price||0)}" oninput="data.settings.workshops[${i}].price=+this.value"><button class="primary miniSave" onclick="saveSettings(true)">✓ Zapisz</button><button class="danger" onclick="removeWorkshopSetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addWorkshopSetting()">+ Dodaj warsztaty</button></div>
 <div class="card"><h2>Godziny zajęć</h2><div id="setTimes">${data.settings.times.map((t,i)=>`<div class="settingsRow"><input type="time" value="${t}" oninput="data.settings.times[${i}]=this.value"><button class="primary miniSave" onclick="saveSettings(true)">✓ Zapisz</button><button class="danger" onclick="removeTimeSetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addTimeSetting()">+ Dodaj godzinę</button></div>
 <div class="card"><h2>Szkoły</h2><div id="setSchools">${data.settings.schools.map((s,i)=>`<div class="settingsRow"><input value="${escapeAttr(s)}" oninput="data.settings.schools[${i}]=this.value"><button class="primary miniSave" onclick="saveSettings(true)">✓ Zapisz</button><button class="danger" onclick="removeSchoolSetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addSchoolSetting()">+ Dodaj szkołę</button></div>
 <div class="card"><h2>Dni zajęć</h2><div id="setDays">${data.settings.days.map((d,i)=>`<div class="settingsRow"><input value="${escapeAttr(d)}" oninput="data.settings.days[${i}]=this.value"><button class="primary miniSave" onclick="saveSettings(true)">✓ Zapisz</button><button class="danger" onclick="removeDaySetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addDaySetting()">+ Dodaj dzień</button></div>
 <div class="card"><h2>Dane programu</h2><p class="muted">Wersja ${VERSION}. Zmiany ustawień wpływają na listy wyboru w całej aplikacji.</p><div class="actions"><button class="primary" onclick="saveSettings()">✓ Zapisz ustawienia</button><button class="dark" onclick="backupBtn.click()">Kopia danych</button></div></div>`;
}
function saveSettings(quiet=false){
 data.settings.workshops=data.settings.workshops.filter(x=>String(x.name||"").trim()).map(x=>({name:String(x.name).trim(),price:Number(x.price||0)}));
 data.settings.schools=data.settings.schools.filter(x=>String(x||"").trim()).map(x=>String(x).trim());
 data.settings.times=data.settings.times.filter(Boolean).sort();
 data.settings.days=data.settings.days.filter(x=>String(x||"").trim()).map(x=>String(x).trim());
 syncSettingsArrays();save();
 if(!quiet) confirmModal({title:"Ustawienia zapisane",message:"Nowe szkoły, warsztaty, ceny i godziny są już dostępne w aplikacji.",confirmText:"OK",cancelText:"Zamknij",danger:false}); else showToast("Zapisano");
}
function addWorkshopSetting(){data.settings.workshops.push({name:"Nowe warsztaty",price:155});settings()}
function removeWorkshopSetting(i){data.settings.workshops.splice(i,1);settings()}
function addTimeSetting(){data.settings.times.push("15:00");settings()}
function removeTimeSetting(i){data.settings.times.splice(i,1);settings()}
function addSchoolSetting(){data.settings.schools.push("Nowa szkoła");settings()}
function removeSchoolSetting(i){data.settings.schools.splice(i,1);settings()}
function addDaySetting(){data.settings.days.push("Nowy dzień");settings()}
function removeDaySetting(i){data.settings.days.splice(i,1);settings()}

function signups(){
 app.innerHTML=`<div class="eyebrow">ZGŁOSZENIA</div><h2 class="title">Zapisy</h2><div class="actions signupTopActions"><button class="primary" onclick="editChild()">+ Dodaj dziecko ręcznie</button></div>
 <div class="card"><h2>Import formularza zapisu</h2>
 <p class="muted">Wczytaj plik CSV wyeksportowany z formularza WordPress / Fluent Forms. Dane nie zostaną dodane automatycznie — najpierw zobaczysz je do sprawdzenia i poprawy.</p>
 <div class="drop" onclick="signupCsvInput.click()">📄<h3>Wybierz plik CSV</h3><div>Format jak w eksporcie formularza zapisu dziecka</div></div>
 <button class="dark" onclick="signupCsvInput.click()">Importuj zgłoszenia z CSV</button></div>
 <div class="card"><h2>Ostatnio dodane zgłoszenia</h2><div class="muted">Po zaakceptowaniu formularza dziecko trafia do zakładki Dzieci razem z danymi rodzica i wybranymi zajęciami.</div></div>`
}
function parseCSV(text){
 const rows=[]; let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
   const ch=text[i],next=text[i+1];
   if(ch==='"'){
     if(quoted&&next==='"'){cell+='"';i++;}
     else quoted=!quoted;
   }else if(ch===','&&!quoted){row.push(cell);cell='';}
   else if((ch==='\n'||ch==='\r')&&!quoted){
     if(ch==='\r'&&next==='\n')i++;
     row.push(cell);cell='';
     if(row.some(x=>String(x).trim()!==''))rows.push(row);
     row=[];
   }else cell+=ch;
 }
 row.push(cell); if(row.some(x=>String(x).trim()!==''))rows.push(row);
 if(!rows.length)return [];
 const headers=rows.shift().map(x=>String(x).trim());
 return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
}
function signupVal(obj,names){
 for(const n of names){if(obj[n]!==undefined&&String(obj[n]).trim()!=='')return String(obj[n]).trim()}
 return '';
}
function splitPersonName(full){
 const p=String(full||'').trim().split(/\s+/).filter(Boolean);
 if(p.length<=1)return {first:p[0]||'',last:''};
 return {first:p.slice(0,-1).join(' '),last:p[p.length-1]};
}
function normalizeSchool(v){
 const x=String(v||'').trim().toLowerCase().replace(/\s+/g,'');
 if(x==='sp162'||x==='162')return 'SP 162';
 if(x==='zsp17'||x==='17')return 'ZSP 17';
 return String(v||'').trim()||schools[0];
}
function signupRecord(row,index){
 const childName=splitPersonName(signupVal(row,['Imię i nazwisko dziecka']));
 const types=[signupVal(row,['Rodzaj zajęć']),signupVal(row,['Rodzaj zajęć.1'])].filter(Boolean);
 const daysSel=[signupVal(row,['Które dni odpowiadają Państwu najbardziej?']),signupVal(row,['Które dni odpowiadają Państwu najbardziej?.1'])].filter(Boolean);
 return {
  importIndex:index,entryId:signupVal(row,['entry_id']),createdAt:signupVal(row,['created_at']),entryStatus:signupVal(row,['entry_status']),
  first:childName.first,last:childName.last,sex:'Dziewczynka',school:normalizeSchool(signupVal(row,['Szkoła'])),className:signupVal(row,['Klasa']),
  parent:signupVal(row,['Imię i nazwisko rodzica / opiekuna']),phone:signupVal(row,['Numer telefonu rodzica / opiekuna']),email:signupVal(row,['Adres e-mail rodzica / opiekuna']),notes:signupVal(row,['Uwagi']),
  rules:signupVal(row,['Regulamin zajęć']),personal:signupVal(row,['Dane osobowe']),imageConsent:signupVal(row,['Zgoda na wizerunek']),
  types,days:daysSel
 };
}
function signupSchoolOptions(value){
 const all=[...new Set([...schools,value].filter(Boolean))];
 return all.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('');
}
function signupWorkshopOptions(value){
 const all=[...new Set([...workshops,value].filter(Boolean))];
 return all.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('');
}
function signupDayOptions(value){
 const nice=value?value.charAt(0).toUpperCase()+value.slice(1).toLowerCase():days[0];
 const all=[...new Set([...days,nice].filter(Boolean))];
 return all.map(x=>`<option ${x===nice?'selected':''}>${x}</option>`).join('');
}
function showSignupReview(items,fileName){
 window.__signupItems=items;
 if(!items.length){modal(`<h2>Brak zgłoszeń</h2><p>Nie znalazłem danych w pliku ${fileName}.</p><button class="soft" onclick="closeModal()">Zamknij</button>`);return}
 modal(`<h2>Sprawdź zgłoszenia przed dodaniem</h2><div class="notice">Plik: <b>${fileName}</b> • znaleziono <b>${items.length}</b> zgłoszeń. Możesz poprawić każde pole przed akceptacją.</div>
 <div id="signupReview">${items.map((r,i)=>`<div class="signupReviewCard" id="signupCard${i}">
  <h3>${r.last} ${r.first}</h3>${r.entryId?`<div class="muted">ID formularza: ${r.entryId} • ${r.createdAt||''}</div>`:''}
  <div class="grid2"><div><label>Nazwisko</label><input id="suLast${i}" value="${escapeAttr(r.last)}"></div><div><label>Imię</label><input id="suFirst${i}" value="${escapeAttr(r.first)}"></div></div>
  <div class="grid2"><div><label>Płeć</label><select id="suSex${i}">${opt(['Dziewczynka','Chłopiec'],r.sex)}</select></div><div><label>Klasa</label><input id="suClass${i}" value="${escapeAttr(r.className)}"></div></div>
  <label>Szkoła</label><select id="suSchool${i}">${signupSchoolOptions(r.school)}</select>
  <label>Sala / sposób odbioru</label><select id="suPickup${i}">${opt(["","Sala 1","Sala 2","Sala 3","Sala 4","Sala 5","Przychodzi sam/a"],"")}</select>
  ${[0,1].map(k=>`<div class="signupWorkshop"><div class="grid2"><div><label>${k===0?'Rodzaj zajęć':'Drugie zajęcia'}</label><select id="suType${i}_${k}"><option value="">— brak —</option>${signupWorkshopOptions(r.types[k]||'')}</select></div><div><label>Dzień preferowany</label><select id="suDay${i}_${k}"><option value="">— wybierz później —</option>${signupDayOptions(r.days[k]||r.days[0]||'')}</select></div></div><label>Godzina</label><select id="suTime${i}_${k}"><option value="">— ustal później —</option>${times.map(t=>`<option>${t}</option>`).join('')}</select></div>`).join('')}
  <label>Rodzic / opiekun</label><input id="suParent${i}" value="${escapeAttr(r.parent)}"><label>Telefon</label><input id="suPhone${i}" value="${escapeAttr(r.phone)}"><label>E-mail</label><input id="suEmail${i}" value="${escapeAttr(r.email)}"><label>Uwagi</label><textarea id="suNotes${i}">${escapeHtml(r.notes)}</textarea>
  <div class="consentLine">Regulamin: <b>${escapeHtml(r.rules||'brak')}</b> • Dane osobowe: <b>${escapeHtml(r.personal||'brak')}</b> • Wizerunek: <b>${escapeHtml(r.imageConsent||'brak')}</b></div>
  <div id="suInfo${i}"></div><div class="actions"><button class="primary" onclick="acceptSignup(${i})">✓ Akceptuję i dodaję dziecko</button><button class="soft" onclick="skipSignup(${i})">Pomiń</button></div>
 </div>`).join('')}</div><div class="actions"><button class="soft" onclick="closeModal()">Zamknij</button></div>`);
}
function escapeAttr(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function escapeHtml(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}


function normalizeConsentValue(v){return consentLabel(v)||""}
function consentChanges(existing,src){
 const old=existing.consents||{};
 return [
  {key:"image",label:"Zgoda na wizerunek",old:normalizeConsentValue(old.image),next:normalizeConsentValue(src.imageConsent)},
  {key:"personal",label:"Dane osobowe",old:normalizeConsentValue(old.personal),next:normalizeConsentValue(src.personal)},
  {key:"rules",label:"Regulamin zajęć",old:normalizeConsentValue(old.rules),next:normalizeConsentValue(src.rules)}
 ].filter(x=>x.next&&x.old!==x.next);
}
function consentUpdateDialog(changes){
 return new Promise(resolve=>{
  if(!changes.length){resolve(false);return}
  const wrap=document.createElement("div");wrap.className="confirmOverlay";wrap.id="consentUpdateDialog";
  wrap.innerHTML=`<div class="confirmBox"><div class="confirmIcon">?</div><h2>Nowe zgody w formularzu</h2>
  <p>Nowy formularz różni się od zapisanych danych:</p>
  <div class="consentDiffList">${changes.map(x=>`<div><b>${x.label}</b><br>${x.old||"brak danych"} → <b>${x.next}</b></div>`).join("")}</div>
  <p>Czy zaktualizować zgody w profilu?</p><div class="confirmActions"><button class="soft" data-no>Zostaw obecne</button><button class="primary" data-yes>Aktualizuj</button></div></div>`;
  const done=v=>{wrap.remove();resolve(v)};
  wrap.querySelector("[data-no]").onclick=()=>done(false);wrap.querySelector("[data-yes]").onclick=()=>done(true);
  document.body.appendChild(wrap)
 })
}
function applyConsentChanges(existing,src){
 existing.consents=existing.consents||{};
 if(normalizeConsentValue(src.imageConsent))existing.consents.image=normalizeConsentValue(src.imageConsent);
 if(normalizeConsentValue(src.personal))existing.consents.personal=normalizeConsentValue(src.personal);
 if(normalizeConsentValue(src.rules))existing.consents.rules=normalizeConsentValue(src.rules);
}
function existingChildDialog(existing){
 return new Promise(resolve=>{
  const old=document.getElementById('existingChildDialog');if(old)old.remove();
  const wrap=document.createElement('div');
  wrap.id='existingChildDialog';wrap.className='confirmOverlay';
  wrap.innerHTML=`<div class="confirmBox existingChildBox">
   <div class="confirmIcon">?</div>
   <h2>Dziecko już istnieje</h2>
   <p><b>${escapeHtml(existing.last)} ${escapeHtml(existing.first)}</b> jest już w bazie.</p>
   <p>To może być zapis na kolejne warsztaty. Co chcesz zrobić?</p>
   <div class="existingChildActions">
    <button class="primary" data-action="add">+ Dodaj nowe zajęcia do tego dziecka</button>
    <button class="soft" data-action="edit">Wróć i popraw zgłoszenie</button>
    <button class="soft" data-action="cancel">Pomiń zgłoszenie</button>
   </div>
  </div>`;
  const done=v=>{wrap.remove();resolve(v)};
  wrap.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>done(b.dataset.action));
  wrap.onclick=e=>{if(e.target===wrap)done('edit')};
  document.body.appendChild(wrap);
 });
}
function signupClassesFromForm(i,child,existingCount=0){
 const result=[];
 for(let k=0;k<2;k++){
  const type=document.querySelector(`#suType${i}_${k}`).value;
  if(!type)continue;
  const day=document.querySelector(`#suDay${i}_${k}`).value||days[0];
  const time=document.querySelector(`#suTime${i}_${k}`).value||'';
  result.push({
   id:Date.now()+i*10+k,
   type,day,time,school:document.querySelector(`#suSchool${i}`).value,
   price:defaultWorkshopPrice(type),
   discount:(existingCount+result.length)>=1?10:0,
   status:'brak'
  });
 }
 return result;
}
function classLooksSame(a,b){
 return String(a.type||'').toLowerCase()===String(b.type||'').toLowerCase()
   && String(a.day||'').toLowerCase()===String(b.day||'').toLowerCase()
   && String(a.school||'').toLowerCase()===String(b.school||'').toLowerCase()
   && (!a.time || !b.time || String(a.time)===String(b.time));
}
function addSignupClassesToExisting(existing,i,src){
 const proposed=signupClassesFromForm(i,existing,existing.classes?.length||0);
 if(!proposed.length)return {added:0,duplicates:0};
 existing.classes=existing.classes||[];
 let added=0,duplicates=0;
 proposed.forEach(cl=>{
  if(existing.classes.some(old=>classLooksSame(old,cl))){duplicates++;return}
  existing.classes.push(cl);added++;
 });
 // zachowujemy główny profil dziecka, ale uzupełniamy brakujące dane kontaktowe z nowego zgłoszenia
 const values={
  parent:document.querySelector(`#suParent${i}`).value.trim(),
  phone:document.querySelector(`#suPhone${i}`).value.trim(),
  email:document.querySelector(`#suEmail${i}`).value.trim(),
  notes:document.querySelector(`#suNotes${i}`).value.trim(),
  pickupPlace:document.querySelector(`#suPickup${i}`)?.value||""
 };
 ['parent','phone','email','notes','pickupPlace'].forEach(k=>{if(!existing[k]&&values[k])existing[k]=values[k]});
 existing.lastSignupEntryId=src.entryId||'';
 existing.lastSignupCreatedAt=src.createdAt||'';
 return {added,duplicates};
}

function signupAlreadyExists(entryId,first,last){
 return data.children.find(c=>(entryId&&String(c.sourceEntryId||'')===String(entryId))||((c.first||'').toLowerCase()===String(first||'').toLowerCase()&&(c.last||'').toLowerCase()===String(last||'').toLowerCase()));
}
async function acceptSignup(i){
 const src=window.__signupItems?.[i]||{};
 const first=document.querySelector(`#suFirst${i}`).value.trim(),last=document.querySelector(`#suLast${i}`).value.trim();
 const info=document.querySelector(`#suInfo${i}`);
 if(!first||!last){info.className='ocrWarn';info.textContent='Uzupełnij imię i nazwisko dziecka.';return}

 const existing=signupAlreadyExists(src.entryId,first,last);
 if(existing){
  const action=await existingChildDialog(existing);
  if(action==='edit'){
   info.className='ocrWarn';
   info.textContent='Dane nie zostały zapisane. Możesz poprawić zgłoszenie i spróbować ponownie.';
   return;
  }
  if(action==='cancel'){
   skipSignup(i);
   return;
  }
  if(action==='add'){
   const changes=consentChanges(existing,src);
   if(changes.length && await consentUpdateDialog(changes))applyConsentChanges(existing,src);
   const result=addSignupClassesToExisting(existing,i,src);
   if(result.added===0){
    info.className='ocrWarn';
    info.textContent=result.duplicates
      ?'Te zajęcia wyglądają na już zapisane przy tym dziecku. Niczego nie dodałem.'
      :'W zgłoszeniu nie wybrano nowych zajęć do dodania.';
    return;
   }
   save();
   const card=document.querySelector(`#signupCard${i}`);
   card.classList.add('ocrAccepted');
   card.querySelectorAll('input,select,textarea,button').forEach(x=>x.disabled=true);
   info.className='ocrOk';
   info.textContent=`✓ Dodano ${result.added} ${result.added===1?'nowe zajęcia':'nowe zajęcia'} do istniejącego dziecka${result.duplicates?`. Pominięto ${result.duplicates} duplikat.`:''}`;
   return;
  }
 }

 const child={id:Date.now()+i,last,first,sex:document.querySelector(`#suSex${i}`).value,class:document.querySelector(`#suClass${i}`).value.trim(),school:document.querySelector(`#suSchool${i}`).value,club:(document.querySelector(`#suPickup${i}`)?.value==="Przychodzi sam/a"?"Nie":(document.querySelector(`#suPickup${i}`)?.value?"Tak":"")),pickupPlace:document.querySelector(`#suPickup${i}`)?.value||"",parent:document.querySelector(`#suParent${i}`).value.trim(),phone:document.querySelector(`#suPhone${i}`).value.trim(),email:document.querySelector(`#suEmail${i}`).value.trim(),notes:document.querySelector(`#suNotes${i}`).value.trim(),
  pickupPlace:document.querySelector(`#suPickup${i}`)?.value||"",sourceEntryId:src.entryId||'',sourceCreatedAt:src.createdAt||'',consents:{rules:src.rules||'',personal:src.personal||'',image:src.imageConsent||''},classes:[]};
 child.classes=signupClassesFromForm(i,child,0);
 data.children.push(child);save();
 const card=document.querySelector(`#signupCard${i}`);card.classList.add('ocrAccepted');card.querySelectorAll('input,select,textarea,button').forEach(x=>x.disabled=true);
 info.className='ocrOk';info.textContent='✓ Dziecko zostało dodane do bazy. Ceny i godzinę możesz ustawić później w zakładce Dzieci.';
}
function skipSignup(i){const card=document.querySelector(`#signupCard${i}`);if(card){card.classList.add('ocrAccepted');card.querySelectorAll('input,select,textarea,button').forEach(x=>x.disabled=true)} }
signupCsvInput.onchange=async e=>{
 const f=e.target.files[0];if(!f)return;
 try{
  const text=await f.text();
  const rows=parseCSV(text);const items=rows.map(signupRecord);
  showSignupReview(items,f.name);
 }catch(err){modal(`<h2>Błąd importu CSV</h2><p>${escapeHtml(err.message||err)}</p><button class="soft" onclick="closeModal()">Zamknij</button>`)}
 finally{e.target.value=''}
};
backupBtn.onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rozliczenia-kopia-v56.json";a.click()}
render();
