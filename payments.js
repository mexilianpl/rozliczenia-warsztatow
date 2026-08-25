/* payments.js — Rozliczenia Warsztatów v10.2 */
(function(){
"use strict";

const QUICKPAY89_KEY="rw89_quickpay";
const OCR_CERTAIN_THRESHOLD=90;

function normPay(s){
  return String(s||"")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/ł/g,"l").replace(/Ł/g,"L")
    .toLowerCase().replace(/\s+/g," ").trim();
}
function escPay(s){
  return String(s??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function activeChildrenPay(){
  return (data.children||[])
    .filter(c=>typeof childActiveNow==="function"?childActiveNow(c):true)
    .slice().sort((a,b)=>`${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`,"pl"));
}

window.quickPaySearch98=function(value){
  const box=document.getElementById("quickPayResults98"); if(!box)return;
  const q=normPay(value); if(!q){box.innerHTML="";return}
  const tokens=q.split(" ").filter(Boolean);

  const found=activeChildrenPay().filter(c=>{
    const hay=normPay([c.last,c.first,`${c.last} ${c.first}`,`${c.first} ${c.last}`,c.school||"",c.class||""].join(" "));
    return tokens.every(t=>hay.includes(t));
  }).slice(0,25);

  if(!found.length){
    box.innerHTML='<div class="quickPayEmpty90">Brak pasującego dziecka.</div>';
    return;
  }

  box.innerHTML=found.map(c=>`<button type="button" class="quickPayChild90" onclick="openQuickPayForChild98(${c.id})">
    <span><b>${escPay(c.last)} ${escPay(c.first)}</b><small>${escPay(c.school||"")}${c.class?` • ${escPay(c.class)}`:""}</small></span>
    <span class="arrow90">›</span>
  </button>`).join("");
};

window.openQuickPayForChild98=function(childId){
  if(typeof openQuickPayment89!=="function")return;
  let prefs={}; try{prefs=JSON.parse(localStorage.getItem(QUICKPAY89_KEY)||"{}")}catch(e){}
  prefs.childId=Number(childId);
  if(!prefs.month && typeof currentMonthName==="function")prefs.month=currentMonthName();
  localStorage.setItem(QUICKPAY89_KEY,JSON.stringify(prefs));
  openQuickPayment89();
};

function replacePaymentCard98(){
  if(!app)return;
  const pageTitle=[...app.querySelectorAll(".title")].find(x=>normPay(x.textContent)==="wplaty");
  if(!pageTitle)return;

  const card=[...app.querySelectorAll(".card")].find(c=>{
    const h=c.querySelector("h2");
    return h && normPay(h.textContent)==="dodaj wplate";
  });

  if(!card || card.dataset.quickPay98==="1")return;
  card.dataset.quickPay98="1";
  card.innerHTML=`<h2>Dodaj wpłatę</h2>
    <div class="quickPaySearch90">
      <div class="search">
        <input id="quickPayInput98" type="search" autocomplete="off" placeholder="Szukaj dziecka..." oninput="quickPaySearch98(this.value)">
      </div>
      <div id="quickPayResults98" class="quickPayResults90"></div>
      <div class="quickPayHelp90">Wpisz pierwsze litery nazwiska lub imienia i wybierz dziecko.</div>
    </div>`;
}

function removeStartQuickPay98(){document.getElementById("quickPaymentStart89")?.remove()}

/* =========================
   EDYCJA ISTNIEJĄCEJ WPŁATY
   ========================= */

window.editPayment102=function(paymentId){
  const p=(data.payments||[]).find(x=>Number(x.id)===Number(paymentId));
  if(!p){
    if(typeof showToast==="function")showToast("Nie znaleziono wpłaty");
    return;
  }

  const children=(data.children||[]).slice().sort((a,b)=>
    `${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`,"pl")
  );

  const selectedChild=(data.children||[]).find(c=>Number(c.id)===Number(p.childId));

  modal(`<h2>Edytuj wpłatę</h2>
    <div class="muted editPaymentInfo102">
      Zmiany od razu przeliczą rozliczenie dziecka oraz podsumowanie wpływów.
    </div>

    <label>Dziecko</label>
    <select id="epChild102">
      ${children.map(c=>`<option value="${c.id}" ${Number(c.id)===Number(p.childId)?"selected":""}>${escPay(c.last)} ${escPay(c.first)} • ${escPay(c.school||"")}</option>`).join("")}
    </select>

    <label>Miesiąc rozliczeniowy</label>
    <select id="epMonth102">
      ${(months||[]).map(m=>`<option ${String(m)===String(p.month)?"selected":""}>${escPay(m)}</option>`).join("")}
    </select>

    <label>Kwota</label>
    <input id="epAmount102" type="number" min="0" step="0.01" inputmode="decimal" value="${Number(p.amount||0).toFixed(2)}">

    <label>Data wpływu</label>
    <input id="epDate102" type="date" value="${escPay(p.date||"")}">

    <label>Tytuł / uwagi</label>
    <input id="epNote102" value="${escPay(p.note||"")}">

    <div class="paymentEditHint102">
      <b>Miesiąc rozliczeniowy</b> określa, za który miesiąc płaci dziecko.
      <b>Data wpływu</b> określa, w którym miesiącu kwota trafia do „Razem wpływy”.
    </div>

    <div class="actions">
      <button class="soft" onclick="closeModal()">Anuluj</button>
      <button class="primary" onclick="saveEditedPayment102(${Number(p.id)})">Zapisz zmiany</button>
    </div>`);
};

window.saveEditedPayment102=function(paymentId){
  const p=(data.payments||[]).find(x=>Number(x.id)===Number(paymentId));
  if(!p)return;

  const childId=Number(document.getElementById("epChild102")?.value||0);
  const month=document.getElementById("epMonth102")?.value||"";
  const amount=Number(String(document.getElementById("epAmount102")?.value||"0").replace(",","."));
  const date=document.getElementById("epDate102")?.value||"";
  const note=document.getElementById("epNote102")?.value.trim()||"";
  const ch=(data.children||[]).find(c=>Number(c.id)===childId);

  if(!ch){
    if(typeof showToast==="function")showToast("Wybierz dziecko");
    return;
  }
  if(!(amount>0)){
    if(typeof showToast==="function")showToast("Kwota musi być większa od 0");
    return;
  }
  if(!month){
    if(typeof showToast==="function")showToast("Wybierz miesiąc");
    return;
  }
  if(!date){
    if(typeof showToast==="function")showToast("Podaj datę wpływu");
    return;
  }

  const before={
    childId:p.childId,
    child:p.child,
    month:p.month,
    amount:Number(p.amount||0),
    date:p.date||"",
    note:p.note||""
  };

  p.childId=ch.id;
  p.child=`${ch.last} ${ch.first}`;
  p.month=month;
  p.amount=amount;
  p.date=date;
  p.note=note;

  if(typeof logHistory==="function"){
    const desc=`Edytowano wpłatę: ${money(before.amount)} / ${before.month} / ${before.date||"brak daty"} → ${money(amount)} / ${month} / ${date}.`;
    try{ logHistory(ch.id,desc); }catch(e){}
    if(Number(before.childId)!==Number(ch.id)){
      try{ logHistory(before.childId,`Wpłata została przeniesiona do: ${ch.last} ${ch.first}.`); }catch(e){}
    }
  }

  save();
  closeModal();
  page="payments";
  render();

  if(typeof showToast==="function")showToast("Wpłata zaktualizowana");
};

/* Dodajemy przycisk Edytuj do każdej istniejącej pozycji bez ruszania app.js. */
function addEditButtons102(){
  if(typeof page==="undefined" || page!=="payments" || !app)return;

  const listCard=[...app.querySelectorAll(".card")].find(card=>
    normPay(card.querySelector("h2")?.textContent||"")==="lista wplat"
  );
  if(!listCard)return;

  const rows=[...listCard.querySelectorAll(".classrow")];
  const payments=data.payments||[];

  rows.forEach((row,index)=>{
    if(row.querySelector(".editPaymentBtn102"))return;
    const p=payments[index];
    if(!p)return;

    const del=[...row.querySelectorAll("button")].find(b=>normPay(b.textContent)==="usun");
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="soft editPaymentBtn102";
    btn.textContent="Edytuj";
    btn.onclick=()=>editPayment102(p.id);

    if(del) row.insertBefore(btn,del);
    else row.appendChild(btn);
  });
}

const payObserver=new MutationObserver(()=>{
  removeStartQuickPay98();
  replacePaymentCard98();
  enhanceOCRReview98();
  addEditButtons102();
});
payObserver.observe(app,{childList:true,subtree:true});

function confidenceForOCR98(item){
  return Math.round(Math.max(0,Math.min(100,Number(item?.match?.score||0))));
}
function isCertainOCR98(item){
  return !!(item?.match?.child && confidenceForOCR98(item)>=OCR_CERTAIN_THRESHOLD && Number(item.amount)>0 && item.date);
}
function unresolvedCertainIndices98(){
  const items=window.__ocrItems||[];
  return items.map((t,i)=>({t,i})).filter(({t,i})=>
    isCertainOCR98(t) &&
    !document.querySelector(`#ocrLine${i}`)?.classList.contains("ocrAccepted")
  );
}
function updateBulkButton98(){
  const btn=document.getElementById("ocrBulkCertain98");
  if(!btn)return;
  const count=unresolvedCertainIndices98().length;
  btn.disabled=count===0;
  btn.textContent=count?`✓ Zapisz ${count} pewnych wpłat`:"✓ Brak pewnych wpłat do zapisania";
}

function enhanceOCRReview98(){
  const items=window.__ocrItems||[];
  const review=document.getElementById("ocrReview");
  if(!review || review.dataset.enhanced98==="1")return;
  review.dataset.enhanced98="1";

  items.forEach((t,idx)=>{
    const hint=document.getElementById(`ocrHint${idx}`);
    if(!hint)return;
    const score=confidenceForOCR98(t);
    if(t.match?.child){
      hint.insertAdjacentHTML("afterend",
        `<div class="ocrConfidence98 ${score>=OCR_CERTAIN_THRESHOLD?"certain":"review"}">
          Pewność dopasowania: ${score}%${score>=OCR_CERTAIN_THRESHOLD?" • pewne":" • sprawdź ręcznie"}
        </div>`);
    }
  });

  const certain=unresolvedCertainIndices98().length;
  review.insertAdjacentHTML("beforebegin",
    `<div class="ocrBulkBar98">
      <div><b>Automatyczna weryfikacja</b><span>${certain} z ${items.length} pozycji ma pewność co najmniej ${OCR_CERTAIN_THRESHOLD}%.</span></div>
      <button id="ocrBulkCertain98" class="primary" onclick="saveCertainOCR98()">✓ Zapisz ${certain} pewnych wpłat</button>
    </div>`);
}

window.saveCertainOCR98=async function(){
  const rows=unresolvedCertainIndices98();
  let saved=0,left=0;

  for(const {t,i} of rows){
    const childSelect=document.querySelector(`#ocrChild${i}`);
    if(childSelect && t.match?.child)childSelect.value=String(t.match.child.id);

    let result={ok:false};
    try{result=persistOCRItem(t,i)}catch(e){}

    if(result?.ok){
      saved++;
      if(typeof markOCRDone==="function"){
        markOCRDone(i,result.state?.kind==="partial"?"Wpłata częściowa":"Wpłata zaakceptowana");
      }
    }else{
      left++;
      const hint=document.getElementById(`ocrHint${i}`);
      if(hint){
        hint.className="ocrWarn";
        hint.textContent="Wymaga ręcznej weryfikacji.";
      }
    }
  }

  if(saved && typeof save==="function")save();
  updateBulkButton98();

  if(typeof showToast==="function"){
    showToast(`Zapisano ${saved} pewnych wpłat${left?` • ${left} do sprawdzenia`:""}`);
  }
};

const originalShowOCRReview98=window.showOCRReview;
if(typeof originalShowOCRReview98==="function"){
  window.showOCRReview=function(items,fileName){
    originalShowOCRReview98(items,fileName);
    setTimeout(enhanceOCRReview98,0);
  };
}

const style=document.createElement("style");
style.textContent=`
.ocrBulkBar98{display:flex;gap:12px;align-items:center;justify-content:space-between;margin:14px 0;padding:14px;border:1px solid #bfe4da;border-radius:18px;background:#f0faf7}
.ocrBulkBar98 b,.ocrBulkBar98 span{display:block}.ocrBulkBar98 b{color:#126f5d;font-size:16px}.ocrBulkBar98 span{margin-top:4px;color:#64727d;font-size:13px;font-weight:700}
.ocrConfidence98{margin:7px 0 10px;padding:7px 10px;border-radius:12px;font-size:13px;font-weight:900}
.ocrConfidence98.certain{background:#e7f8f1;color:#11745d}.ocrConfidence98.review{background:#fff6df;color:#9a6800}
.editPaymentBtn102{margin-right:8px}
.editPaymentInfo102{margin-bottom:14px}
.paymentEditHint102{margin:14px 0;padding:12px 14px;border-radius:16px;background:#eef8fb;color:#526573;font-size:13px;line-height:1.5}
.paymentEditHint102 b{color:var(--blue)}
@media(max-width:620px){.ocrBulkBar98{align-items:stretch;flex-direction:column}.ocrBulkBar98 button{width:100%}}
`;
document.head.appendChild(style);

setTimeout(()=>{
  removeStartQuickPay98();
  replacePaymentCard98();
  enhanceOCRReview98();
  addEditButtons102();
},0);

window.RWModules=window.RWModules||{};
window.RWModules.payments={version:"10.2",ocrCertainThreshold:OCR_CERTAIN_THRESHOLD,paymentEditing:true};
})();