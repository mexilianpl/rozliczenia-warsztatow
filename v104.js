/* =========================================================
   Rozliczenia Warsztatów v10.4
   Dodatkowe przychody — przycisk Usuń z potwierdzeniem.
   ========================================================= */
(function(){
"use strict";

function esc104(s){
  return String(s??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

window.deleteIncome104=function(id){
  const item=(data.income||[]).find(x=>Number(x.id)===Number(id));
  if(!item)return;

  const ok=confirm(`Usunąć przychód:\n${item.title||"Bez tytułu"}\n${money(item.amount||0)} • ${item.date||""}?`);
  if(!ok)return;

  data.income=(data.income||[]).filter(x=>Number(x.id)!==Number(id));
  save();
  page="income";
  render();

  if(typeof showToast==="function")showToast("Przychód usunięty");
};

/* Nadpisujemy tylko widok Przychodów, zachowując edycję z v9.9. */
window.income=function(){
  app.innerHTML=`<div class="eyebrow">FINANSE</div>
    <h2 class="title">Dodatkowe przychody</h2>
    <button class="primary" onclick="addIncome()">+ Dodaj przychód</button>

    <div class="card incomeList104">
      ${(data.income||[]).length
        ? data.income.map(i=>`<div class="classrow incomeRow104">
            <div class="incomeMain104">
              <b>${esc104(i.title||"")}</b>
              <div>${money(i.amount)} • ${esc104(i.date||"")}</div>
            </div>

            <div class="incomeActions104">
              <button class="soft" onclick="editIncome99(${Number(i.id)})">Edytuj</button>
              <button class="danger" onclick="deleteIncome104(${Number(i.id)})">Usuń</button>
            </div>
          </div>`).join("")
        : "Brak dodatkowych przychodów."}
    </div>`;
};

const style=document.createElement("style");
style.textContent=`
.incomeRow104{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
}
.incomeMain104{min-width:0}
.incomeActions104{
  display:flex;
  gap:8px;
  flex:0 0 auto;
}
@media(max-width:520px){
  .incomeRow104{align-items:flex-start}
  .incomeActions104{
    flex-direction:column;
  }
  .incomeActions104 button{
    min-width:100px;
  }
}
`;
document.head.appendChild(style);

window.RWModules=window.RWModules||{};
window.RWModules.deleteIncome={version:"10.4"};

})();