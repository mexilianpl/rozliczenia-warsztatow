
const VERSION="8.8";
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
data.settings.pickupRooms=data.settings.pickupRooms||["Sala 1","Sala 2","Sala 3","Sala 4","Sala 5"];

data.settings.schoolSchedules=data.settings.schoolSchedules||{};
function ensureSchoolSchedule(school){
 if(!data.settings.schoolSchedules[school])data.settings.schoolSchedules[school]=[];
 return data.settings.schoolSchedules[school];
}
function addSchoolSchedule(school){
 const arr=ensureSchoolSchedule(school);
 arr.push({day:days[0]||"Poniedziałek",time:times[0]||"15:00"});
 settings();
}
function removeSchoolSchedule(school,index){
 ensureSchoolSchedule(school).splice(index,1);
 settings();
}
function updateSchoolSchedule(school,index,field,value){
 const arr=ensureSchoolSchedule(school);
 if(arr[index])arr[index][field]=value;
}

function schoolDayEnabled(school,day){
 return ensureSchoolSchedule(school).some(x=>x.day===day);
}
function schoolDayTimes(school,day){
 return [...new Set(ensureSchoolSchedule(school).filter(x=>x.day===day).map(x=>x.time).filter(Boolean))].sort();
}
function toggleSchoolDay(school,day,enabled){
 let arr=ensureSchoolSchedule(school);
 if(enabled){
   if(!arr.some(x=>x.day===day))arr.push({day:day,time:times[0]||"15:00"});
 }else{
   data.settings.schoolSchedules[school]=arr.filter(x=>x.day!==day);
 }
 settings();
}
function toggleSchoolDayTime(school,day,time,enabled){
 let arr=ensureSchoolSchedule(school);
 const exists=arr.some(x=>x.day===day&&x.time===time);
 if(enabled&&!exists)arr.push({day:day,time:time});
 if(!enabled&&exists)data.settings.schoolSchedules[school]=arr.filter(x=>!(x.day===day&&x.time===time));
}
function saveSchoolScheduleButton(btn){
 saveSettings(true);
 btn.classList.add("savedState");
 btn.textContent="✓ Zapisano";
}

function schoolScheduleDays(school){
 return [...new Set(ensureSchoolSchedule(school).map(x=>x.day).filter(Boolean))];
}
function schoolScheduleTimes(school,day){
 return [...new Set(ensureSchoolSchedule(school).filter(x=>!day||x.day===day).map(x=>x.time).filter(Boolean))].sort();
}

function syncSettingsArrays(){
 schools.splice(0,schools.length,...data.settings.schools);
 workshops.splice(0,workshops.length,...data.settings.workshops.map(x=>x.name));
 days.splice(0,days.length,...data.settings.days);
 times.splice(0,times.length,...data.settings.times);
 pickupPlaces.splice(0,pickupPlaces.length,...data.settings.pickupRooms,"Przychodzi sam/a");
}
syncSettingsArrays();

let childrenViewState={q:"",school:"",workshop:"",day:"",time:"",focusChildId:0};
let pendingSaveButton=null;
let savedToastTimer=null;

document.addEventListener("click",e=>{
 const btn=e.target.closest("button");
 if(!btn)return;
 const label=(btn.textContent||"").trim().toLowerCase();
 if(/^(zapisz|zatwierdź|potwierdź|akceptuj|zapisz grafik szkoły|zapisz limit|zapisz tekst sms|zapisz rok)/.test(label)){
   pendingSaveButton=btn;
 }
},true);

function showSavedFeedback(){
 const btn=pendingSaveButton;
 pendingSaveButton=null;
 if(btn && document.body.contains(btn)){
   if(!btn.dataset.originalLabel)btn.dataset.originalLabel=(btn.textContent||"").trim();
   btn.classList.add("actionSaved");
   btn.textContent="✓ Zapisano";
 }
 let toast=document.getElementById("globalSavedToast");
 if(!toast){
   toast=document.createElement("div");
   toast.id="globalSavedToast";
   toast.className="globalSavedToast";
   document.body.appendChild(toast);
 }
 toast.textContent="✓ Zmiany zapisane";
 toast.classList.add("show");
 clearTimeout(savedToastTimer);
 savedToastTimer=setTimeout(()=>toast.classList.remove("show"),1800);
}

function markButtonDirty(el){
 const btn=el?.closest(".settingsRow,.schoolPlanRow,.schoolPlanBox,.card")?.querySelector("button.actionSaved,button[data-original-label]");
 if(btn){
   btn.classList.remove("actionSaved");
   btn.textContent=btn.dataset.originalLabel||"Zapisz";
 }
}

