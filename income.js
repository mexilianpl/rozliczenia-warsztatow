/* Bazowe przychody z app.js — v11.2 */
"use strict";
function income(){app.innerHTML=`<div class="eyebrow">FINANSE</div><h2 class="title">Dodatkowe przychody</h2><button class="primary" onclick="addIncome()">+ Dodaj przychód</button><div class="card">${data.income.map(i=>`<div class="classrow"><b>${i.title}</b><div>${money(i.amount)} • ${i.date}</div></div>`).join("")||"Brak dodatkowych przychodów."}</div>`}
function addIncome(){modal(`<h2>Dodaj przychód</h2><label>Tytuł</label><input id="iTitle"><label>Kwota</label><input id="iAmount" type="number"><label>Data</label><input id="iDate" type="date"><div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="data.income.push({id:Date.now(),title:iTitle.value,amount:+iAmount.value,date:iDate.value});save();closeModal();render()">Zapisz</button></div>`)}

/* =========================================================
   income.js — Rozliczenia Warsztatów v10.7

   Scalono:
   - v99.js  : edycja przychodów + zaległości
   - v104.js : usuwanie przychodów

   Tymczasowo moduł zawiera również ulepszenia listy zaległości,
   do czasu wydzielenia osobnego lists.js.
   ========================================================= */
