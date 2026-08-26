/* =========================================================
   payments.js — Rozliczenia Warsztatów v11.5
   Pełny moduł płatności: baza, OCR, szybka wpłata, edycja.
   Scalono payments-base.js i część legacy-workflows.js.
   ========================================================= */
"use strict";


/* ===== WIDOK WPŁAT ===== */
function payments(){
 let paid=data.payments.reduce((s,p)=>s+Number(p.amount),0), due=data.children.reduce((s,c)=>s+childDue(c),0),inc=data.income.reduce((s,p)=>s+Number(p.amount),0);
 app.innerHTML=`<div class="eyebrow">FINANSE</div><h2 class="title">Wpłaty</h2>
 <div class="card"><h2>Dodaj wpłatę</h2><div class="search"><input id="paySearch" placeholder="Szukaj dziecka..." oninput="payHints(this.value)"></div><div id="payHints"></div><button class="primary" onclick="addPayment(null,paySearch.value)">+ Dodaj wpłatę ręcznie</button></div>
 <div class="card"><h2>Import wpłat ze screena</h2><p class="muted">Dodaj zrzut ekranu z aplikacji bankowej. Aplikacja sprawdzi kwotę względem należności i ostrzeże także przed powtórnym dodaniem tego samego przelewu.</p><div class="drop" onclick="screenInput.click()">📷<h3>Dodaj zrzut ekranu</h3><div>PNG lub JPG</div></div><button class="dark" onclick="screenInput.click()">📷 Rozpoznaj wpłaty ze screena</button><div id="ocrStatus"></div></div>
 <div class="card"><h2>Lista wpłat</h2>${data.payments.map(p=>{
   const ch=data.children.find(c=>Number(c.id)===Number(p.childId));
   const ps=ch?paymentState(ch,p.month):null;
   return `<div class="classrow"><b>${p.child}</b><div>${money(p.amount)} • ${p.month} • ${p.date||""}</div>${ps?`<div class="paymentBadgeText ${paymentStatusClass(ps.kind)}">${ps.label}</div>`:""}<button class="danger" onclick="deletePayment(${p.id})">Usuń</button></div>`;
 }).join("")||'<div class="muted">Brak wpłat.</div>'}</div>`}
