/* =========================================================
 core.js — Rozliczenia Warsztatów v11.2
 Dane, zapis, wspólne obliczenia, nawigacja i migracje modelu.
 ========================================================= */


/* ===== WERSJA I STAŁE ===== */
const VERSION="12.4";
const months=["Wrzesień","Październik","Listopad","Grudzień","Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec"];
const schools=["SP 162","ZSP 17"];
const workshops=["Rękodzieło","Zaawansowane","Artystyczne"];
const days=["Poniedziałek","Wtorek","Środa","Czwartek","Piątek"];
const times=["13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
const pickupPlaces=["Sala 1","Sala 2","Sala 3","Sala 4","Sala 5","Przychodzi sam/a"];

/* ===== MODEL DANYCH ===== */
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

/* ===== ZAPIS I PERSISTENCJA ===== */
function save(){localStorage.setItem("rw45",JSON.stringify(data));showSavedFeedback()}
function money(v){return Number(v||0).toLocaleString("pl-PL",{minimumFractionDigits:2,maximumFractionDigits:2})+" zł"}
function dueClass(c){return c.status==="bezplatne"?0:Math.max(0,c.price*(1-(c.discount||0)/100))}

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

/* ===== NAWIGACJA I RENDER ===== */
function render(){renderNav(); ({start,children,payments,income,signups,groups,reports,lists,settings}[page]||start)()}


function showToast(text){
 let t=document.getElementById("appToast");
 if(!t){t=document.createElement("div");t.id="appToast";t.className="appToast";document.body.appendChild(t)}
 t.textContent=text;t.classList.add("show");clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.remove("show"),1300);
}


function escapeAttr(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function escapeHtml(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}


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

