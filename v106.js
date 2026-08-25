/* Rozliczenia Warsztatów v10.6
   "Usuń dziecko" widoczne tylko w zakładce Dane profilu dziecka.
*/
(function(){
"use strict";

const PROFILE_TABS106=["Dane","Zajęcia","Płatności","Frekwencja","Historia","Uwagi"];

function normalize106(s){
  return String(s||"").trim().toLowerCase();
}

function setDeleteVisibility106(activeLabel){
  const btn=document.getElementById("deleteChild105");
  if(!btn)return;
  btn.style.display=normalize106(activeLabel)==="dane" ? "" : "none";
}

function bindProfileTabs106(){
  const box=document.querySelector("#modal .modalbox");
  if(!box)return;

  const buttons=[...box.querySelectorAll("button")].filter(b=>
    PROFILE_TABS106.includes((b.textContent||"").trim())
  );

  if(!buttons.length)return;

  buttons.forEach(btn=>{
    if(btn.dataset.deleteVisibility106==="1")return;
    btn.dataset.deleteVisibility106="1";
    btn.addEventListener("click",()=>{
      const label=(btn.textContent||"").trim();
      setTimeout(()=>setDeleteVisibility106(label),0);
      setTimeout(()=>setDeleteVisibility106(label),60);
    });
  });

  const active=buttons.find(b=>
    b.classList.contains("active") ||
    b.classList.contains("primary")
  );

  setDeleteVisibility106(active ? (active.textContent||"").trim() : "Dane");
}

const observer106=new MutationObserver(()=>{
  bindProfileTabs106();
});

observer106.observe(document.body,{
  childList:true,
  subtree:true,
  attributes:true,
  attributeFilter:["class"]
});

setTimeout(bindProfileTabs106,0);

window.RWModules=window.RWModules||{};
window.RWModules.deleteChildVisibility={version:"10.6",dataOnly:true};
})();