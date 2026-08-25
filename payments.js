/* payments.js — Rozliczenia Warsztatów v9.8 */
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

const payObserver=new MutationObserver(()=>{
  removeStartQuickPay98();
  replacePaymentCard98();
  enhanceOCRReview98();
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
@media(max-width:620px){.ocrBulkBar98{align-items:stretch;flex-direction:column}.ocrBulkBar98 button{width:100%}}
`;
document.head.appendChild(style);

setTimeout(()=>{
  removeStartQuickPay98();
  replacePaymentCard98();
  enhanceOCRReview98();
},0);

window.RWModules=window.RWModules||{};
window.RWModules.payments={version:"9.8",ocrCertainThreshold:OCR_CERTAIN_THRESHOLD};
})();