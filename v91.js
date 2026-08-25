/* =========================================================
   Rozliczenia Warsztatów — v9.1
   POPRAWKA: w zakładce Wpłaty wybór dziecka uruchamia
   DOKŁADNIE mechanizm "Szybka wpłata" z v8.9.
   ========================================================= */

(function(){
  "use strict";

  const QUICKPAY89_KEY = "rw89_quickpay";

  function norm91(s){
    return String(s||"")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .toLowerCase()
      .replace(/\s+/g," ")
      .trim();
  }

  function esc91(s){
    return String(s??"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function activeChildren91(){
    return (data.children||[])
      .filter(c=>typeof childActiveNow==="function" ? childActiveNow(c) : true)
      .slice()
      .sort((a,b)=>`${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`,"pl"));
  }

  window.quickPaySearch91 = function(value){
    const box=document.getElementById("quickPayResults91");
    if(!box)return;

    const q=norm91(value);
    if(!q){
      box.innerHTML="";
      return;
    }

    const tokens=q.split(" ").filter(Boolean);

    const found=activeChildren91().filter(c=>{
      const hay=norm91([
        c.last,
        c.first,
        `${c.last} ${c.first}`,
        `${c.first} ${c.last}`,
        c.school||"",
        c.class||""
      ].join(" "));
      return tokens.every(t=>hay.includes(t));
    }).slice(0,25);

    if(!found.length){
      box.innerHTML='<div class="quickPayEmpty90">Brak pasującego dziecka.</div>';
      return;
    }

    box.innerHTML=found.map(c=>`
      <button type="button" class="quickPayChild90" onclick="openQuickPayForChild91(${c.id})">
        <span>
          <b>${esc91(c.last)} ${esc91(c.first)}</b>
          <small>${esc91(c.school||"")}${c.class?` • ${esc91(c.class)}`:""}</small>
        </span>
        <span class="arrow90">›</span>
      </button>
    `).join("");
  };

  window.openQuickPayForChild91 = function(childId){
    if(typeof openQuickPayment89!=="function"){
      if(typeof showToast==="function")showToast("Nie udało się uruchomić Szybkiej wpłaty z wersji 8.9");
      return;
    }

    let prefs={};
    try{
      prefs=JSON.parse(localStorage.getItem(QUICKPAY89_KEY)||"{}");
    }catch(e){}

    prefs.childId=Number(childId);

    if(!prefs.month && typeof currentMonthName==="function"){
      prefs.month=currentMonthName();
    }

    localStorage.setItem(QUICKPAY89_KEY,JSON.stringify(prefs));

    // DOKŁADNIE ekran i logika ze screena 3 / wersji 8.9
    openQuickPayment89();
  };

  function replacePaymentCard91(){
    // Pracujemy na już wyrenderowanym ekranie, dzięki temu omijamy
    // problem starej funkcji payments() i zawsze podmieniamy faktyczną kartę.
    if(!app)return;

    const title=[...app.querySelectorAll(".title")]
      .find(x=>norm91(x.textContent)==="wplaty");

    if(!title)return;

    const cards=[...app.querySelectorAll(".card")];

    const card=cards.find(c=>{
      const h=c.querySelector("h2");
      return h && norm91(h.textContent)==="dodaj wplate";
    });

    if(!card)return;

    if(card.dataset.quickPay91==="1")return;
    card.dataset.quickPay91="1";

    card.innerHTML=`
      <h2>Dodaj wpłatę</h2>

      <div class="quickPaySearch90">
        <div class="search">
          <input
            id="quickPayInput91"
            type="search"
            autocomplete="off"
            placeholder="Szukaj dziecka..."
            oninput="quickPaySearch91(this.value)">
        </div>

        <div id="quickPayResults91" class="quickPayResults90"></div>

        <div class="quickPayHelp90">
          Zacznij wpisywać nazwisko lub imię. Po wybraniu dziecka otworzy się dokładnie formularz „⚡ Szybka wpłata” z wersji 8.9.
        </div>
      </div>
    `;
  }

  function removeStartButton91(){
    document.getElementById("quickPaymentStart89")?.remove();
  }

  // Obserwujemy cały obszar aplikacji. Za każdym razem gdy app.js
  // wyrenderuje Wpłaty, natychmiast podmieniamy pierwszą kartę.
  const observer=new MutationObserver(()=>{
    removeStartButton91();
    replacePaymentCard91();
  });

  observer.observe(app,{childList:true,subtree:true});

  // Pierwsze uruchomienie
  setTimeout(()=>{
    removeStartButton91();
    replacePaymentCard91();
  },0);

})();
