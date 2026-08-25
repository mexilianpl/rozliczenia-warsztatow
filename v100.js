/* =========================================================
   Rozliczenia Warsztatów v10.0
   Profil dziecka -> Płatności -> + Dodaj wpłatę
   używa tego samego mechanizmu Szybkiej wpłaty co zakładka Wpłaty.
   ========================================================= */
(function(){
"use strict";

function patchProfileQuickPay100(childId){
  const modalBox=document.querySelector("#modal .modalbox");
  if(!modalBox)return;

  const paymentSection=modalBox.querySelector('.childProfileSection[data-section="payments"]');
  if(!paymentSection)return;

  const btn=[...paymentSection.querySelectorAll("button")]
    .find(b=>(b.textContent||"").trim().includes("Dodaj wpłatę"));

  if(!btn || btn.dataset.quickPay100==="1")return;

  btn.dataset.quickPay100="1";
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
      try{
        prefs=JSON.parse(localStorage.getItem("rw89_quickpay")||"{}");
      }catch(err){}

      prefs.childId=Number(childId);

      if(!prefs.month && typeof currentMonthName==="function"){
        prefs.month=currentMonthName();
      }

      localStorage.setItem("rw89_quickpay",JSON.stringify(prefs));
      openQuickPayment89();
      return;
    }

    if(typeof showToast==="function"){
      showToast("Nie udało się uruchomić szybkiej wpłaty");
    }
  };
}

/* editChild tworzy profil dynamicznie, więc po jego otwarciu
   podmieniamy wyłącznie przycisk w sekcji Płatności. */
const originalEditChild100=window.editChild;

if(typeof originalEditChild100==="function"){
  window.editChild=function(id){
    originalEditChild100(id);

    if(!id)return;

    setTimeout(()=>patchProfileQuickPay100(id),0);
    setTimeout(()=>patchProfileQuickPay100(id),60);
  };
}

/* Dodatkowe zabezpieczenie dla przełączania zakładek profilu
   bez ponownego wywołania editChild(). */
const observer100=new MutationObserver(()=>{
  const box=document.querySelector("#modal .modalbox");
  if(!box)return;

  const section=box.querySelector('.childProfileSection[data-section="payments"]');
  if(!section)return;

  const childId=
    Number(section.querySelector('button[onclick*="addPayment("]')?.getAttribute("onclick")?.match(/addPayment\((\d+)/)?.[1]||0);

  if(childId)patchProfileQuickPay100(childId);
});

observer100.observe(document.body,{childList:true,subtree:true});

window.RWModules=window.RWModules||{};
window.RWModules.profileQuickPayment={version:"10.0"};

})();