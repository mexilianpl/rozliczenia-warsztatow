/* =========================================================
   Rozliczenia Warsztatów v9.9
   - edycja dodatkowych przychodów
   - zaległości: wpłacono + brakuje
   - uproszczony opis dziecka: szkoła • klasa
   ========================================================= */
(function(){
"use strict";

function esc99(s){
  return String(s??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* =========================
   PRZYCHODY — EDYCJA
   ========================= */

window.editIncome99=function(id){
  const item=(data.income||[]).find(x=>Number(x.id)===Number(id));
  if(!item)return;

  modal(`<h2>Edytuj przychód</h2>
    <label>Tytuł</label>
    <input id="i99Title" value="${esc99(item.title||"")}">

    <label>Kwota</label>
    <input id="i99Amount" type="number" min="0" step="0.01" inputmode="decimal" value="${Number(item.amount||0)}">

    <label>Data</label>
    <input id="i99Date" type="date" value="${esc99(item.date||"")}">

    <div class="actions">
      <button class="soft" onclick="closeModal()">Anuluj</button>
      <button class="primary" onclick="saveIncome99(${Number(item.id)})">Zapisz zmiany</button>
    </div>`);
};

window.saveIncome99=function(id){
  const item=(data.income||[]).find(x=>Number(x.id)===Number(id));
  if(!item)return;

  const title=document.getElementById("i99Title")?.value.trim()||"";
  const amount=Number(String(document.getElementById("i99Amount")?.value||"0").replace(",","."));
  const date=document.getElementById("i99Date")?.value||"";

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

const originalIncome99=window.income;
if(typeof originalIncome99==="function"){
  window.income=function(){
    app.innerHTML=`<div class="eyebrow">FINANSE</div>
      <h2 class="title">Dodatkowe przychody</h2>
      <button class="primary" onclick="addIncome()">+ Dodaj przychód</button>
      <div class="card incomeList99">
        ${(data.income||[]).length
          ? data.income.map(i=>`<div class="classrow incomeRow99">
              <div class="incomeMain99">
                <b>${esc99(i.title||"")}</b>
                <div>${money(i.amount)} • ${esc99(i.date||"")}</div>
              </div>
              <button class="soft incomeEdit99" onclick="editIncome99(${Number(i.id)})">Edytuj</button>
            </div>`).join("")
          : "Brak dodatkowych przychodów."}
      </div>`;
  };
}

/* =========================
   ZALEGŁOŚCI — SZYBKIE DZIAŁANIA
   ========================= */

const originalInteractiveListPanel99=window.interactiveListPanel;
if(typeof originalInteractiveListPanel99==="function"){
  window.interactiveListPanel=function(type){
    if(type!=="arrears")return originalInteractiveListPanel99(type);

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
        <div class="interactiveListRow debtRow99">
          <div class="interactiveMain">
            <b>${esc99(c.last)} ${esc99(c.first)}</b>
            <span>${esc99(c.school||"")}${c.class?` • ${esc99(c.class)}`:""}</span>
          </div>

          <div class="debtAmounts99">
            <div class="debtPaid99"><span>Wpłacono</span><b>${money(ps.paid||0)}</b></div>
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

/* =========================
   LISTA ZALEGŁOŚCI — PODGLĄD
   Zamieniamy pojedynczą kwotę należności na czytelne:
   wpłacono / brakuje.
   ========================= */

const originalListRowsBase99=window.listRowsBase;
if(typeof originalListRowsBase99==="function"){
  window.listRowsBase=function(type){
    const result=originalListRowsBase99(type);
    if(type!=="arrears")return result;

    const month=typeof listSelectedMonth==="function" ? listSelectedMonth() : currentMonthName();
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

/* =========================
   STYLE
   ========================= */

const style=document.createElement("style");
style.textContent=`
.incomeRow99{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
}
.incomeMain99{min-width:0}
.incomeEdit99{flex:0 0 auto}

.debtAmounts99{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
  margin-top:12px;
}
.debtAmounts99>div{
  padding:10px 12px;
  border-radius:15px;
  background:#f5f8fa;
}
.debtAmounts99 span,.debtAmounts99 b{display:block}
.debtAmounts99 span{
  color:#77818b;
  font-size:12px;
  font-weight:800;
}
.debtAmounts99 b{
  margin-top:3px;
  font-size:18px;
}
.debtPaid99 b{color:#168867}
.debtAmounts99 .interactiveDebt b{color:var(--red)}

@media(max-width:520px){
  .incomeRow99{align-items:flex-start}
  .incomeEdit99{padding:10px 14px}
}
`;
document.head.appendChild(style);

window.RWModules=window.RWModules||{};
window.RWModules.incomeArrears={version:"9.9"};

})();