function payHints(q){q=q.toLowerCase();payHints.innerHTML=data.children.filter(c=>(c.last+" "+c.first).toLowerCase().includes(q)&&q).map(c=>`<button class="soft" onclick="addPayment(${c.id})">${c.last} ${c.first}</button>`).join("")}
function addPayment(cid,query=""){
 let q=String(query||"").trim().toLowerCase();
 let matches=q?data.children.filter(c=>(c.last+" "+c.first+" "+c.first+" "+c.last).toLowerCase().includes(q)):data.children;
 if(cid){
   const selected=data.children.find(c=>c.id==cid);
   if(selected)matches=[selected];
 }
 if(!matches.length){
   confirmModal({title:"Nie znaleziono dziecka",message:`Brak dziecka pasującego do „${query}”. Zmień wpisane litery i spróbuj ponownie.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
   return;
 }
 modal(`<h2>Dodaj wpłatę</h2>${q?`<div class="payFilterInfo">Wyniki dla: <b>${query}</b> • ${matches.length}</div>`:""}<label>Dziecko</label><select id="pChild">${matches.map(c=>`<option value="${c.id}" ${c.id==cid?"selected":""}>${c.last} ${c.first}</option>`).join("")}</select><div class="grid2"><div><label>Miesiąc</label><select id="pMonth">${opt(months,"Wrzesień")}</select></div><div><label>Kwota</label><input id="pAmount" type="number"></div></div><label>Data</label><input id="pDate" type="date"><label>Tytuł / uwagi</label><input id="pNote"><div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="savePayment()">Zapisz</button></div>`)
}
async function savePayment(){
 let ch=data.children.find(c=>c.id==pChild.value), amount=+pAmount.value, month=pMonth.value;
 const candidate={date:pDate.value,amount,payer:"RĘCZNIE",title:pNote.value,childId:ch.id};
 const dup=findDuplicatePayment(candidate);
 if(dup){
   await confirmModal({title:"Ta wpłata już istnieje",message:`${ch.last} ${ch.first} • ${money(amount)} • ${pDate.value||"brak daty"}. Nie zapisuję jej ponownie.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
   return;
 }
 data.payments.push({id:Date.now(),childId:ch.id,child:ch.last+" "+ch.first,month,amount,date:pDate.value,note:pNote.value,sourceFingerprint:paymentFingerprint(candidate)});
 save();closeModal();render();
 const ps=paymentState(ch,month);
 if(ps.kind==="partial") await confirmModal({title:"Wpłata częściowa",message:`Wpłacono ${money(ps.paid)} z ${money(ps.due)}. Brakuje ${money(ps.missing)}.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
 else if(ps.kind==="overpaid") await confirmModal({title:"Nadpłata",message:`Wpłacono ${money(ps.paid)}, należne ${money(ps.due)}. Nadpłata: ${money(ps.extra)}.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
}
async function deletePayment(id){let p=data.payments.find(x=>x.id==id);let ok=await confirmModal({title:"Usunąć wpłatę?",message:`${p?p.child+" • "+money(p.amount)+". ":""}Tej operacji nie można cofnąć.`,confirmText:"Usuń wpłatę"});if(!ok)return;data.payments=data.payments.filter(p=>p.id!=id);save();render()}

function normalizeOCR(s){return (s||"").replace(/\u00a0/g," ").replace(/[|]/g,"I").replace(/\s+/g," ").trim()}
function parseMoney(s){
  let m=(s||"").match(/(\d{1,4}(?:[ .]\d{3})*[,.]\d{2})\s*(?:PLN|zł)?/i);
  if(!m)return null;
  return Number(m[1].replace(/[ .](?=\d{3}(?:[,.]|$))/g,"").replace(",","."));
}
function parseDate(s){
  let m=(s||"").match(/\b([0-3]?\d)[.\/-]([01]?\d)[.\/-](20\d{2})\b/);
  if(!m)return "";
  return `${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
}
function normPerson(s){
  return (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase()
    .replace(/[^A-Z0-9 -]/g," ").replace(/\s+/g," ").trim();
}
function nameTokens(s){
  return normPerson(s).split(" ").filter(x=>x.length>=2);
}
function probableName(line){
  let cleaned=(line||"")
    .replace(/\b\d{1,4}(?:[ .]\d{3})*[,.]\d{2}\s*(?:PLN|ZŁ)?\b/ig," ")
    .replace(/\bPRZELEW\b.*$/i," ").trim();
  let words=cleaned.split(/\s+/).filter(w=>/^[A-ZĄĆĘŁŃÓŚŹŻ-]{2,}$/.test(w));
  if(words.length>=2)return words.slice(0,4).join(" ");
  return "";
}
function personPairMatch(sourceName,targetName){
  const s=nameTokens(sourceName), t=nameTokens(targetName);
  if(s.length<2||t.length<2)return 0;
  const sFirst=s[0], sLast=s[s.length-1], tFirst=t[0], tLast=t[t.length-1];
  const firstOk=sFirst===tFirst || (Math.min(sFirst.length,tFirst.length)>=3 && (sFirst.startsWith(tFirst)||tFirst.startsWith(sFirst)));
  const lastMin=Math.min(sLast.length,tLast.length);
  const lastOk=sLast===tLast || (lastMin>=4 && (sLast.startsWith(tLast)||tLast.startsWith(sLast)));
  if(sFirst===tFirst && sLast===tLast)return 100;
  if(firstOk && lastOk)return 88;
  return 0;
}
function textContainsPerson(text,person){
  const src=normPerson(text), p=nameTokens(person);
  if(p.length<2)return 0;
  const first=p[0], last=p[p.length-1];
  const words=src.split(" ");
  const firstOk=words.some(w=>w===first || (Math.min(w.length,first.length)>=3 && (w.startsWith(first)||first.startsWith(w))));
  const lastOk=words.some(w=>w===last || (Math.min(w.length,last.length)>=4 && (w.startsWith(last)||last.startsWith(w))));
  if(firstOk&&lastOk)return words.includes(first)&&words.includes(last)?82:72;
  return 0;
}
function bestChildMatch(tx){
  let candidates=[];
  data.children.forEach(c=>{
    let parentScore=personPairMatch(tx.payer,c.parent||"");
    let childScore=textContainsPerson(tx.title||tx.raw,`${c.first} ${c.last}`);
    let parentInText=textContainsPerson(tx.payer||tx.raw,c.parent||"");
    let score=Math.max(parentScore,parentInText?90:0,childScore);
    if(score>0)candidates.push({child:c,score});
  });
  candidates.sort((a,b)=>b.score-a.score);
  if(!candidates.length)return null;
  // Automatyczne zaznaczenie tylko przy mocnym, jednoznacznym dopasowaniu.
  if(candidates[0].score<70)return null;
  if(candidates[1] && candidates[1].score===candidates[0].score)return null;
  return candidates[0];
}
function stripAmount(line){
  return (line||"").replace(/\b\d{1,4}(?:[ .]\d{3})*[,.]\d{2}\s*(?:PLN|ZŁ)?\b/ig," ").replace(/\s+/g," ").trim();
}
function parseBankOCR(text){
  const raw=(text||"").split(/\n+/).map(x=>normalizeOCR(x)).filter(Boolean);
  let currentDate="",tx=[];
  for(let i=0;i<raw.length;i++){
    const line=raw[i],d=parseDate(line);
    if(d){currentDate=d;continue}
    const amount=parseMoney(line);
    if(amount===null)continue;

    const prev=raw[i-1]||"";
    const next=raw[i+1]||"";
    const prevIsDate=!!parseDate(prev), prevHasAmount=parseMoney(prev)!==null;
    const nextIsDate=!!parseDate(next), nextHasAmount=parseMoney(next)!==null;

    // W widoku bankowym nadawca jest zwykle w wierszu nad tytułem/kwotą.
    const payerLine=(!prevIsDate&&!prevHasAmount)?prev:"";
    const payer=probableName(payerLine);
    let title=stripAmount(line);
    if(!nextIsDate&&!nextHasAmount && next && !probableName(next)) title += " "+next;

    const item={
      id:Date.now()+i,
      date:currentDate,
      amount,
      payer:payer||"",
      title:title.trim(),
      raw:[payerLine,line].filter(Boolean).join(" ")
    };
    item.match=bestChildMatch(item);
    tx.push(item);
  }
  const seen=new Set();
  return tx.filter(t=>{
    const k=`${t.date}|${t.amount}|${normPerson(t.payer)}|${normPerson(t.title)}`;
    if(seen.has(k))return false; seen.add(k); return true;
  });
}
function ocrChildOptions(selected){
  return `<option value="">— wybierz dziecko —</option>`+
    data.children.slice().sort((a,b)=>a.last.localeCompare(b.last,"pl"))
      .map(c=>`<option value="${c.id}" ${String(c.id)===String(selected)?"selected":""}>${c.last} ${c.first}</option>`).join("");
}
function showOCRReview(items,fileName){
  if(!items.length){
    modal(`<h2>Nie udało się rozpoznać wpłat</h2><div class="notice">Plik: <b>${fileName}</b></div><p>Spróbuj zrobić screen tak, aby były widoczne całe wiersze: data, nadawca/tytuł i kwota.</p><div class="actions"><button class="soft" onclick="closeModal()">Zamknij</button><button class="dark" onclick="closeModal();screenInput.click()">Spróbuj inny screen</button></div>`);
    return;
  }
  window.__ocrItems=items;
  modal(`<h2>Weryfikacja rozpoznanych wpłat</h2>
    <div class="notice">Rozpoznano <b>${items.length}</b> pozycji. Każdą wpłatę możesz zaakceptować osobno.</div>
    <div id="ocrReview">${items.map((t,idx)=>`<div class="ocrLine" id="ocrLine${idx}">
      <h4>${t.payer||"Niepewny nadawca"} — ${money(t.amount)}</h4>
      <div class="muted">${t.date||"brak daty"}${t.title?`<br>${t.title}`:""}</div>
      <div class="ocrGrid">
        <div><label>Przypisz do dziecka</label><select id="ocrChild${idx}">${ocrChildOptions(t.match?.child?.id||"")}</select></div>
        <div><label>Miesiąc</label><select id="ocrMonth${idx}">${months.map(m=>`<option>${m}</option>`).join("")}</select></div>
      </div>
      <div class="${t.match?'ocrOk':'ocrWarn'}" id="ocrHint${idx}">
        ${t.match?`Propozycja: ${t.match.child.last} ${t.match.child.first}`:"Brak pewnego automatycznego dopasowania"}
      </div>
      <div class="actions ocrItemActions">
        <button class="primary" id="ocrAccept${idx}" onclick="acceptOCRPayment(${idx})">✓ Akceptuję tę wpłatę</button>
        <button class="soft" onclick="skipOCRPayment(${idx})">Pomiń</button>
      </div>
    </div>`).join("")}</div>
    <div class="actions"><button class="soft" onclick="closeModal()">Zamknij</button><button class="dark" onclick="saveAllAssignedOCR()">Zapisz wszystkie przypisane</button></div>`);
}
function persistOCRItem(t,idx){
  const select=document.querySelector(`#ocrChild${idx}`);
  const monthEl=document.querySelector(`#ocrMonth${idx}`);
  if(!select||!monthEl)return {ok:false,reason:"missing"};
  const cid=Number(select.value||0);
  if(!cid)return {ok:false,reason:"nochild"};
  const ch=data.children.find(c=>c.id===cid);
  if(!ch)return {ok:false,reason:"nochild"};
  const candidate={date:t.date||"",amount:t.amount,payer:t.payer||"",title:t.title||"",childId:cid};
  const duplicate=findDuplicatePayment(candidate);
  if(duplicate)return {ok:false,reason:"duplicate",duplicate,ch};
  data.payments.push({
    id:Date.now()+idx,
    childId:cid,
    child:ch.last+" "+ch.first,
    month:monthEl.value,
    amount:t.amount,
    date:t.date||"",
    note:`Import OCR: ${t.payer||"nadawca niepewny"}${t.title?" • "+t.title:""}`,
    sourceFingerprint:paymentFingerprint(candidate)
  });
  return {ok:true,ch,month:monthEl.value,state:paymentState(ch,monthEl.value)};
}
function markOCRDone(idx,label="Zapisano"){
  const line=document.querySelector(`#ocrLine${idx}`);
  if(!line)return;
  line.classList.add("ocrAccepted");
  line.querySelectorAll("select,button").forEach(el=>el.disabled=true);
  const btn=document.querySelector(`#ocrAccept${idx}`);
  if(btn){btn.textContent="✓ "+label;btn.classList.add("acceptedBtn")}
}
async function acceptOCRPayment(idx){
  const t=window.__ocrItems?.[idx];
  if(!t)return;
  const cid=Number(document.querySelector(`#ocrChild${idx}`)?.value||0);
  if(!cid){document.querySelector(`#ocrHint${idx}`).textContent="Najpierw wybierz dziecko.";document.querySelector(`#ocrHint${idx}`).className="ocrWarn";return}
  const result=persistOCRItem(t,idx);
  if(result.reason==="duplicate"){
    document.querySelector(`#ocrHint${idx}`).textContent="⚠ Ta sama wpłata została już wcześniej zapisana — pomijam duplikat.";
    document.querySelector(`#ocrHint${idx}`).className="ocrDuplicate";
    markOCRDone(idx,"Duplikat — nie zapisano");
    return;
  }
  if(result.ok){
    save();
    const ps=result.state;
    if(ps.kind==="partial"){
      document.querySelector(`#ocrHint${idx}`).textContent=`CZĘŚCIOWO WPŁACONO • BRAKUJE ${money(ps.missing)}`;
      document.querySelector(`#ocrHint${idx}`).className="ocrPartial";
      markOCRDone(idx,"Wpłata częściowa");
    }else if(ps.kind==="overpaid"){
      document.querySelector(`#ocrHint${idx}`).textContent=`NADPŁATA ${money(ps.extra)}`;
      document.querySelector(`#ocrHint${idx}`).className="ocrOverpaid";
      markOCRDone(idx,"Wpłata z nadpłatą");
    }else{
      document.querySelector(`#ocrHint${idx}`).textContent=ps.label;
      document.querySelector(`#ocrHint${idx}`).className="ocrOk";
      markOCRDone(idx,"Wpłata zaakceptowana");
    }
  }
}
function skipOCRPayment(idx){markOCRDone(idx,"Pominięto")}
function saveAllAssignedOCR(){
  let saved=0,duplicates=0;
  (window.__ocrItems||[]).forEach((t,idx)=>{
    const line=document.querySelector(`#ocrLine${idx}`);
    if(line?.classList.contains("ocrAccepted"))return;
    const result=persistOCRItem(t,idx);
    if(result.reason==="duplicate"){
      duplicates++;
      const hint=document.querySelector(`#ocrHint${idx}`);
      if(hint){hint.textContent="⚠ Duplikat — ta wpłata już istnieje.";hint.className="ocrDuplicate"}
      markOCRDone(idx,"Duplikat — nie zapisano");
      return;
    }
    if(result.ok){saved++;markOCRDone(idx,result.state.kind==="partial"?"Wpłata częściowa":"Wpłata zaakceptowana")}
  });
  if(saved)save();
}
function saveOCRPayments(items){ window.__ocrItems=items; saveAllAssignedOCR(); }
screenInput.onchange=async e=>{
  let f=e.target.files[0]; if(!f)return;
  if(typeof Tesseract==="undefined"){alert("Nie udało się załadować modułu OCR. Sprawdź internet i odśwież stronę.");return}
  modal(`<h2>Rozpoznawanie screena</h2><div class="notice">Plik: <b>${f.name}</b></div><p id="ocrMsg">Uruchamiam OCR…</p><div class="ocrProgress"><div id="ocrBar"></div></div><p class="muted">Pierwsze uruchomienie może potrwać kilkanaście–kilkadziesiąt sekund.</p>`);
  try{
    const result=await Tesseract.recognize(f,'eng',{
      logger:m=>{
        let bar=document.querySelector("#ocrBar"),msg=document.querySelector("#ocrMsg");
        if(bar&&m.progress!=null)bar.style.width=Math.round(m.progress*100)+"%";
        if(msg)msg.textContent=m.status?`${m.status} ${m.progress!=null?Math.round(m.progress*100)+"%":""}`:"Rozpoznaję…";
      }
    });
    let text=result.data.text||"";
    let items=parseBankOCR(text);
    closeModal(); showOCRReview(items,f.name);
  }catch(err){
    closeModal();
    modal(`<h2>Błąd OCR</h2><p>${String(err.message||err)}</p><p class="muted">Sprawdź połączenie z internetem i spróbuj ponownie.</p><button class="soft" onclick="closeModal()">Zamknij</button>`);
  }finally{e.target.value=""}
};

function childPaymentsForMonth(ch,month="Wrzesień"){
 let total=data.payments.filter(p=>Number(p.childId)===Number(ch.id)&&p.month===month).reduce((s,p)=>s+Number(p.amount||0),0);
 data.creditTransfers.forEach(t=>{
   if(Number(t.childId)!==Number(ch.id))return;
   if(t.fromMonth===month)total-=Number(t.amount||0);
   if(t.toMonth===month)total+=Number(t.amount||0);
 });
 return total;
}

function nextMonthName(month){
 const i=months.indexOf(month);
 return i>=0&&i<months.length-1?months[i+1]:"";
}

async function transferOverpayment(cid,month){
 const ch=data.children.find(c=>c.id==cid); if(!ch)return;
 const ps=paymentState(ch,month),to=nextMonthName(month);
 if(ps.kind!=="overpaid"||ps.extra<=0)return;
 if(!to){await confirmModal({title:"Brak kolejnego miesiąca",message:"Czerwiec jest ostatnim miesiącem roku zajęć. Nadpłatę zostaw jako saldo lub rozlicz ręcznie.",confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 const ok=await confirmModal({title:"Przenieść nadpłatę?",message:`Przenieść ${money(ps.extra)} z ${month} na ${to}?`,confirmText:"Przenieś",cancelText:"Anuluj",danger:false});
 if(!ok)return;
 data.creditTransfers.push({id:Date.now(),childId:ch.id,fromMonth:month,toMonth:to,amount:ps.extra,date:new Date().toISOString().slice(0,10)});
 logHistory(ch.id,`Przeniesiono nadpłatę ${money(ps.extra)}: ${month} → ${to}.`);
 save();render();
}

function reminderText(ch,month){
 const ps=paymentState(ch,month);
 const types=[...new Set((ch.classes||[]).map(x=>x.type))].join(", ");
 return String(data.settings.reminderTemplate||"")
  .replaceAll("{dziecko}",`${ch.first} ${ch.last}`)
  .replaceAll("{miesiac}",month)
  .replaceAll("{brakuje}",money(ps.missing))
  .replaceAll("{warsztaty}",types||"warsztaty");
}

function sendReminderSMS(cid,month){
 const ch=data.children.find(c=>c.id==cid);if(!ch)return;
 const phone=String(ch.phone||"").replace(/[^\d+]/g,"");
 if(!phone){confirmModal({title:"Brak numeru telefonu",message:"Uzupełnij numer telefonu rodzica/opiekuna w profilu dziecka.",confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 const body=encodeURIComponent(reminderText(ch,month));
 window.location.href=`sms:${phone}?body=${body}`;
}

async function copyReminder(cid,month){
 const ch=data.children.find(c=>c.id==cid);if(!ch)return;
 const txt=reminderText(ch,month);
 try{await navigator.clipboard.writeText(txt);showToast("Skopiowano przypomnienie")}catch(e){prompt("Skopiuj tekst:",txt)}
}

function familyChildren(ch){
 const key=String(ch?.payerGroup||"").trim().toLowerCase();
 if(!key)return [];
 return data.children.filter(c=>String(c.payerGroup||"").trim().toLowerCase()===key);
}

function distributeFamilyPayment(ch,month,amount,date,note){
 const fam=familyChildren(ch).filter(childActiveNow);
 if(fam.length<2)return false;
 let left=Number(amount||0),created=[];
 fam.sort((a,b)=>(a.id===ch.id?-1:b.id===ch.id?1:0));
 fam.forEach(c=>{
   if(left<=0)return;
   const ps=paymentState(c,month);
   const need=Math.max(0,ps.missing);
   if(need<=0)return;
   const part=Math.min(left,need);
   data.payments.push({id:Date.now()+created.length,childId:c.id,child:`${c.last} ${c.first}`,month,amount:part,date,note:`Rodzina: ${note||""}`});
   created.push(`${c.first} ${c.last}: ${money(part)}`);left-=part;
 });
 if(left>0){
   data.payments.push({id:Date.now()+100,childId:ch.id,child:`${ch.last} ${ch.first}`,month,amount:left,date,note:`Nadwyżka rodzinna: ${note||""}`});
   created.push(`${ch.first} ${ch.last}: ${money(left)}`);
 }
 created.forEach(x=>logHistory(ch.id,`Rozdzielono wpłatę rodzinną — ${x}`));
 return created;
}

function addPayment(cid,query=""){
 let q=String(query||"").trim().toLowerCase(),matches=q?data.children.filter(c=>(c.last+" "+c.first+" "+c.first+" "+c.last).toLowerCase().includes(q)):data.children;
 if(cid){const selected=data.children.find(c=>c.id==cid);if(selected)matches=[selected]}
 if(!matches.length){confirmModal({title:"Nie znaleziono dziecka",message:`Brak dziecka pasującego do „${query}”.`,confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 modal(`<h2>Dodaj wpłatę</h2>${q?`<div class="payFilterInfo">Wyniki dla: <b>${query}</b> • ${matches.length}</div>`:""}
 <label>Dziecko</label><select id="pChild" onchange="refreshFamilyPayHint()">${matches.map(c=>`<option value="${c.id}" ${c.id==cid?"selected":""}>${c.last} ${c.first}</option>`).join("")}</select>
 <div id="familyPayHint"></div>
 <div class="grid2"><div><label>Miesiąc</label><select id="pMonth" onchange="refreshFamilyPayHint()">${opt(months,"Wrzesień")}</select></div><div><label>Kwota</label><input id="pAmount" type="number"></div></div>
 <label>Data</label><input id="pDate" type="date"><label>Tytuł / uwagi</label><input id="pNote">
 <label class="checkLine"><input id="pSplitFamily" type="checkbox"> Rozdziel wpłatę automatycznie na dzieci tego samego płatnika / rodziny</label>
 <div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="savePayment()">Zapisz</button></div>`);
 refreshFamilyPayHint();
}

function refreshFamilyPayHint(){
 const ch=data.children.find(c=>c.id==document.getElementById("pChild")?.value),el=document.getElementById("familyPayHint");if(!el||!ch)return;
 const fam=familyChildren(ch);
 el.innerHTML=fam.length>1?`<div class="familyHint">Wspólny płatnik: <b>${escapeHtml(ch.payerGroup)}</b> • dzieci: ${fam.map(x=>`${x.first} ${x.last}`).join(", ")}</div>`:"";
}

async function savePayment(){
 let ch=data.children.find(c=>c.id==pChild.value),amount=+pAmount.value,month=pMonth.value;
 if(!ch||amount<=0)return;
 if(document.getElementById("pSplitFamily")?.checked && familyChildren(ch).length>1){
   const created=distributeFamilyPayment(ch,month,amount,pDate.value,pNote.value);
   if(created){save();closeModal();render();await confirmModal({title:"Wpłata rozdzielona",message:created.join(" • "),confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 }
 const candidate={date:pDate.value,amount,payer:"RĘCZNIE",title:pNote.value,childId:ch.id},dup=findDuplicatePayment(candidate);
 if(dup){await confirmModal({title:"Ta wpłata już istnieje",message:`${ch.last} ${ch.first} • ${money(amount)}. Nie zapisuję ponownie.`,confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 data.payments.push({id:Date.now(),childId:ch.id,child:ch.last+" "+ch.first,month,amount,date:pDate.value,note:pNote.value,sourceFingerprint:paymentFingerprint(candidate)});
 logHistory(ch.id,`Dodano wpłatę ${money(amount)} za ${month}.`);
 save();closeModal();render();
 const ps=paymentState(ch,month);
 if(ps.kind==="partial")await confirmModal({title:"Wpłata częściowa",message:`Brakuje ${money(ps.missing)}.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
 else if(ps.kind==="overpaid")await confirmModal({title:"Nadpłata",message:`Nadpłata: ${money(ps.extra)}. Możesz ją przenieść na kolejny miesiąc z profilu dziecka.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
}

(function(){
"use strict";

function escapePaymentHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

const QUICK_PAYMENT_PREFS_KEY = "rw89_quickpay";

function quickPaymentTodayISO(){
  const d=new Date();
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function quickPaymentCurrentMonth(){
  if(typeof currentMonthName==="function") return currentMonthName();
  const names=["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
  return names[new Date().getMonth()];
}

function paymentActiveChildren(){
  return (data.children||[]).filter(c=>typeof childActiveNow==="function" ? childActiveNow(c) : true);
}
/* ---------- 8.9 / SZYBKA WPŁATA ---------- */

  window.openQuickPayment = function(){
    const children=paymentActiveChildren().slice().sort((a,b)=>
      `${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`,"pl")
    );
    if(!children.length){
      if(typeof showToast==="function") showToast("Brak aktywnych dzieci");
      return;
    }

    let prefs={};
    try{prefs=JSON.parse(localStorage.getItem(QUICK_PAYMENT_PREFS_KEY)||"{}")}catch(e){}
    const month=(months||[]).includes(prefs.month)?prefs.month:quickPaymentCurrentMonth();
    const preferredChild=children.some(c=>String(c.id)===String(prefs.childId))?String(prefs.childId):String(children[0].id);

    modal(`<div class="quickPaymentBox">
      <h2>⚡ Szybka wpłata</h2>
      <div class="muted">Wybierz dziecko. Kwota ustawi się automatycznie na brakującą należność.</div>

      <label>Dziecko</label>
      <select id="quickPayChildSelect" onchange="refreshQuickPayment()">
        ${children.map(c=>`<option value="${c.id}" ${String(c.id)===preferredChild?"selected":""}>${escapePaymentHtml(c.last)} ${escapePaymentHtml(c.first)} • ${escapePaymentHtml(c.school||"")}</option>`).join("")}
      </select>

      <label>Miesiąc</label>
      <select id="quickPayMonthSelect" onchange="refreshQuickPayment()">
        ${(months||[]).map(m=>`<option ${m===month?"selected":""}>${m}</option>`).join("")}
      </select>

      <div id="quickPaySummary"></div>

      <label>Kwota wpłaty</label>
      <input id="quickPayAmountInput" type="number" min="0" step="0.01" inputmode="decimal">

      <label>Data</label>
      <input id="quickPayDateInput" type="date" value="${quickPaymentTodayISO()}">

      <div class="actions">
        <button class="soft" onclick="closeModal()">Anuluj</button>
        <button class="primary" onclick="saveQuickPayment()">Zapisz wpłatę</button>
      </div>
    </div>`);
    refreshQuickPayment(true);
  };

  window.refreshQuickPayment = function(forceAmount){
    const cid=Number(document.getElementById("quickPayChildSelect")?.value||0);
    const month=document.getElementById("quickPayMonthSelect")?.value||quickPaymentCurrentMonth();
    const ch=(data.children||[]).find(c=>Number(c.id)===cid);
    if(!ch)return;

    let ps;
    try{
      ps=paymentState(ch,month);
    }catch(e){
      const due=typeof childDue==="function"?childDue(ch):0;
      const paid=typeof childPaymentsForMonth==="function"?childPaymentsForMonth(ch,month):0;
      ps={due,paid,missing:Math.max(0,due-paid),kind:paid>=due?"paid":"unpaid"};
    }

    const summary=document.getElementById("quickPaySummary");
    if(summary){
      summary.innerHTML=`<div class="quickPaymentSummary">
        <div><span>Należne</span><b>${money(ps.due||0)}</b></div>
        <div><span>Wpłacono</span><b>${money(ps.paid||0)}</b></div>
        <div class="quickPaymentMissing"><span>Brakuje</span><b>${money(ps.missing||0)}</b></div>
      </div>`;
    }

    const amount=document.getElementById("quickPayAmountInput");
    if(amount && (forceAmount || !amount.dataset.userChanged)){
      amount.value=Number(ps.missing||0).toFixed(2);
    }
    if(amount && !amount.dataset.groupMemoryBound){
      amount.dataset.groupMemoryBound="1";
      amount.addEventListener("input",()=>amount.dataset.userChanged="1");
    }

    localStorage.setItem(QUICK_PAYMENT_PREFS_KEY,JSON.stringify({childId:cid,month}));
  };

  window.saveQuickPayment = function(){
    const cid=Number(document.getElementById("quickPayChildSelect")?.value||0);
    const month=document.getElementById("quickPayMonthSelect")?.value||quickPaymentCurrentMonth();
    const amount=Number(String(document.getElementById("quickPayAmountInput")?.value||"0").replace(",","."));
    const date=document.getElementById("quickPayDateInput")?.value||quickPaymentTodayISO();
    const ch=(data.children||[]).find(c=>Number(c.id)===cid);

    if(!ch){
      if(typeof showToast==="function")showToast("Wybierz dziecko");
      return;
    }
    if(!(amount>0)){
      if(typeof showToast==="function")showToast("Podaj kwotę większą od 0");
      return;
    }

    let handledFamily=false;
    try{
      if(typeof familyChildren==="function" && typeof distributeFamilyPayment==="function"){
        const fam=familyChildren(ch).filter(c=>typeof childActiveNow==="function"?childActiveNow(c):true);
        if(fam.length>1){
          const result=distributeFamilyPayment(ch,month,amount,date,"Szybka wpłata");
          handledFamily=!!result;
        }
      }
    }catch(e){}

    if(!handledFamily){
      data.payments.push({
        id:Date.now(),
        childId:ch.id,
        child:`${ch.last} ${ch.first}`,
        month,
        amount,
        date,
        note:"Szybka wpłata"
      });
      if(typeof logHistory==="function"){
        logHistory(ch.id,`Dodano szybką wpłatę ${money(amount)} za ${month}.`);
      }
    }

    localStorage.setItem(QUICK_PAYMENT_PREFS_KEY,JSON.stringify({childId:cid,month}));
    save();
    closeModal();
    render();
    if(typeof showToast==="function")showToast("Wpłata zapisana");
  };

  
})();
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

window.quickPaySearch=function(value){
  const box=document.getElementById("quickPayResults"); if(!box)return;
  const q=normPay(value); if(!q){box.innerHTML="";return}
  const tokens=q.split(" ").filter(Boolean);

  const found=activeChildrenPay().filter(c=>{
    const hay=normPay([c.last,c.first,`${c.last} ${c.first}`,`${c.first} ${c.last}`,c.school||"",c.class||""].join(" "));
    return tokens.every(t=>hay.includes(t));
  }).slice(0,25);

  if(!found.length){
    box.innerHTML='<div class="quickPayEmpty">Brak pasującego dziecka.</div>';
    return;
  }

  box.innerHTML=found.map(c=>`<button type="button" class="quickPayChild" onclick="openQuickPayForChild(${c.id})">
    <span><b>${escPay(c.last)} ${escPay(c.first)}</b><small>${escPay(c.school||"")}${c.class?` • ${escPay(c.class)}`:""}</small></span>
    <span class="quickPayArrow">›</span>
  </button>`).join("");
};

window.openQuickPayForChild=function(childId){
  if(typeof openQuickPayment!=="function")return;
  let prefs={}; try{prefs=JSON.parse(localStorage.getItem(QUICKPAY89_KEY)||"{}")}catch(e){}
  prefs.childId=Number(childId);
  if(!prefs.month && typeof currentMonthName==="function")prefs.month=currentMonthName();
  localStorage.setItem(QUICKPAY89_KEY,JSON.stringify(prefs));
  openQuickPayment();
};

function replacePaymentCard(){
  if(!app)return;
  const pageTitle=[...app.querySelectorAll(".title")].find(x=>normPay(x.textContent)==="wplaty");
  if(!pageTitle)return;

  const card=[...app.querySelectorAll(".card")].find(c=>{
    const h=c.querySelector("h2");
    return h && normPay(h.textContent)==="dodaj wplate";
  });

  if(!card || card.dataset.quickPayPatched==="1")return;
  card.dataset.quickPayPatched="1";
  card.innerHTML=`<h2>Dodaj wpłatę</h2>
    <div class="quickPaySearchBox">
      <div class="search">
        <input id="quickPayInput" type="search" autocomplete="off" placeholder="Szukaj dziecka..." oninput="quickPaySearch(this.value)">
      </div>
      <div id="quickPayResults" class="quickPayResults"></div>
      <div class="quickPayHelp">Wpisz pierwsze litery nazwiska lub imienia i wybierz dziecko.</div>
    </div>`;
}

function removeStartQuickPay(){document.getElementById("quickPaymentStart")?.remove()}

/* =========================
   EDYCJA ISTNIEJĄCEJ WPŁATY
   ========================= */


/* ===== EDYCJA WPŁAT ===== */
window.editPayment=function(paymentId){
  const p=(data.payments||[]).find(x=>Number(x.id)===Number(paymentId));
  if(!p){
    if(typeof showToast==="function")showToast("Nie znaleziono wpłaty");
    return;
  }

  const children=(data.children||[]).slice().sort((a,b)=>
    `${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`,"pl")
  );

  const selectedChild=(data.children||[]).find(c=>Number(c.id)===Number(p.childId));

  modal(`<h2>Edytuj wpłatę</h2>
    <div class="muted editPaymentInfo">
      Zmiany od razu przeliczą rozliczenie dziecka oraz podsumowanie wpływów.
    </div>

    <label>Dziecko</label>
    <select id="editPaymentChild">
      ${children.map(c=>`<option value="${c.id}" ${Number(c.id)===Number(p.childId)?"selected":""}>${escPay(c.last)} ${escPay(c.first)} • ${escPay(c.school||"")}</option>`).join("")}
    </select>

    <label>Miesiąc rozliczeniowy</label>
    <select id="editPaymentMonth">
      ${(months||[]).map(m=>`<option ${String(m)===String(p.month)?"selected":""}>${escPay(m)}</option>`).join("")}
    </select>

    <label>Kwota</label>
    <input id="editPaymentAmount" type="number" min="0" step="0.01" inputmode="decimal" value="${Number(p.amount||0).toFixed(2)}">

    <label>Data wpływu</label>
    <input id="editPaymentDate" type="date" value="${escPay(p.date||"")}">

    <label>Tytuł / uwagi</label>
    <input id="editPaymentNote" value="${escPay(p.note||"")}">

    <div class="paymentEditHint">
      <b>Miesiąc rozliczeniowy</b> określa, za który miesiąc płaci dziecko.
      <b>Data wpływu</b> określa, w którym miesiącu kwota trafia do „Razem wpływy”.
    </div>

    <div class="actions">
      <button class="soft" onclick="closeModal()">Anuluj</button>
      <button class="primary" onclick="saveEditedPayment(${Number(p.id)})">Zapisz zmiany</button>
    </div>`);
};

window.saveEditedPayment=function(paymentId){
  const p=(data.payments||[]).find(x=>Number(x.id)===Number(paymentId));
  if(!p)return;

  const childId=Number(document.getElementById("editPaymentChild")?.value||0);
  const month=document.getElementById("editPaymentMonth")?.value||"";
  const amount=Number(String(document.getElementById("editPaymentAmount")?.value||"0").replace(",","."));
  const date=document.getElementById("editPaymentDate")?.value||"";
  const note=document.getElementById("editPaymentNote")?.value.trim()||"";
  const ch=(data.children||[]).find(c=>Number(c.id)===childId);

  if(!ch){
    if(typeof showToast==="function")showToast("Wybierz dziecko");
    return;
  }
  if(!(amount>0)){
    if(typeof showToast==="function")showToast("Kwota musi być większa od 0");
    return;
  }
  if(!month){
    if(typeof showToast==="function")showToast("Wybierz miesiąc");
    return;
  }
  if(!date){
    if(typeof showToast==="function")showToast("Podaj datę wpływu");
    return;
  }

  const before={
    childId:p.childId,
    child:p.child,
    month:p.month,
    amount:Number(p.amount||0),
    date:p.date||"",
    note:p.note||""
  };

  p.childId=ch.id;
  p.child=`${ch.last} ${ch.first}`;
  p.month=month;
  p.amount=amount;
  p.date=date;
  p.note=note;

  if(typeof logHistory==="function"){
    const desc=`Edytowano wpłatę: ${money(before.amount)} / ${before.month} / ${before.date||"brak daty"} → ${money(amount)} / ${month} / ${date}.`;
    try{ logHistory(ch.id,desc); }catch(e){}
    if(Number(before.childId)!==Number(ch.id)){
      try{ logHistory(before.childId,`Wpłata została przeniesiona do: ${ch.last} ${ch.first}.`); }catch(e){}
    }
  }

  save();
  closeModal();
  page="payments";
  render();

  if(typeof showToast==="function")showToast("Wpłata zaktualizowana");
};

/* Dodajemy przycisk Edytuj do każdej istniejącej pozycji bez ruszania app.js. */
function addPaymentEditButtons(){
  if(typeof page==="undefined" || page!=="payments" || !app)return;

  const listCard=[...app.querySelectorAll(".card")].find(card=>
    normPay(card.querySelector("h2")?.textContent||"")==="lista wplat"
  );
  if(!listCard)return;

  const rows=[...listCard.querySelectorAll(".classrow")];
  const payments=data.payments||[];

  rows.forEach((row,index)=>{
    if(row.querySelector(".editPaymentBtn"))return;
    const p=payments[index];
    if(!p)return;

    const del=[...row.querySelectorAll("button")].find(b=>normPay(b.textContent)==="usun");
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="soft editPaymentBtn";
    btn.textContent="Edytuj";
    btn.onclick=()=>editPayment(p.id);

    if(del) row.insertBefore(btn,del);
    else row.appendChild(btn);
  });
}

const paymentViewObserver=new MutationObserver(()=>{
  removeStartQuickPay();
  replacePaymentCard();
  enhanceOCRReview();
  addPaymentEditButtons();
});
paymentViewObserver.observe(app,{childList:true,subtree:true});

function ocrMatchConfidence(item){
  return Math.round(Math.max(0,Math.min(100,Number(item?.match?.score||0))));
}
function isCertainOCRPayment(item){
  return !!(item?.match?.child && ocrMatchConfidence(item)>=OCR_CERTAIN_THRESHOLD && Number(item.amount)>0 && item.date);
}
function unresolvedCertainOCRPayments(){
  const items=window.__ocrItems||[];
  return items.map((t,i)=>({t,i})).filter(({t,i})=>
    isCertainOCRPayment(t) &&
    !document.querySelector(`#ocrLine${i}`)?.classList.contains("ocrAccepted")
  );
}
function updateOCRBulkButton(){
  const btn=document.getElementById("ocrBulkCertain");
  if(!btn)return;
  const count=unresolvedCertainOCRPayments().length;
  btn.disabled=count===0;
  btn.textContent=count?`✓ Zapisz ${count} pewnych wpłat`:"✓ Brak pewnych wpłat do zapisania";
}

function enhanceOCRReview(){
  const items=window.__ocrItems||[];
  const review=document.getElementById("ocrReview");
  if(!review || review.dataset.ocrEnhanced==="1")return;
  review.dataset.ocrEnhanced="1";

  items.forEach((t,idx)=>{
    const hint=document.getElementById(`ocrHint${idx}`);
    if(!hint)return;
    const score=ocrMatchConfidence(t);
    if(t.match?.child){
      hint.insertAdjacentHTML("afterend",
        `<div class="ocrConfidence ${score>=OCR_CERTAIN_THRESHOLD?"certain":"review"}">
          Pewność dopasowania: ${score}%${score>=OCR_CERTAIN_THRESHOLD?" • pewne":" • sprawdź ręcznie"}
        </div>`);
    }
  });

  const certain=unresolvedCertainOCRPayments().length;
  review.insertAdjacentHTML("beforebegin",
    `<div class="ocrBulkBar">
      <div><b>Automatyczna weryfikacja</b><span>${certain} z ${items.length} pozycji ma pewność co najmniej ${OCR_CERTAIN_THRESHOLD}%.</span></div>
      <button id="ocrBulkCertain" class="primary" onclick="saveCertainOCRPayments()">✓ Zapisz ${certain} pewnych wpłat</button>
    </div>`);
}

window.saveCertainOCRPayments=async function(){
  const rows=unresolvedCertainOCRPayments();
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
  updateOCRBulkButton();

  if(typeof showToast==="function"){
    showToast(`Zapisano ${saved} pewnych wpłat${left?` • ${left} do sprawdzenia`:""}`);
  }
};

const originalShowOCRReview=window.showOCRReview;
if(typeof originalShowOCRReview==="function"){
  window.showOCRReview=function(items,fileName){
    originalShowOCRReview(items,fileName);
    setTimeout(enhanceOCRReview,0);
  };
}

const style=document.createElement("style");
style.textContent=`
.ocrBulkBar{display:flex;gap:12px;align-items:center;justify-content:space-between;margin:14px 0;padding:14px;border:1px solid #bfe4da;border-radius:18px;background:#f0faf7}
.ocrBulkBar b,.ocrBulkBar span{display:block}.ocrBulkBar b{color:#126f5d;font-size:16px}.ocrBulkBar span{margin-top:4px;color:#64727d;font-size:13px;font-weight:700}
.ocrConfidence{margin:7px 0 10px;padding:7px 10px;border-radius:12px;font-size:13px;font-weight:900}
.ocrConfidence.certain{background:#e7f8f1;color:#11745d}.ocrConfidence.review{background:#fff6df;color:#9a6800}
.editPaymentBtn{margin-right:8px}
.editPaymentInfo{margin-bottom:14px}
.paymentEditHint{margin:14px 0;padding:12px 14px;border-radius:16px;background:#eef8fb;color:#526573;font-size:13px;line-height:1.5}
.paymentEditHint b{color:var(--blue)}
@media(max-width:620px){.ocrBulkBar{align-items:stretch;flex-direction:column}.ocrBulkBar button{width:100%}}
`;
document.head.appendChild(style);

setTimeout(()=>{
  removeStartQuickPay();
  replacePaymentCard();
  enhanceOCRReview();
  addPaymentEditButtons();
},0);

window.RWModules=window.RWModules||{};
window.RWModules.payments={version:"11.5",ocrCertainThreshold:OCR_CERTAIN_THRESHOLD,paymentEditing:true};
})();
