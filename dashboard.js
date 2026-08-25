/* =========================================================
   dashboard.js — Rozliczenia Warsztatów v10.1

   Dwie niezależne zasady:
   1. Wpłaty dzieci / zaległości -> wg miesiąca rozliczeniowego p.month
   2. Razem wpływy -> wg faktycznej daty p.date (gotówka/przelew wpłynął)
   ========================================================= */
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

function actualCashPeriod101(){
  const now=new Date();
  const names=["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
  return {
    year:now.getFullYear(),
    month:now.getMonth()+1,
    monthName:names[now.getMonth()]
  };
}

function dateYearMonth101(date){
  const s=String(date||"");
  const m=s.match(/^(\d{4})-(\d{2})/);
  if(!m)return null;
  return {year:Number(m[1]),month:Number(m[2])};
}

function paymentCashBelongs101(p,cashPeriod){
  const ym=dateYearMonth101(p?.date);

  // Nowe i prawidłowe wpisy: zawsze według faktycznej daty wpływu.
  if(ym){
    return ym.year===cashPeriod.year && ym.month===cashPeriod.month;
  }

  // Zgodność ze starymi wpisami bez daty:
  // nie pozwalamy im zniknąć całkowicie z zestawienia.
  const names=["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
  return String(p?.month||"")===names[cashPeriod.month-1];
}

function incomeCashBelongs101(i,cashPeriod){
  const ym=dateYearMonth101(i?.date);
  return !!ym && ym.year===cashPeriod.year && ym.month===cashPeriod.month;
}

/*
  Owijamy istniejące obliczenia dashboardu.
  Nie ruszamy należności, zaległości, liczby opłaconych ani statystyk szkół.
  Zmieniamy wyłącznie pola przepływu gotówki: extra i total.
*/
const originalCurrentMonthDashboard101=window.currentMonthDashboard;

if(typeof originalCurrentMonthDashboard101==="function"){
  window.currentMonthDashboard=function(){
    const dash=originalCurrentMonthDashboard101();
    const cashPeriod=actualCashPeriod101();

    const cashChildPaid=(data.payments||[])
      .filter(p=>paymentCashBelongs101(p,cashPeriod))
      .reduce((sum,p)=>sum+Number(p.amount||0),0);

    const cashExtra=(data.income||[])
      .filter(i=>incomeCashBelongs101(i,cashPeriod))
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
function annotateCashTile101(){
  if(typeof page==="undefined" || page!=="start" || !app)return;

  const tiles=[...app.querySelectorAll(".dashboardTile")];
  const tile=tiles.find(x=>(x.querySelector("span")?.textContent||"").trim()==="Razem wpływy");
  if(!tile)return;

  const small=tile.querySelector("small");
  if(!small)return;

  const cp=actualCashPeriod101();
  small.textContent=`wg daty wpływu • ${cp.monthName} ${cp.year}`;
}

const originalStart101=window.start;
if(typeof originalStart101==="function"){
  window.start=function(){
    originalStart101();
    annotateCashTile101();
  };
}

setTimeout(()=>{
  if(typeof render==="function" && typeof page!=="undefined" && page==="start"){
    render();
  }
},0);

window.RWModules=window.RWModules||{};
window.RWModules.dashboard={version:"10.1",cashflowByTransactionDate:true};

})();