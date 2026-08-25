/* Rozliczenia Warsztatów v9.3
   Poprawka dashboardu:
   - wpłaty liczone wg miesiąca rozliczeniowego p.month,
   - w lipcu/sierpniu Start pokazuje najbliższy miesiąc rozliczeniowy: wrzesień.
*/
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

  return {
    month,
    year,
    monthNumber:names.indexOf(month)+1
  };
};

})();