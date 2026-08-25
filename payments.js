/* =========================================================
   modules/payments.js — Rozliczenia Warsztatów v9.7
   Moduł: wyszukiwarka szybkiej wpłaty + OCR + pewność dopasowania
   ========================================================= */
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

/* ---------- SZYBKA WPŁATA W ZAKŁADCE WPŁATY ---------- */
window.quickPaySearch97=function(value){
  const box=document.getElementById("quickPayResults97"); if(!box)return;
  const q=normPay(value); if(!q){box.innerHTML="";return}
  const tokens=q.split(" ").filter(Boolean);
  const found=activeChildrenPay().filter(c=>{
    const hay=normPay([c.last,c.first,`${c.last} ${c.first}`,`${c.first} ${c.last}`,c.school||"",c.class||""].join(" "));
    return tokens.every(t=>hay.includes(t));
  }).slice(0,25);
  if(!found.length){box.innerHTML='<div class="quickPayEmpty90">Brak pasującego dziecka.</div>';return}
  box.innerHTML=found.map(c=>`<button type="button" class="quickPayChild90" onclick="openQuickPayForChild97(${c.id})">
    <span><b>${escPay(c.last)} ${escPay(c.first)}</b><small>${escPay(c.school||"")}${c.class?` • ${escPay(c.class)}`:""}</small></span><span class="arrow90">›</span>
  </button>`).join("");
};

window.openQuickPayForChild97=function(childId){
  if(typeof openQuickPayment89!=="function")return;
  let prefs={}; try{prefs=JSON.parse(localStorage.getItem(QUICKPAY89_KEY)||"{}")}catch(e){}
  prefs.childId=Number(childId);
  if(!prefs.month && typeof currentMonthName==="function")prefs.month=currentMonthName();
  localStorage.setItem(QUICKPAY89_KEY,JSON.stringify(prefs));
  openQuickPayment89();
};

function replacePaymentCard97(){
  if(!app)return;
  const pageTitle=[...app.querySelectorAll(".title")].find(x=>normPay(x.textContent)==="wplaty");
  if(!pageTitle)return;
  const card=[...app.querySelectorAll(".card")].find(c=>{
    const h=c.querySelector("h2"); return h && normPay(h.textContent)==="dodaj wplate";
  });
  if(!card||card.dataset.quickPay97==="1")return;
  card.dataset.quickPay97="1";
  card.innerHTML=`<h2>Dodaj wpłatę</h2>
    <div class="quickPaySearch90"><div class="search"><input id="quickPayInput97" type="search" autocomplete="off" placeholder="Szukaj dziecka..." oninput="quickPaySearch97(this.value)"></div>
    <div id="quickPayResults97" class="quickPayResults90"></div><div class="quickPayHelp90">Wpisz pierwsze litery nazwiska lub imienia i wybierz dziecko.</div></div>`;
}
function removeStartQuickPay97(){document.getElementById("quickPaymentStart89")?.remove()}
const payObserver=new MutationObserver(()=>{removeStartQuickPay97();replacePaymentCard97();});
payObserver.observe(app,{childList:true,subtree:true});
setTimeout(()=>{removeStartQuickPay97();replacePaymentCard97();},0);

