/* =========================================================
   modules/dashboard.js — Rozliczenia Warsztatów v9.7
   Moduł wydzielony z poprawek dashboardu 9.3/9.5
   ========================================================= */
(function(){
"use strict";

window.paymentBelongsToDashboardMonth=function(p,period){
  return !!p && String(p.month||"")===String(period.month||"");
};

window.currentDashboardPeriod=function(){
  const now=new Date();
  const names=["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
  let month=names[now.getMonth()], year=now.getFullYear();
  if(!months.includes(month)){month="Wrzesień";year=now.getFullYear();}
  return {month,year,monthNumber:names.indexOf(month)+1};
};

setTimeout(()=>{
  if(typeof render==="function" && typeof page!=="undefined" && page==="start")render();
},0);

window.RWModules=window.RWModules||{};
window.RWModules.dashboard={version:"9.7"};
})();