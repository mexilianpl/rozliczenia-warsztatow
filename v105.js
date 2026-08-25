/* =========================================================
   Rozliczenia Warsztatów v10.5
   - status dziecka oddzielony od statusu płatności
   - 🟢 Aktywne / ⏸ Wstrzymane / 🔴 Zrezygnował
   - usuwanie dziecka z profilu
   ========================================================= */
(function(){
"use strict";

function normalized105(s){
  return String(s||"")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase();
}

function lifecycleFromCard105(card, child){
  const text=normalized105(card?.textContent||"");

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

function replaceStatusText105(card, state){
  if(!card)return;

  /* Status w wierszu danych dziecka. */
  const nodes=[...card.querySelectorAll("*")];
  nodes.forEach(el=>{
    if(el.children.length)return;
    const t=(el.textContent||"").trim();

    if(t==="Aktywne" || t==="🟢 Aktywne"){
      el.textContent="🟢 Aktywne";
    }else if(/^Wstrzymane$/i.test(t)){
      el.textContent="⏸ Wstrzymane";
    }else if(/^Zrezygnował$/i.test(t) || /^Zrezygnowal$/i.test(t)){
      el.textContent="🔴 Zrezygnował";
    }
  });

  /* W nieaktywnym profilu "BEZPŁATNE" nie jest statusem płatności,
     tylko skutkiem należności 0 zł. Zastępujemy to statusem dziecka. */
  if(state.kind!=="active"){
    const paymentBadge=card.querySelector(".paymentBadgeText");
    if(paymentBadge){
      paymentBadge.classList.remove("free","paid","partial","unpaid","overpaid");
      paymentBadge.classList.add(state.kind==="resigned"?"childResigned105":"childPaused105");
      paymentBadge.textContent=state.label;
    }else{
      /* Zabezpieczenie dla kart przerobionych przez późniejsze wersje. */
      const leaf=[...card.querySelectorAll("*")].find(el=>
        el.children.length===0 && (el.textContent||"").trim()==="BEZPŁATNE"
      );
      if(leaf){
        leaf.textContent=state.label;
        leaf.classList.add(state.kind==="resigned"?"childResigned105":"childPaused105");
      }
    }
  }
}

function patchChildrenCards105(){
  if(typeof page!=="undefined" && page!=="children")return;
  const list=document.getElementById("childrenList");
  if(!list)return;

  let children=[];
  try{
    children=typeof getFilteredChildren==="function" ? getFilteredChildren() : [];
  }catch(e){}

  const cards=[...list.children].filter(el=>el.classList?.contains("card"));
  cards.forEach((card,index)=>{
    const child=children[index];
    if(!child)return;
    const state=lifecycleFromCard105(card,child);
    replaceStatusText105(card,state);
  });
}

/* Globalnie poprawiamy samo "Aktywne", również w profilu dziecka. */
function patchGlobalActive105(){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const found=[];
  while(walker.nextNode()){
    const node=walker.currentNode;
    const parent=node.parentElement;
    if(!parent || parent.closest("script,style,input,textarea,select,option"))continue;
    const raw=node.nodeValue||"";
    if(raw.trim()==="Aktywne")found.push(node);
  }
  found.forEach(node=>{
    node.nodeValue=(node.nodeValue||"").replace("Aktywne","🟢 Aktywne");
  });
}

function injectDeleteButton105(childId){
  if(!childId)return;
  const box=document.querySelector("#modal .modalbox");
  if(!box || box.querySelector("#deleteChild105"))return;

  const actions=[...box.querySelectorAll(".actions")].pop();
  if(!actions)return;

  const btn=document.createElement("button");
  btn.id="deleteChild105";
  btn.type="button";
  btn.className="danger deleteChild105";
  btn.textContent="Usuń dziecko";
  btn.onclick=()=>deleteChild105(Number(childId));

  actions.insertAdjacentElement("beforebegin",btn);
}

window.deleteChild105=async function(childId){
  const child=(data.children||[]).find(c=>Number(c.id)===Number(childId));
  if(!child)return;

  const name=`${child.last||""} ${child.first||""}`.trim();

  let ok=false;
  if(typeof confirmModal==="function"){
    ok=await confirmModal({
      title:"Usunąć dziecko?",
      message:`${name}. Zostanie usunięty profil dziecka oraz jego wpłaty, obecności i zaplanowane odrabiania. Tej operacji nie można cofnąć.`,
      confirmText:"Usuń dziecko",
      cancelText:"Anuluj",
      danger:true
    });
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

  try{
    if(typeof childrenViewState==="object"){
      childrenViewState.focusChildId=0;
    }
  }catch(e){}

  page="children";
  render();

  if(typeof showToast==="function")showToast("Dziecko usunięte");
};

/* Profil jest dynamiczny i był już rozszerzany w poprzednich wersjach,
   dlatego opakowujemy aktualną końcową funkcję editChild. */
const previousEditChild105=window.editChild;
if(typeof previousEditChild105==="function"){
  window.editChild=function(id){
    previousEditChild105(id);
    if(id){
      setTimeout(()=>injectDeleteButton105(id),0);
      setTimeout(()=>injectDeleteButton105(id),80);
    }
  };
}

const observer105=new MutationObserver(()=>{
  patchGlobalActive105();
  patchChildrenCards105();
});

observer105.observe(document.body,{childList:true,subtree:true,characterData:true});

setTimeout(()=>{
  patchGlobalActive105();
  patchChildrenCards105();
},0);

const style=document.createElement("style");
style.textContent=`
.childPaused105{
  color:#9a6800!important;
  font-weight:900;
}
.childResigned105{
  color:#c63b4b!important;
  font-weight:900;
}
.deleteChild105{
  width:100%;
  margin:18px 0 8px;
}
`;
document.head.appendChild(style);

window.RWModules=window.RWModules||{};
window.RWModules.childLifecycle={version:"10.5",deleteChild:true};

})();