(function(){
"use strict";


/* ---------- EDYCJA ---------- */
window.editIncome=function(id){
  const item=(data.income||[]).find(x=>Number(x.id)===Number(id));
  if(!item)return;

  modal(`<h2>Edytuj przychód</h2>
    <label>Tytuł</label>
    <input id="income107Title" value="${escapeHtml(item.title||"")}">

    <label>Kwota</label>
    <input id="income107Amount" type="number" min="0" step="0.01" inputmode="decimal" value="${Number(item.amount||0)}">

    <label>Data</label>
    <input id="income107Date" type="date" value="${escapeHtml(item.date||"")}">

    <div class="actions">
      <button class="soft" onclick="closeModal()">Anuluj</button>
      <button class="primary" onclick="saveIncome(${Number(item.id)})">Zapisz zmiany</button>
    </div>`);
};

window.saveIncome=function(id){
  const item=(data.income||[]).find(x=>Number(x.id)===Number(id));
  if(!item)return;

  const title=document.getElementById("income107Title")?.value.trim()||"";
  const amount=Number(String(document.getElementById("income107Amount")?.value||"0").replace(",","."));
  const date=document.getElementById("income107Date")?.value||"";

  if(!title){
    if(typeof showToast==="function")showToast("Podaj tytuł przychodu");
    return;
  }
  if(!(amount>=0)){
    if(typeof showToast==="function")showToast("Podaj prawidłową kwotę");
    return;
  }

  item.title=title;
  item.amount=amount;
  item.date=date;

  save();
  closeModal();
  page="income";
  render();

  if(typeof showToast==="function")showToast("Przychód zaktualizowany");
};

/* ---------- USUWANIE ---------- */
window.deleteIncome=function(id){
  const item=(data.income||[]).find(x=>Number(x.id)===Number(id));
  if(!item)return;

  const ok=window.confirm(
    `Usunąć przychód:\n${item.title||"Bez tytułu"}\n${money(item.amount||0)} • ${item.date||""}?`
  );
  if(!ok)return;

  data.income=(data.income||[]).filter(x=>Number(x.id)!==Number(id));
  save();
  page="income";
  render();

  if(typeof showToast==="function")showToast("Przychód usunięty");
};

/* ---------- WIDOK ---------- */
window.income=function(){
  app.innerHTML=`<div class="eyebrow">FINANSE</div>
    <h2 class="title">Dodatkowe przychody</h2>
    <button class="primary" onclick="addIncome()">+ Dodaj przychód</button>

    <div class="card incomeList">
      ${(data.income||[]).length
        ? data.income.map(i=>`<div class="classrow incomeRow">
            <div class="incomeMain">
              <b>${escapeHtml(i.title||"")}</b>
              <div>${money(i.amount)} • ${escapeHtml(i.date||"")}</div>
            </div>

            <div class="incomeActions">
              <button class="soft" onclick="editIncome(${Number(i.id)})">Edytuj</button>
              <button class="danger" onclick="deleteIncome(${Number(i.id)})">Usuń</button>
            </div>
          </div>`).join("")
        : "Brak dodatkowych przychodów."}
    </div>`;
};

/* ---------- ZALEGŁOŚCI — SZYBKIE DZIAŁANIA ---------- */
const previousInteractiveListPanel=window.interactiveListPanel;
if(typeof previousInteractiveListPanel==="function"){
  window.interactiveListPanel=function(type){
    if(type!=="arrears")return previousInteractiveListPanel(type);

    const arr=listFilteredChildren();
    const month=listSelectedMonth();
    let debtors=arr
      .map(c=>({c,ps:paymentState(c,month)}))
      .filter(x=>["unpaid","partial"].includes(x.ps.kind));

    if(window.dashboardArrearsMode==="partial"){
      debtors=debtors.filter(x=>x.ps.kind==="partial");
    }

    return `<div class="card interactiveListCard">
      <h2>Zaległości — szybkie działania</h2>
      <div class="muted interactiveListInfo">${month} • ${debtors.length} ${debtors.length===1?"osoba":"osób"} z zaległością</div>

      ${debtors.length?debtors.map(({c,ps})=>`
        <div class="interactiveListRow debtRow">
          <div class="interactiveMain">
            <b>${escapeHtml(c.last)} ${escapeHtml(c.first)}</b>
            <span>${escapeHtml(c.school||"")}${c.class?` • ${escapeHtml(c.class)}`:""}</span>
          </div>

          <div class="debtAmounts">
            <div class="debtPaid"><span>Wpłacono</span><b>${money(ps.paid||0)}</b></div>
            <div class="interactiveDebt"><span>Brakuje</span><b>${money(ps.missing||0)}</b></div>
          </div>

          <div class="interactiveActions">
            <button class="smsBtn" onclick="sendReminderSMS(${c.id},'${month}')">💬 Wyślij SMS</button>
            <button class="soft" onclick="copyReminder(${c.id},'${month}')">Kopiuj tekst</button>
            <button class="soft" onclick="editChild(${c.id})">Profil</button>
          </div>
        </div>`).join("")
        : `<div class="muted">Brak zaległości.</div>`}
    </div>`;
  };
}

/* ---------- LISTA ZALEGŁOŚCI ---------- */
const previousListRowsBase=window.listRowsBase;
if(typeof previousListRowsBase==="function"){
  window.listRowsBase=function(type){
    const result=previousListRowsBase(type);
    if(type!=="arrears")return result;

    const month=typeof listSelectedMonth==="function"
      ? listSelectedMonth()
      : currentMonthName();

    const arr=listFilteredChildren();

    result.title=`Lista zaległości — ${month}`;
    result.headers=["Dziecko","Szkoła","Należne","Wpłacono","Brakuje","Status"];
    result.rows=arr.map(c=>{
      const ps=paymentState(c,month);
      return ["unpaid","partial"].includes(ps.kind)
        ? [`${c.last} ${c.first}`,c.school||"",money(ps.due||0),money(ps.paid||0),money(ps.missing||0),ps.label]
        : null;
    }).filter(Boolean);

    return result;
  };
}

const style=document.createElement("style");
style.textContent=`
.incomeRow{display:flex;align-items:center;justify-content:space-between;gap:14px}
.incomeMain{min-width:0}
.incomeActions{display:flex;gap:8px;flex:0 0 auto}

.debtAmounts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.debtAmounts>div{padding:10px 12px;border-radius:15px;background:#f5f8fa}
.debtAmounts span,.debtAmounts b{display:block}
.debtAmounts span{color:#77818b;font-size:12px;font-weight:800}
.debtAmounts b{margin-top:3px;font-size:18px}
.debtPaid b{color:#168867}
.debtAmounts .interactiveDebt b{color:var(--red)}

@media(max-width:520px){
  .incomeRow{align-items:flex-start}
  .incomeActions{flex-direction:column}
  .incomeActions button{min-width:100px}
}
`;
document.head.appendChild(style);

window.RWModules=window.RWModules||{};
window.RWModules.income={version:"11.5"};

})();