let page="start"; const app=document.querySelector("#app"), nav=document.querySelector("#nav");
function save(){localStorage.setItem("rw45",JSON.stringify(data));showSavedFeedback()}
function money(v){return Number(v||0).toLocaleString("pl-PL",{minimumFractionDigits:2,maximumFractionDigits:2})+" zł"}
function dueClass(c){return c.status==="bezplatne"?0:Math.max(0,c.price*(1-(c.discount||0)/100))}
function childDue(ch){return ch.classes.reduce((s,c)=>s+dueClass(c),0)}

function childPaymentsForMonth(ch,month="Wrzesień"){
  return data.payments.filter(p=>Number(p.childId)===Number(ch.id)&&p.month===month)
    .reduce((s,p)=>s+Number(p.amount||0),0);
}
function paymentState(ch,month="Wrzesień"){
  const due=childDueForMonth(ch,month,new Date().getFullYear()), paid=childPaymentsForMonth(ch,month);
  if(due<=0)return {kind:"free",due,paid,missing:0,extra:Math.max(0,paid),label:"BEZPŁATNE"};
  if(paid<=0)return {kind:"unpaid",due,paid,missing:due,extra:0,label:"BRAK WPŁATY"};
  if(paid<due)return {kind:"partial",due,paid,missing:due-paid,extra:0,label:`CZĘŚCIOWO WPŁACONO • BRAKUJE ${money(due-paid)}`};
  if(paid>due)return {kind:"overpaid",due,paid,missing:0,extra:paid-due,label:`NADPŁATA ${money(paid-due)}`};
  return {kind:"paid",due,paid,missing:0,extra:0,label:"WPŁACONO"};
}
function isActualDebtKind(kind){return kind==="unpaid"||kind==="partial"}
function paymentStatusClass(kind){
  if(kind==="paid")return "paid";
  if(kind==="partial")return "partial";
  if(kind==="overpaid")return "overpaid";
  if(kind==="free")return "free";
  if(kind==="future")return "future";
  if(kind==="before")return "before";
  return "unpaid";
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

function start(){
 const dash=currentMonthDashboard(),payStats=dashboardPaidStats();
 const next=nextClassDayInfo(),groupsToday=classesGroupedForDay(next.items);
 const dayText=next.delta===0?"Dzisiejsze zajęcia":next.delta===1?"Jutrzejsze zajęcia":next.delta!==null?`Najbliższe zajęcia za ${next.delta} dni`:"Najbliższe zajęcia";
 const attention=attentionSummary();
 app.innerHTML=`<div class="dashboardTop"><div><div class="eyebrow">PANEL GŁÓWNY</div><h2 class="title">Podsumowanie miesiąca</h2></div><button class="attentionBell ${attention.total?"hasAttention":""}" onclick="openAttentionPanel()" aria-label="Powiadomienia wymagające uwagi">🔔${attention.total?`<span>${attention.total}</span>`:""}</button></div>
 <div class="currentPeriodLabel">${dash.period.month} ${dash.period.year}</div>
 <div class="summary dashboardSummary">
   <button class="stat dashboardTile" onclick="page='reports';render()"><span>Należne w miesiącu</span><b>${money(dash.due)}</b><small>${payStats.dueCount} dzieci z należnością</small></button>
   <button class="stat paidStat dashboardTile" onclick="page='payments';render()"><span>Wpłaty dzieci</span><b>${money(dash.childPaid)}</b><small>${payStats.paidCount}/${payStats.dueCount} opłaconych</small></button>
   <button class="stat missingStat dashboardTile" onclick="openDashboardArrears('all')"><span>Brakuje wpłat</span><b>${money(dash.missing)}</b><small>${dash.missingPeople} ${dash.missingPeople===1?"osoba z zaległością":"osób z zaległością"}</small></button>
   <button class="stat partialStat dashboardTile" onclick="openDashboardArrears('partial')"><span>Niepełne wpłaty</span><b>${dash.partialPeople}</b><small>${payStats.partialCount} częściowych • ${payStats.unpaidCount} bez wpłaty</small></button>
   <button class="stat dashboardTile" onclick="page='income';render()"><span>Dodatkowe przychody</span><b>${money(dash.extra)}</b><small>otwórz przychody</small></button>
   <button class="stat dashboardTile" onclick="page='reports';render()"><span>Razem wpływy</span><b>${money(dash.total)}</b><small>zobacz raport</small></button>
 </div>
 ${!dash.activeSchoolMonth?`<div class="notice dashboardNotice">Aktualny miesiąc (${dash.period.month}) jest poza standardowym okresem zajęć Wrzesień–Czerwiec, dlatego należność miesięczna wynosi 0,00 zł.</div>`:""}
 <div class="schoolStatsGrid">
 ${(data.settings?.schools||schools).map(s=>{const x=dash.schoolStats[s]||{total:0,girls:0,boys:0};return `<button class="schoolStatCard" onclick="openChildrenForSchool('${s.replace(/'/g,"\\'")}')"><b>${s}</b><strong>${x.total} aktywnych dzieci</strong><span>👧 ${x.girls} dziewczynek • 👦 ${x.boys} chłopców</span><small>Dotknij, aby otworzyć dzieci tej szkoły</small></button>`}).join("")}
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
function payments(){
 let paid=data.payments.reduce((s,p)=>s+Number(p.amount),0), due=data.children.reduce((s,c)=>s+childDue(c),0),inc=data.income.reduce((s,p)=>s+Number(p.amount),0);
 app.innerHTML=`<div class="eyebrow">FINANSE</div><h2 class="title">Wpłaty</h2>
 <div class="card"><h2>Dodaj wpłatę</h2><div class="search"><input id="paySearch" placeholder="Szukaj dziecka..." oninput="payHints(this.value)"></div><div id="payHints"></div><button class="primary" onclick="addPayment(null,paySearch.value)">+ Dodaj wpłatę ręcznie</button></div>
 <div class="card"><h2>Import wpłat ze screena</h2><p class="muted">Dodaj zrzut ekranu z aplikacji bankowej. Aplikacja sprawdzi kwotę względem należności i ostrzeże także przed powtórnym dodaniem tego samego przelewu.</p><div class="drop" onclick="screenInput.click()">📷<h3>Dodaj zrzut ekranu</h3><div>PNG lub JPG</div></div><button class="dark" onclick="screenInput.click()">📷 Rozpoznaj wpłaty ze screena</button><div id="ocrStatus"></div></div>
 <div class="card"><h2>Lista wpłat</h2>${data.payments.map(p=>{
   const ch=data.children.find(c=>Number(c.id)===Number(p.childId));
   const ps=ch?paymentState(ch,p.month):null;
   return `<div class="classrow"><b>${p.child}</b><div>${money(p.amount)} • ${p.month} • ${p.date||""}</div>${ps?`<div class="paymentBadgeText ${paymentStatusClass(ps.kind)}">${ps.label}</div>`:""}<button class="danger" onclick="deletePayment(${p.id})">Usuń</button></div>`;
 }).join("")||'<div class="muted">Brak wpłat.</div>'}</div>`}
function payHints(q){q=q.toLowerCase();payHints.innerHTML=data.children.filter(c=>(c.last+" "+c.first).toLowerCase().includes(q)&&q).map(c=>`<button class="soft" onclick="addPayment(${c.id})">${c.last} ${c.first}</button>`).join("")}
function addPayment(cid,query=""){
 let q=String(query||"").trim().toLowerCase();
 let matches=q?data.children.filter(c=>(c.last+" "+c.first+" "+c.first+" "+c.last).toLowerCase().includes(q)):data.children;
 if(cid){
   const selected=data.children.find(c=>c.id==cid);
   if(selected)matches=[selected];
 }
 if(!matches.length){
   confirmModal({title:"Nie znaleziono dziecka",message:`Brak dziecka pasującego do „${query}”. Zmień wpisane litery i spróbuj ponownie.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
   return;
 }
 modal(`<h2>Dodaj wpłatę</h2>${q?`<div class="payFilterInfo">Wyniki dla: <b>${query}</b> • ${matches.length}</div>`:""}<label>Dziecko</label><select id="pChild">${matches.map(c=>`<option value="${c.id}" ${c.id==cid?"selected":""}>${c.last} ${c.first}</option>`).join("")}</select><div class="grid2"><div><label>Miesiąc</label><select id="pMonth">${opt(months,"Wrzesień")}</select></div><div><label>Kwota</label><input id="pAmount" type="number"></div></div><label>Data</label><input id="pDate" type="date"><label>Tytuł / uwagi</label><input id="pNote"><div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="savePayment()">Zapisz</button></div>`)
}
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
function attendanceKey(){return `${new Date().toISOString().slice(0,10)}|${gSchool.value}|${gDay.value}|${gTime.value}`}
function showAttendance(){
 const arr=selectedGroupRows();if(!arr.length)return;
 const key=attendanceKey(),saved=data.attendance[key]||{};
 modal(`<h2>Obecność — ${gSchool.value}</h2><div class="muted">${gDay.value} ${gTime.value}</div><div class="attendanceModalDate">${new Intl.DateTimeFormat("pl-PL",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(new Date())}</div>
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


function showToast(text){
 let t=document.getElementById("appToast");
 if(!t){t=document.createElement("div");t.id="appToast";t.className="appToast";document.body.appendChild(t)}
 t.textContent=text;t.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.remove("show"),1300);
}


function settingRowButton(el){
 return el?.closest(".settingsRow,.schoolPlanRow")?.querySelector(".miniSave")||null;
}
function markSettingDirty(el){
 markButtonDirty(el);
 const btn=settingRowButton(el); if(!btn)return;
 btn.classList.remove("savedState");
 btn.textContent="Zapisz";
 btn.dataset.saved="0";
}
function markSettingSaved(btn){
 if(!btn)return;
 btn.classList.add("savedState");
 btn.textContent="✓ Zapisano";
 btn.dataset.saved="1";
}
function saveSettingButton(btn){
 saveSettings(true);
 markSettingSaved(btn);
}
function settingsBase(){
 app.innerHTML=`<div class="eyebrow">KONFIGURACJA</div><h2 class="title">Ustawienia</h2>
 <div class="card"><h2>Warsztaty i ceny</h2><div id="setWorkshops">${data.settings.workshops.map((w,i)=>`<div class="settingsRow"><input value="${escapeAttr(w.name)}" oninput="data.settings.workshops[${i}].name=this.value;markSettingDirty(this)"><input type="number" step="0.01" value="${Number(w.price||0)}" oninput="data.settings.workshops[${i}].price=+this.value;markSettingDirty(this)"><button class="primary miniSave" onclick="saveSettingButton(this)">Zapisz</button><button class="danger" onclick="removeWorkshopSetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addWorkshopSetting()">+ Dodaj warsztaty</button></div>
 <div class="card"><h2>Godziny zajęć</h2><div id="setTimes">${data.settings.times.map((t,i)=>`<div class="settingsRow"><input type="time" value="${t}" oninput="data.settings.times[${i}]=this.value;markSettingDirty(this)"><button class="primary miniSave" onclick="saveSettingButton(this)">Zapisz</button><button class="danger" onclick="removeTimeSetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addTimeSetting()">+ Dodaj godzinę</button></div>
 <div class="card"><h2>Szkoły</h2><div id="setSchools">${data.settings.schools.map((s,i)=>`<div class="settingsRow"><input value="${escapeAttr(s)}" oninput="data.settings.schools[${i}]=this.value;markSettingDirty(this)"><button class="primary miniSave" onclick="saveSettingButton(this)">Zapisz</button><button class="danger" onclick="removeSchoolSetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addSchoolSetting()">+ Dodaj szkołę</button></div>
 <div class="card"><h2>Dni zajęć</h2><div id="setDays">${data.settings.days.map((d,i)=>`<div class="settingsRow"><input value="${escapeAttr(d)}" oninput="data.settings.days[${i}]=this.value;markSettingDirty(this)"><button class="primary miniSave" onclick="saveSettingButton(this)">Zapisz</button><button class="danger" onclick="removeDaySetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addDaySetting()">+ Dodaj dzień</button></div>
 <div class="card"><h2>Sale / miejsce odbioru dzieci</h2>
 <p class="muted">Tutaj możesz zmieniać numery/nazwy sal oraz dodawać i usuwać sale. Opcja „Przychodzi sam/a” pozostaje zawsze dostępna.</p>
 <div id="setPickupRooms">${data.settings.pickupRooms.map((r,i)=>`<div class="settingsRow"><input value="${escapeAttr(r)}" oninput="data.settings.pickupRooms[${i}]=this.value;markSettingDirty(this)"><button class="primary miniSave" onclick="saveSettingButton(this)">Zapisz</button><button class="danger" onclick="removePickupRoomSetting(${i})">Usuń</button></div>`).join("")}</div>
 <button class="soft" onclick="addPickupRoomSetting()">+ Dodaj salę</button>
 </div>
 <div class="card"><h2>Plan szkół — tygodniowy grafik</h2>
 <p class="muted">Zaznacz dni, w których szkoła ma zajęcia. Dla zaznaczonego dnia wybierz jedną lub kilka godzin.</p>
 ${data.settings.schools.map(s=>`<div class="schoolPlanBox">
   <div class="schoolPlanTitle">${s}</div>
   ${days.map(day=>`<div class="schoolWeekRow">
     <label class="schoolDayToggle">
       <input type="checkbox" ${schoolDayEnabled(s,day)?"checked":""} onchange="toggleSchoolDay('${s.replace(/'/g,"\\'")}','${day.replace(/'/g,"\\'")}',this.checked)">
       <span>${day}</span>
     </label>
     <div class="schoolTimeChoices ${schoolDayEnabled(s,day)?"":"disabledTimes"}">
       ${times.map(t=>`<label class="timeChip"><input type="checkbox" ${schoolDayTimes(s,day).includes(t)?"checked":""} ${schoolDayEnabled(s,day)?"":"disabled"} onchange="toggleSchoolDayTime('${s.replace(/'/g,"\\'")}','${day.replace(/'/g,"\\'")}','${t}',this.checked)"><span>${t}</span></label>`).join("")}
     </div>
   </div>`).join("")}
   <button class="primary schoolScheduleSave" onclick="saveSchoolScheduleButton(this)">Zapisz grafik szkoły</button>
 </div>`).join("")}
 </div>
 <div class="card"><h2>Dane programu</h2><p class="muted">Wersja ${VERSION}. Zmiany ustawień wpływają na listy wyboru w całej aplikacji.</p><div class="actions"><button class="primary" onclick="saveSettings()">✓ Zapisz ustawienia</button><button class="dark" onclick="backupBtn.click()">Kopia danych</button></div></div>`;
}
function saveSettings(quiet=false){
 data.settings.workshops=data.settings.workshops.filter(x=>String(x.name||"").trim()).map(x=>({name:String(x.name).trim(),price:Number(x.price||0)}));
 data.settings.schools=data.settings.schools.filter(x=>String(x||"").trim()).map(x=>String(x).trim());
 data.settings.times=data.settings.times.filter(Boolean).sort();
 data.settings.days=data.settings.days.filter(x=>String(x||"").trim()).map(x=>String(x).trim());
 data.settings.pickupRooms=data.settings.pickupRooms.filter(x=>String(x||"").trim()).map(x=>String(x).trim());

 Object.keys(data.settings.schoolSchedules||{}).forEach(s=>{data.settings.schoolSchedules[s]=(data.settings.schoolSchedules[s]||[]).filter(x=>x.day&&x.time)});
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
function addPickupRoomSetting(){data.settings.pickupRooms.push("Nowa sala");settings()}
function removePickupRoomSetting(i){
 const room=data.settings.pickupRooms[i];
 const used=data.children.some(c=>c.pickupPlace===room);
 if(used){
   confirmModal({title:"Sala jest używana",message:`Sala „${room}” jest przypisana do co najmniej jednego dziecka. Najpierw zmień salę w profilach dzieci.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
   return;
 }
 data.settings.pickupRooms.splice(i,1);syncSettingsArrays();save();settings();
}
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

function updateSignupSchedule(i,k){
 const school=document.getElementById(`suSchool${i}`)?.value||"";
 const day=document.getElementById(`suDay${i}_${k}`),time=document.getElementById(`suTime${i}_${k}`);
 if(!day||!time)return;
 const cfg=dependentSchedule(school,day.value,time.value);
 day.innerHTML='<option value="">— wybierz później —</option>'+cfg.days.map(x=>`<option ${x===cfg.day?"selected":""}>${x}</option>`).join("");
 time.innerHTML='<option value="">— ustal później —</option>'+cfg.times.map(x=>`<option ${x===cfg.time?"selected":""}>${x}</option>`).join("");
}
function updateAllSignupSchedules(i){updateSignupSchedule(i,0);updateSignupSchedule(i,1)}
function updateSignupTimes(i,k){
 const school=document.getElementById(`suSchool${i}`)?.value||"",day=document.getElementById(`suDay${i}_${k}`)?.value||"";
 const time=document.getElementById(`suTime${i}_${k}`);if(!time)return;
 const allowed=schoolScheduleTimes(school,day),use=allowed.length?allowed:times;
 time.innerHTML='<option value="">— ustal później —</option>'+use.map(x=>`<option>${x}</option>`).join("");
}

function showSignupReview(items,fileName){
 window.__signupItems=items;
 if(!items.length){modal(`<h2>Brak zgłoszeń</h2><p>Nie znalazłem danych w pliku ${fileName}.</p><button class="soft" onclick="closeModal()">Zamknij</button>`);return}
 modal(`<h2>Sprawdź zgłoszenia przed dodaniem</h2><div class="notice">Plik: <b>${fileName}</b> • znaleziono <b>${items.length}</b> zgłoszeń. Możesz poprawić każde pole przed akceptacją.</div>
 <div id="signupReview">${items.map((r,i)=>`<div class="signupReviewCard" id="signupCard${i}">
  <h3>${r.last} ${r.first}</h3>${r.entryId?`<div class="muted">ID formularza: ${r.entryId} • ${r.createdAt||''}</div>`:''}
  <div class="grid2"><div><label>Nazwisko</label><input id="suLast${i}" value="${escapeAttr(r.last)}"></div><div><label>Imię</label><input id="suFirst${i}" value="${escapeAttr(r.first)}"></div></div>
  <div class="grid2"><div><label>Płeć</label><select id="suSex${i}">${opt(['Dziewczynka','Chłopiec'],r.sex)}</select></div><div><label>Klasa</label><input id="suClass${i}" value="${escapeAttr(r.className)}"></div></div>
  <label>Szkoła</label><select id="suSchool${i}" onchange="updateAllSignupSchedules(${i})">${signupSchoolOptions(r.school)}</select>
  <label>Sala / sposób odbioru</label><select id="suPickup${i}">${opt(["",...pickupPlaces],"")}</select>
  ${[0,1].map(k=>`<div class="signupWorkshop"><div class="grid2"><div><label>${k===0?'Rodzaj zajęć':'Drugie zajęcia'}</label><select id="suType${i}_${k}"><option value="">— brak —</option>${signupWorkshopOptions(r.types[k]||'')}</select></div><div><label>Dzień preferowany</label><select id="suDay${i}_${k}" onchange="updateSignupTimes(${i},${k})"><option value="">— wybierz później —</option>${dependentSchedule(r.school,r.days[k]||r.days[0]||days[0],times[0]).days.map(d=>`<option ${d===(r.days[k]||r.days[0])?"selected":""}>${d}</option>`).join("")}</select></div></div><label>Godzina</label><select id="suTime${i}_${k}"><option value="">— ustal później —</option>${dependentSchedule(r.school,r.days[k]||r.days[0]||days[0],times[0]).times.map(t=>`<option>${t}</option>`).join('')}</select></div>`).join('')}
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

/* ===== v7.2: statusy, daty, historia, nadpłaty, rodzina, limity, archiwum, SMS ===== */
data.history=data.history||[];
data.creditTransfers=data.creditTransfers||[];
data.archives=data.archives||[];
data.currentSchoolYear=data.currentSchoolYear||"2026/2027";
data.settings.groupLimit=Number(data.settings.groupLimit||12);
data.settings.reminderTemplate=data.settings.reminderTemplate||"Dzień dobry, przypominamy o płatności za zajęcia {warsztaty} za miesiąc {miesiac}. Do zapłaty pozostało {brakuje}. Pozdrawiamy, Rękodzieło z Pasją.";
data.children.forEach(c=>{
 if(!c.activityStatus)c.activityStatus="Aktywne";
 if(c.startDate===undefined)c.startDate="";
 if(c.endDate===undefined)c.endDate="";
 if(c.payerGroup===undefined)c.payerGroup="";
});

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

function nextMonthName(month){
 const i=months.indexOf(month);
 return i>=0&&i<months.length-1?months[i+1]:"";
}
function childPaymentsForMonth(ch,month="Wrzesień"){
 let total=data.payments.filter(p=>Number(p.childId)===Number(ch.id)&&p.month===month).reduce((s,p)=>s+Number(p.amount||0),0);
 data.creditTransfers.forEach(t=>{
   if(Number(t.childId)!==Number(ch.id))return;
   if(t.fromMonth===month)total-=Number(t.amount||0);
   if(t.toMonth===month)total+=Number(t.amount||0);
 });
 return total;
}
async function transferOverpayment(cid,month){
 const ch=data.children.find(c=>c.id==cid); if(!ch)return;
 const ps=paymentState(ch,month),to=nextMonthName(month);
 if(ps.kind!=="overpaid"||ps.extra<=0)return;
 if(!to){await confirmModal({title:"Brak kolejnego miesiąca",message:"Czerwiec jest ostatnim miesiącem roku zajęć. Nadpłatę zostaw jako saldo lub rozlicz ręcznie.",confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 const ok=await confirmModal({title:"Przenieść nadpłatę?",message:`Przenieść ${money(ps.extra)} z ${month} na ${to}?`,confirmText:"Przenieś",cancelText:"Anuluj",danger:false});
 if(!ok)return;
 data.creditTransfers.push({id:Date.now(),childId:ch.id,fromMonth:month,toMonth:to,amount:ps.extra,date:new Date().toISOString().slice(0,10)});
 logHistory(ch.id,`Przeniesiono nadpłatę ${money(ps.extra)}: ${month} → ${to}.`);
 save();render();
}

function reminderText(ch,month){
 const ps=paymentState(ch,month);
 const types=[...new Set((ch.classes||[]).map(x=>x.type))].join(", ");
 return String(data.settings.reminderTemplate||"")
  .replaceAll("{dziecko}",`${ch.first} ${ch.last}`)
  .replaceAll("{miesiac}",month)
  .replaceAll("{brakuje}",money(ps.missing))
  .replaceAll("{warsztaty}",types||"warsztaty");
}
function sendReminderSMS(cid,month){
 const ch=data.children.find(c=>c.id==cid);if(!ch)return;
 const phone=String(ch.phone||"").replace(/[^\d+]/g,"");
 if(!phone){confirmModal({title:"Brak numeru telefonu",message:"Uzupełnij numer telefonu rodzica/opiekuna w profilu dziecka.",confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 const body=encodeURIComponent(reminderText(ch,month));
 window.location.href=`sms:${phone}?body=${body}`;
}
async function copyReminder(cid,month){
 const ch=data.children.find(c=>c.id==cid);if(!ch)return;
 const txt=reminderText(ch,month);
 try{await navigator.clipboard.writeText(txt);showToast("Skopiowano przypomnienie")}catch(e){prompt("Skopiuj tekst:",txt)}
}

function familyChildren(ch){
 const key=String(ch?.payerGroup||"").trim().toLowerCase();
 if(!key)return [];
 return data.children.filter(c=>String(c.payerGroup||"").trim().toLowerCase()===key);
}
function distributeFamilyPayment(ch,month,amount,date,note){
 const fam=familyChildren(ch).filter(childActiveNow);
 if(fam.length<2)return false;
 let left=Number(amount||0),created=[];
 fam.sort((a,b)=>(a.id===ch.id?-1:b.id===ch.id?1:0));
 fam.forEach(c=>{
   if(left<=0)return;
   const ps=paymentState(c,month);
   const need=Math.max(0,ps.missing);
   if(need<=0)return;
   const part=Math.min(left,need);
   data.payments.push({id:Date.now()+created.length,childId:c.id,child:`${c.last} ${c.first}`,month,amount:part,date,note:`Rodzina: ${note||""}`});
   created.push(`${c.first} ${c.last}: ${money(part)}`);left-=part;
 });
 if(left>0){
   data.payments.push({id:Date.now()+100,childId:ch.id,child:`${ch.last} ${ch.first}`,month,amount:left,date,note:`Nadwyżka rodzinna: ${note||""}`});
   created.push(`${ch.first} ${ch.last}: ${money(left)}`);
 }
 created.forEach(x=>logHistory(ch.id,`Rozdzielono wpłatę rodzinną — ${x}`));
 return created;
}

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

function archiveSchoolYear(){
 confirmModal({title:"Zamknąć rok szkolny?",message:`Utworzę archiwum ${data.currentSchoolYear}. Wpłaty, przychody i obecności bieżącego roku zostaną wyzerowane, a dzieci i zajęcia pozostaną w bazie.`,confirmText:"Archiwizuj",cancelText:"Anuluj",danger:false}).then(ok=>{
  if(!ok)return;
  data.archives.push({year:data.currentSchoolYear,createdAt:new Date().toISOString(),payments:structuredClone(data.payments),income:structuredClone(data.income),attendance:structuredClone(data.attendance),history:structuredClone(data.history),creditTransfers:structuredClone(data.creditTransfers)});
  const parts=String(data.currentSchoolYear).match(/(\d{4}).*?(\d{4})/);
  if(parts)data.currentSchoolYear=`${Number(parts[1])+1}/${Number(parts[2])+1}`;
  data.payments=[];data.income=[];data.attendance={};data.creditTransfers=[];
  save();settings();showToast("Rok zarchiwizowany");
 });
}

/* Profil dziecka rozszerzony */

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
/* zapis zajęć z limitem i historią */
function saveClass(cid,id,exists){
 let ch=data.children.find(c=>c.id==cid),old=exists?ch.classes.find(x=>x.id==id):null;
 let cl={id,type:clType.value,school:clSchool.value,day:clDay.value,time:clTime.value,price:+clPrice.value,discount:+clDisc.value,status:clStatus.value,waitlist:old?.waitlist||false,startDate:clStartDate?.value||(old?.startDate||ch.startDate||new Date().toISOString().slice(0,10)),endDate:clEndDate?.value||"",firstMonthOverride:(clFirstMonthOverride?.value===""?"":Number(clFirstMonthOverride.value))};
 enforceClassCapacity(ch,cl);
 if(exists)ch.classes[ch.classes.findIndex(x=>x.id==id)]=cl;else ch.classes.push(cl);
 logHistory(cid,`${exists?"Zmieniono":"Dodano"} zajęcia: ${cl.type}, ${cl.school}, ${cl.day} ${cl.time}${cl.waitlist?" — lista rezerwowa":""}.`);
 childrenRememberFilters();childrenViewState.focusChildId=cid;save();closeModal();page='children';render();
 if(cl.waitlist)confirmModal({title:"Lista rezerwowa",message:`Grupa osiągnęła limit ${data.settings.groupLimit} osób. Dziecko zapisano na listę rezerwową.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
}

/* ręczna wpłata z obsługą rodziny */
function addPayment(cid,query=""){
 let q=String(query||"").trim().toLowerCase(),matches=q?data.children.filter(c=>(c.last+" "+c.first+" "+c.first+" "+c.last).toLowerCase().includes(q)):data.children;
 if(cid){const selected=data.children.find(c=>c.id==cid);if(selected)matches=[selected]}
 if(!matches.length){confirmModal({title:"Nie znaleziono dziecka",message:`Brak dziecka pasującego do „${query}”.`,confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 modal(`<h2>Dodaj wpłatę</h2>${q?`<div class="payFilterInfo">Wyniki dla: <b>${query}</b> • ${matches.length}</div>`:""}
 <label>Dziecko</label><select id="pChild" onchange="refreshFamilyPayHint()">${matches.map(c=>`<option value="${c.id}" ${c.id==cid?"selected":""}>${c.last} ${c.first}</option>`).join("")}</select>
 <div id="familyPayHint"></div>
 <div class="grid2"><div><label>Miesiąc</label><select id="pMonth" onchange="refreshFamilyPayHint()">${opt(months,"Wrzesień")}</select></div><div><label>Kwota</label><input id="pAmount" type="number"></div></div>
 <label>Data</label><input id="pDate" type="date"><label>Tytuł / uwagi</label><input id="pNote">
 <label class="checkLine"><input id="pSplitFamily" type="checkbox"> Rozdziel wpłatę automatycznie na dzieci tego samego płatnika / rodziny</label>
 <div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="savePayment()">Zapisz</button></div>`);
 refreshFamilyPayHint();
}
function refreshFamilyPayHint(){
 const ch=data.children.find(c=>c.id==document.getElementById("pChild")?.value),el=document.getElementById("familyPayHint");if(!el||!ch)return;
 const fam=familyChildren(ch);
 el.innerHTML=fam.length>1?`<div class="familyHint">Wspólny płatnik: <b>${escapeHtml(ch.payerGroup)}</b> • dzieci: ${fam.map(x=>`${x.first} ${x.last}`).join(", ")}</div>`:"";
}
async function savePayment(){
 let ch=data.children.find(c=>c.id==pChild.value),amount=+pAmount.value,month=pMonth.value;
 if(!ch||amount<=0)return;
 if(document.getElementById("pSplitFamily")?.checked && familyChildren(ch).length>1){
   const created=distributeFamilyPayment(ch,month,amount,pDate.value,pNote.value);
   if(created){save();closeModal();render();await confirmModal({title:"Wpłata rozdzielona",message:created.join(" • "),confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 }
 const candidate={date:pDate.value,amount,payer:"RĘCZNIE",title:pNote.value,childId:ch.id},dup=findDuplicatePayment(candidate);
 if(dup){await confirmModal({title:"Ta wpłata już istnieje",message:`${ch.last} ${ch.first} • ${money(amount)}. Nie zapisuję ponownie.`,confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 data.payments.push({id:Date.now(),childId:ch.id,child:ch.last+" "+ch.first,month,amount,date:pDate.value,note:pNote.value,sourceFingerprint:paymentFingerprint(candidate)});
 logHistory(ch.id,`Dodano wpłatę ${money(amount)} za ${month}.`);
 save();closeModal();render();
 const ps=paymentState(ch,month);
 if(ps.kind==="partial")await confirmModal({title:"Wpłata częściowa",message:`Brakuje ${money(ps.missing)}.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
 else if(ps.kind==="overpaid")await confirmModal({title:"Nadpłata",message:`Nadpłata: ${money(ps.extra)}. Możesz ją przenieść na kolejny miesiąc z profilu dziecka.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
}

/* Grupy: nie pokazuj rezerwowych i nieaktywnych */

/* Ustawienia rozszerzone */
function settings(){
 settingsBase();
 const cards=document.querySelectorAll("#app .card"); if(!cards.length)return;
 const last=cards[cards.length-1];
 last.insertAdjacentHTML("beforebegin",`
 <div class="card"><h2>Organizacja grup</h2>
  <label>Domyślny limit miejsc w grupie</label><input id="setGroupLimit" type="number" min="1" value="${Number(data.settings.groupLimit||12)}">
  <button class="primary settingWideSave" onclick="data.settings.groupLimit=+setGroupLimit.value||12;save();showToast('Zapisano limit')">Zapisz limit</button>
 </div>
 <div class="card"><h2>Przypomnienia SMS</h2><p class="muted">Dostępne pola: {dziecko}, {miesiac}, {brakuje}, {warsztaty}</p>
  <textarea id="setReminderTemplate" rows="5">${escapeHtml(data.settings.reminderTemplate||"")}</textarea>
  <button class="primary settingWideSave" onclick="data.settings.reminderTemplate=setReminderTemplate.value;save();showToast('Zapisano tekst SMS')">Zapisz tekst SMS</button>
 </div>
 <div class="card"><h2>Rok szkolny i archiwum</h2>
  <label>Bieżący rok szkolny</label><input id="setSchoolYear" value="${escapeAttr(data.currentSchoolYear)}">
  <div class="actions"><button class="primary" onclick="data.currentSchoolYear=setSchoolYear.value;save();showToast('Zapisano rok')">Zapisz rok</button><button class="danger" onclick="archiveSchoolYear()">Archiwizuj i rozpocznij nowy rok</button></div>
  <div class="muted">Archiwa: ${data.archives.length?data.archives.map(a=>a.year).join(", "):"brak"}</div>
 </div>`);
}


/* v7.3 — interaktywne Listy */

/* Lista zaległości: dodaj telefon do eksportu/wydruku */

backupBtn.onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rozliczenia-kopia-v88.json";a.click()}
render();
