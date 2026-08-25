(function(){
  "use strict";

  function esc90(s){
    return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function norm90(s){
    return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();
  }
  function today90(){
    const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function month90(){
    if(typeof currentMonthName==="function")return currentMonthName();
    return ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"][new Date().getMonth()];
  }
  function active90(){
    return (data.children||[]).filter(c=>typeof childActiveNow==="function"?childActiveNow(c):true).slice().sort((a,b)=>`${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`,"pl"));
  }
  function state90(ch,month){
    try{return paymentState(ch,month)}catch(e){
      const due=typeof childDue==="function"?childDue(ch):0,paid=typeof childPaymentsForMonth==="function"?childPaymentsForMonth(ch,month):0;
      return {due,paid,missing:Math.max(0,due-paid),extra:Math.max(0,paid-due),kind:paid>=due?"paid":"unpaid"};
    }
  }

  window.searchPaymentChildren90=function(value){
    const box=document.getElementById("paymentSearchResults90");if(!box)return;
    const q=norm90(value);if(!q){box.innerHTML="";return}
    const parts=q.split(" ").filter(Boolean);
    const matches=active90().filter(c=>{
      const hay=norm90([c.last,c.first,`${c.last} ${c.first}`,`${c.first} ${c.last}`,c.class,c.school,c.parent,c.phone].join(" "));
      return parts.every(p=>hay.includes(p));
    }).slice(0,20);
    if(!matches.length){box.innerHTML='<div class="paymentSearchEmpty90">Brak pasującego dziecka.</div>';return}
    const m=month90();
    box.innerHTML=matches.map(c=>{
      const ps=state90(c,m);
      return `<button type="button" class="paymentSearchResult90" onclick="openQuickPayment90(${c.id})"><span class="paymentChildMain90"><b>${esc90(c.last)} ${esc90(c.first)}</b><span>${esc90(c.school||"")} ${c.class?`• ${esc90(c.class)}`:""} • ${esc90(m)}</span></span><strong>${money(ps.missing||0)}</strong></button>`;
    }).join("");
  };

  window.openQuickPayment90=function(cid){
    const ch=(data.children||[]).find(c=>Number(c.id)===Number(cid));if(!ch)return;
    let selectedMonth=month90();
    try{const p=JSON.parse(localStorage.getItem("rw89_quickpay")||"{}");if((months||[]).includes(p.month))selectedMonth=p.month}catch(e){}
    modal(`<div class="quickPaymentBox90"><h2>⚡ Dodaj wpłatę</h2><div class="paymentSearchSelected90">${esc90(ch.last)} ${esc90(ch.first)} • ${esc90(ch.school||"")} ${ch.class?`• ${esc90(ch.class)}`:""}</div><label>Miesiąc</label><select id="qpayMonth90" onchange="refreshQuickPayment90()">${(months||[]).map(m=>`<option ${m===selectedMonth?"selected":""}>${m}</option>`).join("")}</select><div id="qpaySummary90"></div><label>Kwota wpłaty</label><input id="qpayAmount90" type="number" min="0" step="0.01" inputmode="decimal"><label>Data</label><input id="qpayDate90" type="date" value="${today90()}"><input id="qpayChild90" type="hidden" value="${ch.id}"><div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="saveQuickPayment90()">Zapisz wpłatę</button></div></div>`);
    refreshQuickPayment90(true);
  };

  window.refreshQuickPayment90=function(force){
    const cid=Number(document.getElementById("qpayChild90")?.value||0),m=document.getElementById("qpayMonth90")?.value||month90(),ch=(data.children||[]).find(c=>Number(c.id)===cid);if(!ch)return;
    const ps=state90(ch,m),box=document.getElementById("qpaySummary90");
    if(box)box.innerHTML=`<div class="quickPaymentSummary"><div><span>Należne</span><b>${money(ps.due||0)}</b></div><div><span>Wpłacono</span><b>${money(ps.paid||0)}</b></div><div class="quickPaymentMissing"><span>Brakuje</span><b>${money(ps.missing||0)}</b></div></div>`;
    const amount=document.getElementById("qpayAmount90");
    if(amount&&(force||!amount.dataset.userChanged))amount.value=Number(ps.missing||0).toFixed(2);
    if(amount&&!amount.dataset.bound90){amount.dataset.bound90="1";amount.addEventListener("input",()=>amount.dataset.userChanged="1")}
    localStorage.setItem("rw89_quickpay",JSON.stringify({childId:cid,month:m}));
  };

  window.saveQuickPayment90=function(){
    const cid=Number(document.getElementById("qpayChild90")?.value||0),m=document.getElementById("qpayMonth90")?.value||month90(),amount=Number(String(document.getElementById("qpayAmount90")?.value||"0").replace(",",".")),date=document.getElementById("qpayDate90")?.value||today90(),ch=(data.children||[]).find(c=>Number(c.id)===cid);
    if(!ch)return;if(!(amount>0)){if(typeof showToast==="function")showToast("Podaj kwotę większą od 0");return}
    let family=false;
    try{if(typeof familyChildren==="function"&&typeof distributeFamilyPayment==="function"){const fam=familyChildren(ch).filter(c=>typeof childActiveNow==="function"?childActiveNow(c):true);if(fam.length>1)family=!!distributeFamilyPayment(ch,m,amount,date,"Szybka wpłata")}}catch(e){}
    if(!family){data.payments.push({id:Date.now(),childId:ch.id,child:`${ch.last} ${ch.first}`,month:m,amount,date,note:"Szybka wpłata"});if(typeof logHistory==="function")logHistory(ch.id,`Dodano szybką wpłatę ${money(amount)} za ${m}.`)}
    localStorage.setItem("rw89_quickpay",JSON.stringify({childId:cid,month:m}));save();closeModal();page="payments";render();if(typeof showToast==="function")showToast("Wpłata zapisana");
  };

  function replaceCard90(){
    if(page!=="payments"||!app)return;
    const first=[...app.querySelectorAll(".card")].find(card=>norm90(card.querySelector("h2")?.textContent)==="dodaj wplate");if(!first)return;
    first.innerHTML=`<h2>Dodaj wpłatę</h2><div class="paymentSearch90"><div class="search"><input id="paySearch90" autocomplete="off" placeholder="Szukaj dziecka..." oninput="searchPaymentChildren90(this.value)"></div><div id="paymentSearchResults90" class="paymentSearchResults90"></div></div><div class="paymentSearchInfo90">Zacznij wpisywać nazwisko lub imię. Pasujące dzieci pojawią się od razu poniżej.</div>`;
  }
  function removeStart90(){document.getElementById("quickPaymentStart89")?.remove()}

  const oldPayments=window.payments;if(typeof oldPayments==="function")window.payments=function(){oldPayments();replaceCard90()};
  const oldStart=window.start;if(typeof oldStart==="function")window.start=function(){oldStart();removeStart90()};
  setTimeout(()=>{removeStart90();if(page==="payments")replaceCard90()},0);
})();
