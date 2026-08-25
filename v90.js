/* =========================================================
   Rozliczenia Warsztatów — v9.0
   PRZENIESIENIE istniejącej "Szybkiej wpłaty" z v8.9.
   Nie zmieniamy mechanizmu wpłaty z v8.9.
   ========================================================= */

(function(){
  "use strict";

  const QUICKPAY89_KEY="rw89_quickpay";

  function norm90(s){
    return String(s||"")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .toLowerCase()
      .replace(/\s+/g," ")
      .trim();
  }

  function esc90(s){
    return String(s??"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function activeChildren90(){
    return (data.children||[])
      .filter(c=>typeof childActiveNow==="function" ? childActiveNow(c) : true)
      .slice()
      .sort((a,b)=>`${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`,"pl"));
  }

  window.quickPaySearch90=function(value){
    const box=document.getElementById("quickPayResults90");
    if(!box)return;

    const q=norm90(value);

    if(!q){
      box.innerHTML="";
      return;
    }

    const tokens=q.split(" ").filter(Boolean);

    const found=activeChildren90().filter(c=>{
      const hay=norm90([
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
      <button type="button" class="quickPayChild90" onclick="openQuickPayForChild90(${c.id})">
        <span>
          <b>${esc90(c.last)} ${esc90(c.first)}</b>
          <small>${esc90(c.school||"")}${c.class?` • ${esc90(c.class)}`:""}</small>
        </span>
        <span class="arrow90">›</span>
      </button>
    `).join("");
  };

  window.openQuickPayForChild90=function(childId){
    if(typeof openQuickPayment89!=="function"){
      if(typeof showToast==="function")showToast("Nie udało się uruchomić szybkiej wpłaty");
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

    /* TO JEST DOKŁADNIE FORMULARZ SZYBKIEJ WPŁATY Z v8.9 */
    openQuickPayment89();
  };

  function replacePaymentCard90(){
    if(page!=="payments" || !app)return;

    const cards=[...app.querySelectorAll(".card")];

    const card=cards.find(c=>{
      const title=norm90(c.querySelector("h2")?.textContent||"");
      return title==="dodaj wplate";
    });

    if(!card)return;

    card.innerHTML=`
      <h2>Dodaj wpłatę</h2>

      <div class="quickPaySearch90">
        <div class="search">
          <input
            id="quickPayInput90"
            type="search"
            autocomplete="off"
            placeholder="Szukaj dziecka..."
            oninput="quickPaySearch90(this.value)">
        </div>

        <div id="quickPayResults90" class="quickPayResults90"></div>

        <div class="quickPayHelp90">
          Zacznij wpisywać nazwisko lub imię dziecka. Po wybraniu dziecka otworzy się ten sam formularz „Szybka wpłata”, który był w wersji 8.9 na stronie Start.
        </div>
      </div>
    `;
  }

  function removeStartQuickPay90(){
    document.getElementById("quickPaymentStart89")?.remove();
  }

  /*
    v89 już opakowało funkcję start().
    My wywołujemy ją normalnie, dzięki czemu wszystkie pozostałe
    funkcje 8.9 zostają, a następnie usuwamy tylko przycisk wpłaty.
  */
  const start89WithFeatures=window.start;
  if(typeof start89WithFeatures==="function"){
    window.start=function(){
      start89WithFeatures();
      removeStartQuickPay90();
    };
  }

  /*
    Oryginalna zakładka Wpłaty zostaje zachowana:
    OCR, lista wpłat itd. Zmieniamy tylko pierwszą kartę "Dodaj wpłatę".
  */
  const paymentsOriginal=window.payments;
  if(typeof paymentsOriginal==="function"){
    window.payments=function(){
      paymentsOriginal();
      replacePaymentCard90();
    };
  }

  setTimeout(()=>{
    removeStartQuickPay90();
    if(page==="payments")replacePaymentCard90();
  },0);

})();
