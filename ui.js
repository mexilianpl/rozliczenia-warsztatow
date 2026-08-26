/* =========================================================
   ui.js — Rozliczenia Warsztatów v10.8
   - X w prawym górnym rogu wszystkich okien modalnych
   - Android/systemowy Wstecz:
       1. zamyka otwarty modal
       2. z dowolnej zakładki wraca do Start
       3. na Start nie zamyka aplikacji
   ========================================================= */
(function(){
"use strict";

/* ---------- X W KAŻDYM MODALU ---------- */

function addCloseX96(root=document){
  const boxes=root.querySelectorAll ? root.querySelectorAll(".modal .modalbox") : [];
  boxes.forEach(box=>{
    if(box.querySelector(":scope > .modalCloseX96"))return;

    const btn=document.createElement("button");
    btn.type="button";
    btn.className="modalCloseX96";
    btn.setAttribute("aria-label","Zamknij okno");
    btn.innerHTML="×";
    btn.addEventListener("click",e=>{
      e.preventDefault();
      e.stopPropagation();
      if(typeof closeModal==="function")closeModal();
      else box.closest(".modal")?.remove();
    });

    box.prepend(btn);
  });
}

/* Obserwator obsługuje też modale tworzone przez wcześniejsze wersje. */
const modalObserver96=new MutationObserver(mutations=>{
  for(const m of mutations){
    if(m.addedNodes.length){
      addCloseX96(document);
      break;
    }
  }
});
modalObserver96.observe(document.body,{childList:true,subtree:true});
addCloseX96(document);

/* ---------- SYSTEMOWY / ANDROIDOWY WSTECZ ---------- */

const BACK_GUARD_KEY96="rw-back-guard-ui";

function installBackGuard96(){
  /* Dodajemy wirtualny wpis historii, żeby Android Back nie zamknął PWA. */
  try{
    const st=history.state||{};
    if(!st[BACK_GUARD_KEY96]){
      history.pushState({...st,[BACK_GUARD_KEY96]:true},"",location.href);
    }
  }catch(e){}
}

function restoreBackGuard96(){
  /* Po każdym cofnięciu tworzymy guard ponownie. */
  setTimeout(()=>{
    try{
      history.pushState({...(history.state||{}),[BACK_GUARD_KEY96]:true},"",location.href);
    }catch(e){}
  },0);
}

window.addEventListener("popstate",function(){
  const modalEl=document.querySelector(".modal");

  if(modalEl){
    if(typeof closeModal==="function")closeModal();
    else modalEl.remove();
    restoreBackGuard96();
    return;
  }

  if(typeof page!=="undefined" && page!=="start"){
    page="start";
    if(typeof render==="function")render();
    restoreBackGuard96();
    return;
  }

  /* Jesteśmy już na Start — pozostajemy w aplikacji. */
  if(typeof page!=="undefined" && page==="start"){
    if(typeof render==="function")render();
    restoreBackGuard96();
  }
});

installBackGuard96();

/* ---------- STYLE ---------- */

const style=document.createElement("style");
style.textContent=`
.modalbox{
  position:relative;
}
.modalCloseX96{
  position:sticky;
  top:0;
  z-index:50;
  float:right;
  width:46px;
  height:46px;
  margin:-8px -8px 4px 10px;
  border:0;
  border-radius:50%;
  background:#f2f5f7;
  color:#17324b;
  font-size:34px;
  line-height:42px;
  font-weight:500;
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 1px 4px rgba(0,0,0,.10);
}
.modalCloseX96:active{
  transform:scale(.96);
}
@media(min-width:760px){
  .modalCloseX96{
    width:40px;
    height:40px;
    font-size:30px;
    line-height:36px;
  }
}
`;
document.head.appendChild(style);

})();