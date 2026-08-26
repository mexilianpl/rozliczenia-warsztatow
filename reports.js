/* =========================================================
   reports.js — Rozliczenia Warsztatów v11.0
   Raporty i eksport raportów wydzielone z app.js.
   ========================================================= */
"use strict";

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



window.RWModules=window.RWModules||{};
window.RWModules.reports={version:"11.4"};
