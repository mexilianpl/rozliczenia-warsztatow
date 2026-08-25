/* Rozliczenia Warsztatów v9.2
   Poprawka polskich znaków + dokładne uruchomienie Szybkiej wpłaty z 8.9
*/
(function(){
"use strict";

const QUICKPAY89_KEY="rw89_quickpay";

function norm92(s){
  return String(s||"")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/ł/g,"l")
    .replace(/Ł/g,"L")
    .toLowerCase()
    .replace(/\s+/g," ")
    .trim();
}

function esc92(s){
  return String(s??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function activeChildren92(){
  return (data.children||[])
    .filter(c=>typeof childActiveNow==="function"?childActiveNow(c):true)
    .slice()
    .sort((a,b)=>`${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`,"pl"));
}

window.quickPaySearch92=function(value){
  const box=document.getElementById("quickPayResults92");
  if(!box)return;

  const q=norm92(value);
  if(!q){box.innerHTML="";return}

  const tokens=q.split(" ").filter(Boolean);
  const found=activeChildren92().filter(c=>{
    const hay=norm92([
      c.last,c.first,
      `${c.last} ${c.first}`,
      `${c.first} ${c.last}`,
      c.school||"",c.class||""
    ].join(" "));
    return tokens.every(t=>hay.includes(t));
  }).slice(0,25);

  if(!found.length){
    box.innerHTML='<div class="quickPayEmpty90">Brak pasującego dziecka.</div>';
    return;
  }

  box.innerHTML=found.map(c=>`
    <button type="button" class="quickPayChild90" onclick="openQuickPayForChild92(${c.id})">
      <span>
        <b>${esc92(c.last)} ${esc92(c.first)}</b>
        <small>${esc92(c.school||"")}${c.class?` • ${esc92(c.class)}`:""}</small>
      </span>
      <span class="arrow90">›</span>
    </button>
  `).join("");
};

window.openQuickPayForChild92=function(childId){
  if(typeof openQuickPayment89!=="function"){
    if(typeof showToast==="function")showToast("Brak funkcji Szybka wpłata z 8.9");
    return;
  }

  let prefs={};
  try{prefs=JSON.parse(localStorage.getItem(QUICKPAY89_KEY)||"{}")}catch(e){}

  prefs.childId=Number(childId);
  if(!prefs.month && typeof currentMonthName==="function")prefs.month=currentMonthName();

  localStorage.setItem(QUICKPAY89_KEY,JSON.stringify(prefs));

  // Uruchamiamy dokładnie formularz z 8.9 (screen 3)
  openQuickPayment89();
};

function replacePaymentCard92(){
  if(!app)return;

  const pageTitle=[...app.querySelectorAll(".title")]
    .find(x=>norm92(x.textContent)==="wplaty");
  if(!pageTitle)return;

  const card=[...app.querySelectorAll(".card")].find(c=>{
    const h=c.querySelector("h2");
    return h && norm92(h.textContent)==="dodaj wplate";
  });
  if(!card)return;

  if(card.dataset.quickPay92==="1")return;
  card.dataset.quickPay92="1";

  card.innerHTML=`
    <h2>Dodaj wpłatę</h2>
    <div class="quickPaySearch90">
      <div class="search">
        <input id="quickPayInput92"
               type="search"
               autocomplete="off"
               placeholder="Szukaj dziecka..."
               oninput="quickPaySearch92(this.value)">
      </div>
      <div id="quickPayResults92" class="quickPayResults90"></div>
      <div class="quickPayHelp90">
        Wpisz pierwsze litery nazwiska lub imienia i wybierz dziecko.
      </div>
    </div>
  `;
}

function removeStartQuickPay92(){
  document.getElementById("quickPaymentStart89")?.remove();
}

const observer=new MutationObserver(()=>{
  removeStartQuickPay92();
  replacePaymentCard92();
});
observer.observe(app,{childList:true,subtree:true});

setTimeout(()=>{
  removeStartQuickPay92();
  replacePaymentCard92();
},0);

})();