/* ---------- OCR: PEWNOŚĆ + ZBIORCZE ZAPISANIE ---------- */
function confidenceForOCR97(item){
  const score=Math.max(0,Math.min(100,Number(item?.match?.score||0)));
  return Math.round(score);
}
function isCertainOCR97(item){
  return !!(item?.match?.child && confidenceForOCR97(item)>=OCR_CERTAIN_THRESHOLD && Number(item.amount)>0 && item.date);
}
function unresolvedCertainIndices97(){
  const items=window.__ocrItems||[];
  return items.map((t,i)=>({t,i})).filter(({t,i})=>isCertainOCR97(t) && !document.querySelector(`#ocrLine${i}`)?.classList.contains("ocrAccepted"));
}
function updateBulkButton97(){
  const btn=document.getElementById("ocrBulkCertain97"); if(!btn)return;
  const count=unresolvedCertainIndices97().length;
  btn.disabled=count===0;
  btn.textContent=count?`✓ Zapisz ${count} pewnych wpłat`:`✓ Brak pewnych wpłat do zapisania`;
}
function enhanceOCRReview97(){
  const items=window.__ocrItems||[];
  const review=document.getElementById("ocrReview");
  if(!review||review.dataset.enhanced97==="1")return;
  review.dataset.enhanced97="1";

  items.forEach((t,idx)=>{
    const hint=document.getElementById(`ocrHint${idx}`);
    if(!hint)return;
    const score=confidenceForOCR97(t);
    if(t.match?.child){
      const badge=document.createElement("div");
      badge.className=`ocrConfidence97 ${score>=OCR_CERTAIN_THRESHOLD?"certain":"review"}`;
      badge.textContent=`Pewność dopasowania: ${score}%${score>=OCR_CERTAIN_THRESHOLD?" • pewne":" • sprawdź ręcznie"}`;
      hint.insertAdjacentElement("afterend",badge);
    }
  });

  const certain=unresolvedCertainIndices97().length;
  const bar=document.createElement("div");
  bar.className="ocrBulkBar97";
  bar.innerHTML=`<div><b>Automatyczna weryfikacja</b><span>${certain} z ${items.length} pozycji ma pewność co najmniej ${OCR_CERTAIN_THRESHOLD}% i komplet danych.</span></div>
    <button id="ocrBulkCertain97" class="primary" onclick="saveCertainOCR97()">✓ Zapisz ${certain} pewnych wpłat</button>`;
  review.insertAdjacentElement("beforebegin",bar);
  updateBulkButton97();
}

window.saveCertainOCR97=async function(){
  const rows=unresolvedCertainIndices97();
  if(!rows.length){updateBulkButton97();return}
  let saved=0, left=0;
  for(const {t,i} of rows){
    const childSelect=document.querySelector(`#ocrChild${i}`);
    if(childSelect && t.match?.child) childSelect.value=String(t.match.child.id);
    let result={ok:false};
    try{result=persistOCRItem(t,i)}catch(e){result={ok:false,reason:"error"}}
    if(result?.ok){
      saved++;
      const label=result.state?.kind==="partial"?"Wpłata częściowa":"Wpłata zaakceptowana";
      if(typeof markOCRDone==="function")markOCRDone(i,label);
    }else{
      left++;
      const hint=document.getElementById(`ocrHint${i}`);
      if(hint){hint.className="ocrWarn";hint.textContent="Wymaga ręcznej weryfikacji — automatyczny zapis został pominięty.";}
    }
  }
  if(saved && typeof save==="function")save();
  updateBulkButton97();
  if(typeof showToast==="function")showToast(saved?`Zapisano automatycznie ${saved} pewnych wpłat${left?` • ${left} do sprawdzenia`:""}`:"Nie zapisano żadnej wpłaty");
};

/* Owijamy istniejący ekran OCR zamiast przepisywać parser. */
const originalShowOCRReview97=window.showOCRReview;
if(typeof originalShowOCRReview97==="function"){
  window.showOCRReview=function(items,fileName){
    originalShowOCRReview97(items,fileName);
    setTimeout(enhanceOCRReview97,0);
  };
}

const style=document.createElement("style");
style.textContent=`
.ocrBulkBar97{display:flex;gap:12px;align-items:center;justify-content:space-between;margin:14px 0;padding:14px;border:1px solid #bfe4da;border-radius:18px;background:#f0faf7}
.ocrBulkBar97 b,.ocrBulkBar97 span{display:block}.ocrBulkBar97 b{color:#126f5d;font-size:16px}.ocrBulkBar97 span{margin-top:4px;color:#64727d;font-size:13px;font-weight:700}.ocrBulkBar97 button{flex:0 0 auto}
.ocrConfidence97{margin:7px 0 10px;padding:7px 10px;border-radius:12px;font-size:13px;font-weight:900}.ocrConfidence97.certain{background:#e7f8f1;color:#11745d}.ocrConfidence97.review{background:#fff6df;color:#9a6800}
@media(max-width:620px){.ocrBulkBar97{align-items:stretch;flex-direction:column}.ocrBulkBar97 button{width:100%}}
`;
document.head.appendChild(style);

window.RWModules=window.RWModules||{};
window.RWModules.payments={version:"9.7",ocrCertainThreshold:OCR_CERTAIN_THRESHOLD};
})();