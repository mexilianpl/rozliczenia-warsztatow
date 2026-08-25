/* =========================================================
   children.js — Rozliczenia Warsztatów v10.7

   Scalono:
   - v100.js  : szybka wpłata z profilu dziecka
   - v103.js  : 🟢 Aktywne
   - v105.js  : statusy + usuwanie dziecka
   - v106.js  : Usuń dziecko tylko w zakładce Dane

   Bez globalnego MutationObserver skanującego cały DOM.
   ========================================================= */
(function(){
"use strict";

function norm107(s){
  return String(s||"")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .trim();
}

function childLifecycle107(card, child){
  const text=norm107(card?.textContent||"");

  if(text.includes("zrezygnowal")){
    return {kind:"resigned",label:"🔴 Zrezygnował"};
  }
  if(text.includes("wstrzymane") || text.includes("wstrzymany")){
    return {kind:"paused",label:"⏸ Wstrzymane"};
  }

  try{
    if(typeof childActiveNow==="function" && childActiveNow(child)){
      return {kind:"active",label:"🟢 Aktywne"};
    }
  }catch(e){}

  return {kind:"active",label:"🟢 Aktywne"};
}

function replaceLeafText107(root, fromValues, to){
  if(!root)return;
  [...root.querySelectorAll("*")].forEach(el=>{
    if(el.children.length)return;
    const t=(el.textContent||"").trim();
    if(fromValues.includes(t))el.textContent=to;
  });
}

function patchChildCard107(card, child){
  if(!card || !child)return;
  const state=childLifecycle107(card,child);

  replaceLeafText107(card,["Aktywne","🟢 Aktywne"],"🟢 Aktywne");
  replaceLeafText107(card,["Wstrzymane"],"⏸ Wstrzymane");
  replaceLeafText107(card,["Zrezygnował","Zrezygnowal"],"🔴 Zrezygnował");

  if(state.kind!=="active"){
    const badge=card.querySelector(".paymentBadgeText");
    if(badge){
      badge.classList.remove("free","paid","partial","unpaid","overpaid");
      badge.classList.add(state.kind==="resigned"?"childResigned107":"childPaused107");
      badge.textContent=state.label;
    }else{
      const free=[...card.querySelectorAll("*")].find(el=>
        el.children.length===0 && (el.textContent||"").trim()==="BEZPŁATNE"
      );
      if(free){
        free.textContent=state.label;
        free.classList.add(state.kind==="resigned"?"childResigned107":"childPaused107");
      }
    }
  }
}

function patchChildrenList107(){
  if(typeof page!=="undefined" && page!=="children")return;
  const list=document.getElementById("childrenList");
  if(!list)return;

  let visible=[];
  try{
    visible=typeof getFilteredChildren==="function"
      ? getFilteredChildren()
      : (data.children||[]);
  }catch(e){
    visible=data.children||[];
  }

  const cards=[...list.children].filter(el=>el.classList?.contains("card"));
  cards.forEach((card,i)=>patchChildCard107(card,visible[i]));
}

function patchProfileStatus107(box){
  if(!box)return;
  replaceLeafText107(box,["Aktywne","🟢 Aktywne"],"🟢 Aktywne");
  replaceLeafText107(box,["Wstrzymane"],"⏸ Wstrzymane");
  replaceLeafText107(box,["Zrezygnował","Zrezygnowal"],"🔴 Zrezygnował");
}

/* ---------- SZYBKA WPŁATA Z PROFILU ---------- */
function patchProfileQuickPay107(childId, box){
  if(!box)return;
  const section=box.querySelector('.childProfileSection[data-section="payments"]');
  if(!section)return;

  const btn=[...section.querySelectorAll("button")]
    .find(b=>(b.textContent||"").includes("Dodaj wpłatę"));

  if(!btn || btn.dataset.quickPay107==="1")return;
  btn.dataset.quickPay107="1";

  btn.onclick=function(e){
    e.preventDefault();
    e.stopPropagation();

    if(typeof closeModal==="function")closeModal();

    if(typeof openQuickPayForChild98==="function"){
      openQuickPayForChild98(Number(childId));
      return;
    }

    if(typeof openQuickPayment89==="function"){
      let prefs={};
      try{prefs=JSON.parse(localStorage.getItem("rw89_quickpay")||"{}")}catch(err){}
      prefs.childId=Number(childId);
      if(!prefs.month && typeof currentMonthName==="function"){
        prefs.month=currentMonthName();
      }
      localStorage.setItem("rw89_quickpay",JSON.stringify(prefs));
      openQuickPayment89();
    }
  };
}

/* ---------- USUWANIE DZIECKA — TYLKO DANE ---------- */
function injectDeleteChild107(childId, box){
  if(!box || box.querySelector("#deleteChild107"))return;

  const dataSection=box.querySelector('.childProfileSection[data-section="data"]');
  if(!dataSection)return;

  const actions=[...dataSection.querySelectorAll(".actions")].pop();

  const btn=document.createElement("button");
  btn.id="deleteChild107";
  btn.type="button";
  btn.className="danger deleteChild107";
  btn.textContent="Usuń dziecko";
  btn.onclick=()=>deleteChild107(Number(childId));

  if(actions)actions.insertAdjacentElement("beforebegin",btn);
  else dataSection.appendChild(btn);
}

window.deleteChild107=async function(childId){
  const child=(data.children||[]).find(c=>Number(c.id)===Number(childId));
  if(!child)return;

  const name=`${child.last||""} ${child.first||""}`.trim();
  let ok=false;

  if(typeof confirmModal==="function"){
    try{
      ok=await confirmModal({
        title:"Usunąć dziecko?",
        message:`${name}. Zostanie usunięty profil dziecka oraz jego wpłaty, obecności i zaplanowane odrabiania. Tej operacji nie można cofnąć.`,
        confirmText:"Usuń dziecko",
        cancelText:"Anuluj",
        danger:true
      });
    }catch(e){
      ok=window.confirm(`Usunąć dziecko ${name}? Tej operacji nie można cofnąć.`);
    }
  }else{
    ok=window.confirm(`Usunąć dziecko ${name}? Tej operacji nie można cofnąć.`);
  }

  if(!ok)return;

  data.children=(data.children||[]).filter(c=>Number(c.id)!==Number(childId));
  data.payments=(data.payments||[]).filter(p=>Number(p.childId)!==Number(childId));

  if(Array.isArray(data.makeups)){
    data.makeups=data.makeups.filter(m=>Number(m.childId)!==Number(childId));
  }
  if(Array.isArray(data.history)){
    data.history=data.history.filter(h=>Number(h.childId)!==Number(childId));
  }

  if(data.attendance && typeof data.attendance==="object"){
    Object.keys(data.attendance).forEach(key=>{
      const rec=data.attendance[key];
      if(!rec || typeof rec!=="object")return;

      if(Number(rec.childId)===Number(childId)){
        delete data.attendance[key];
        return;
      }
      delete rec[childId];
      delete rec[String(childId)];
    });
  }

  save();
  closeModal();
  page="children";
  render();

  if(typeof showToast==="function")showToast("Dziecko usunięte");
};

/* ---------- PODPINANIE DO ISTNIEJĄCYCH EKRANÓW ---------- */

/* Dzieci: patch bez obserwatora całego dokumentu. */
const originalChildren107=window.children;
if(typeof originalChildren107==="function"){
  window.children=function(){
    originalChildren107();
    setTimeout(patchChildrenList107,0);
  };
}

/* Profil: v94 jest ładowany przed children.js, więc zachowujemy odrabianie. */
const originalEditChild107=window.editChild;
if(typeof originalEditChild107==="function"){
  window.editChild=function(id){
    originalEditChild107(id);
    if(!id)return;

    const patch=()=>{
      const box=document.querySelector("#modal .modalbox");
      if(!box)return;
      patchProfileStatus107(box);
      patchProfileQuickPay107(id,box);
      injectDeleteChild107(id,box);
    };

    setTimeout(patch,0);
    setTimeout(patch,60);
  };
}

/* Przełączanie zakładek profilu może przebudować fragment DOM.
   Delegowany click jest lekki i działa tylko po kliknięciu zakładki profilu. */
document.addEventListener("click",e=>{
  const btn=e.target.closest?.("button");
  if(!btn)return;
  const label=(btn.textContent||"").trim();
  if(!["Dane","Zajęcia","Płatności","Frekwencja","Historia","Uwagi"].includes(label))return;

  setTimeout(()=>{
    const box=document.querySelector("#modal .modalbox");
    if(!box)return;

    const deleteBtn=box.querySelector("#deleteChild107");
    if(deleteBtn){
      /* Przycisk fizycznie znajduje się w sekcji Dane,
         więc nie występuje w innych zakładkach. */
      deleteBtn.style.display=label==="Dane" ? "" : "none";
    }

    if(label==="Płatności"){
      const selected=box.querySelector('.childProfileSection[data-section="payments"] button[onclick*="addPayment("]');
      const match=selected?.getAttribute("onclick")?.match(/addPayment\((\d+)/);
      if(match)patchProfileQuickPay107(Number(match[1]),box);
    }
  },0);
},true);

const style=document.createElement("style");
style.textContent=`
.childPaused107{color:#9a6800!important;font-weight:900}
.childResigned107{color:#c63b4b!important;font-weight:900}
.deleteChild107{width:100%;margin:18px 0 8px}
`;
document.head.appendChild(style);

window.RWModules=window.RWModules||{};
window.RWModules.children={version:"10.7"};

})();