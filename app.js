
const VERSION="5.1";
const months=["Wrzesień","Październik","Listopad","Grudzień","Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec"];
const schools=["SP 162","ZSP 17"];
const workshops=["Rękodzieło","Zaawansowane","Artystyczne"];
const days=["Poniedziałek","Wtorek","Środa","Czwartek","Piątek"];
const times=["13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
let data=JSON.parse(localStorage.getItem("rw45")||"null")||{
 children:[
 {id:1,last:"Kolasa",first:"Nikola",sex:"Dziewczynka",class:"4A",school:"SP 162",club:"Tak",parent:"Łukasz Kolasa",phone:"50340488",email:"mexilianpl@gmail.com",classes:[
  {id:11,type:"Rękodzieło",day:"Wtorek",time:"15:00",school:"SP 162",price:155,discount:0,status:"brak"},
  {id:12,type:"Zaawansowane",day:"Środa",time:"15:30",school:"SP 162",price:165,discount:10,status:"brak"}]},
 {id:2,last:"Kowalski",first:"Jan",sex:"Chłopiec",class:"5A",school:"ZSP 17",club:"Nie",parent:"",phone:"",email:"",classes:[{id:21,type:"Rękodzieło",day:"Wtorek",time:"15:30",school:"ZSP 17",price:155,discount:0,status:"brak"}]},
 {id:3,last:"Nowak",first:"Maja",sex:"Dziewczynka",class:"3B",school:"SP 162",club:"Tak",parent:"",phone:"",email:"",classes:[{id:31,type:"Artystyczne",day:"Wtorek",time:"15:30",school:"SP 162",price:155,discount:100,status:"bezplatne"}]}
 ],payments:[],income:[]};
let page="start"; const app=document.querySelector("#app"), nav=document.querySelector("#nav");
function save(){localStorage.setItem("rw45",JSON.stringify(data))}
function money(v){return Number(v||0).toLocaleString("pl-PL",{minimumFractionDigits:2,maximumFractionDigits:2})+" zł"}
function dueClass(c){return c.status==="bezplatne"?0:Math.max(0,c.price*(1-(c.discount||0)/100))}
function childDue(ch){return ch.classes.reduce((s,c)=>s+dueClass(c),0)}

function childPaymentsForMonth(ch,month="Wrzesień"){
  return data.payments.filter(p=>Number(p.childId)===Number(ch.id)&&p.month===month)
    .reduce((s,p)=>s+Number(p.amount||0),0);
}
function paymentState(ch,month="Wrzesień"){
  const due=childDue(ch), paid=childPaymentsForMonth(ch,month);
  if(due<=0)return {kind:"free",due,paid,missing:0,extra:Math.max(0,paid),label:"BEZPŁATNE"};
  if(paid<=0)return {kind:"unpaid",due,paid,missing:due,extra:0,label:"BRAK WPŁATY"};
  if(paid<due)return {kind:"partial",due,paid,missing:due-paid,extra:0,label:`CZĘŚCIOWO WPŁACONO • BRAKUJE ${money(due-paid)}`};
  if(paid>due)return {kind:"overpaid",due,paid,missing:0,extra:paid-due,label:`NADPŁATA ${money(paid-due)}`};
  return {kind:"paid",due,paid,missing:0,extra:0,label:"WPŁACONO"};
}
function paymentStatusClass(kind){
  return kind==="paid"?"paid":kind==="partial"?"partial":kind==="overpaid"?"overpaid":kind==="free"?"free":"unpaid";
}
function paymentFingerprint({date="",amount=0,payer="",title="",childId=""}){
  const clean=s=>normPerson(String(s||"")).replace(/\s+/g," ");
  return [date,Number(amount||0).toFixed(2),clean(payer),clean(title),String(childId||"")].join("|");
}
function existingPaymentFingerprint(p){
  if(p.sourceFingerprint)return p.sourceFingerprint;
  const note=String(p.note||"").replace(/^Import OCR:\s*/i,"");
  const parts=note.split(" • ");
  return paymentFingerprint({date:p.date,amount:p.amount,payer:parts[0]||"",title:parts.slice(1).join(" • "),childId:p.childId});
}
function findDuplicatePayment(candidate){
  const fp=paymentFingerprint(candidate);
  return data.payments.find(p=>existingPaymentFingerprint(p)===fp) || null;
}

function opt(arr,val){return arr.map(x=>`<option ${x==val?"selected":""}>${x}</option>`).join("")}
const tabs=[["start","⌂","Start"],["children","👥","Dzieci"],["payments","✓","Wpłaty"],["income","+","Przychody"],["signups","✉","Zapisy"],["groups","☷","Grupy"],["reports","▥","Raporty"],["lists","⚙","Listy"]];
function renderNav(){nav.innerHTML=tabs.map(t=>`<button class="${page==t[0]?"active":""}" onclick="go('${t[0]}')"><div>${t[1]}</div>${t[2]}</button>`).join("")}
function go(p){page=p;render()}
function render(){renderNav(); ({start,children,payments,income,signups,groups,reports,lists}[page]||start)()}
function start(){
 let paid=data.payments.reduce((s,p)=>s+Number(p.amount),0), inc=data.income.reduce((s,p)=>s+Number(p.amount),0), due=data.children.reduce((s,c)=>s+childDue(c),0);
 app.innerHTML=`<div class="eyebrow">PANEL GŁÓWNY</div><h2 class="title">Wszystko w jednym miejscu</h2>
 <div class="summary"><div class="stat">Należne<b>${money(due)}</b></div><div class="stat">Wpłaty dzieci<b>${money(paid)}</b></div><div class="stat">Dodatkowe przychody<b>${money(inc)}</b></div><div class="stat">Razem wpływy<b>${money(paid+inc)}</b></div></div>
 <div class="card"><h2>Szybkie wyszukiwanie dziecka</h2><div class="search"><input id="quick" placeholder="Nazwisko lub imię..." oninput="quickSearch(this.value)"></div><div id="quickResults"></div></div>`;
}
function quickSearch(q){let el=document.querySelector("#quickResults");q=q.toLowerCase().trim(); if(!q){el.innerHTML="";return} el.innerHTML=data.children.filter(c=>(c.last+" "+c.first).toLowerCase().includes(q)).map(c=>`<div class="card" onclick="openChild(${c.id})"><b class="name">${c.last} ${c.first}</b><div class="muted">${c.class} • ${c.school} • zajęcia: ${c.classes.length}</div></div>`).join("")||"Brak wyników"}
function children(){
 app.innerHTML=`<div class="titleline"><div><div class="eyebrow">BAZA</div><h2 class="title">Dzieci</h2></div><button class="primary" onclick="editChild()">+ Dodaj</button></div>
 <div class="search"><input id="cs" placeholder="Szukaj po nazwisku / imieniu..." oninput="filterChildren()"></div>
 <select id="schoolFilter" onchange="filterChildren()"><option>Wszystkie szkoły</option>${schools.map(s=>`<option>${s}</option>`)}</select><div id="childrenList"></div>`; filterChildren()
}
function filterChildren(){
 let q=(document.querySelector("#cs")?.value||"").trim().toLowerCase(),
     sf=document.querySelector("#schoolFilter")?.value,
     list=document.querySelector("#childrenList");
 if(!list)return;
 if(!q){
   list.innerHTML="";
   return;
 }
 let arr=data.children.filter(c=>(c.last+" "+c.first).toLowerCase().includes(q)&&(sf=="Wszystkie szkoły"||c.school==sf));
 list.innerHTML=arr.map(childCard).join("")||'<div class="card muted">Brak wyników dla wpisanej frazy.</div>';
}
function childCard(c){
 const ps=paymentState(c,"Wrzesień");
 return `<div class="card"><div class="childhead"><div><div class="name">${c.last} ${c.first}</div><div class="muted">${c.class} • ${c.school} • świetlica: ${c.club} • ${c.sex}</div><div class="due">Należne Wrzesień: ${money(ps.due)} • wpłacono ${money(ps.paid)}</div><div class="paymentBadgeText ${paymentStatusClass(ps.kind)}">${ps.label}</div></div><button class="soft" onclick="editChild(${c.id})">Profil</button></div>
 ${c.classes.map(cl=>`<div class="classrow"><h3>${cl.type}</h3><div class="muted">${cl.day} ${cl.time} • ${cl.school}</div><div class="muted">Cena ${money(dueClass(cl))}${cl.discount?` • rabat ${cl.discount}%`:""}</div><div class="actions"><button class="soft" onclick="editClass(${c.id},${cl.id})">Edytuj zajęcia</button><button class="danger" onclick="deleteClass(${c.id},${cl.id})">Usuń zajęcia</button></div></div>`).join("")}
 <div class="actions"><button class="primary" onclick="editClass(${c.id})">+ Dodaj zajęcia</button></div></div>`}
function modal(html){document.body.insertAdjacentHTML("beforeend",`<div class="modal" id="modal"><div class="modalbox">${html}</div></div>`)}
function closeModal(){document.querySelector("#modal")?.remove()}
function editChild(id){let c=data.children.find(x=>x.id==id)||{id:Date.now(),last:"",first:"",sex:"Dziewczynka",class:"",school:schools[0],club:"Tak",parent:"",phone:"",email:"",classes:[]};
 modal(`<h2>${id?"Edytuj":"Dodaj"} dziecko</h2><div class="grid2"><div><label>Nazwisko</label><input id="fLast" value="${c.last}"></div><div><label>Imię</label><input id="fFirst" value="${c.first}"></div>
 <div><label>Płeć</label><select id="fSex">${opt(["Dziewczynka","Chłopiec"],c.sex)}</select></div><div><label>Klasa</label><input id="fClass" value="${c.class}"></div></div>
 <label>Szkoła</label><select id="fSchool">${opt(schools,c.school)}</select><label>Świetlica</label><select id="fClub">${opt(["Tak","Nie"],c.club)}</select>
 <label>Rodzic / opiekun</label><input id="fParent" value="${c.parent||""}"><label>Telefon</label><input id="fPhone" value="${c.phone||""}"><label>E-mail</label><input id="fEmail" value="${c.email||""}">
 <div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="saveChild(${c.id},${id?1:0})">Zapisz</button></div>`) }
function saveChild(id,exists){let obj={id,last:fLast.value,first:fFirst.value,sex:fSex.value,class:fClass.value,school:fSchool.value,club:fClub.value,parent:fParent.value,phone:fPhone.value,email:fEmail.value,classes:exists?data.children.find(c=>c.id==id).classes:[]}; if(exists)data.children[data.children.findIndex(c=>c.id==id)]=obj;else data.children.push(obj);save();closeModal();render()}
function editClass(cid,clid){let ch=data.children.find(c=>c.id==cid),cl=ch.classes.find(x=>x.id==clid)||{id:Date.now(),type:workshops[0],day:days[0],time:times[0],school:ch.school,price:155,discount:0,status:"brak"};
 modal(`<h2>${clid?"Edytuj":"Dodaj"} zajęcia</h2><label>Rodzaj zajęć</label><select id="clType">${opt(workshops,cl.type)}</select><label>Szkoła</label><select id="clSchool">${opt(schools,cl.school)}</select>
 <div class="grid2"><div><label>Dzień</label><select id="clDay">${opt(days,cl.day)}</select></div><div><label>Godzina</label><select id="clTime">${opt(times,cl.time)}</select></div></div>
 <div class="grid2"><div><label>Cena regularna</label><input id="clPrice" type="number" value="${cl.price}"></div><div><label>Rabat %</label><select id="clDisc">${opt([0,10,20,30,50,100],cl.discount)}</select></div></div>
 <label>Status</label><select id="clStatus"><option value="brak" ${cl.status=="brak"?"selected":""}>Brak wpłaty</option><option value="oplacone" ${cl.status=="oplacone"?"selected":""}>Wpłacono</option><option value="bezplatne" ${cl.status=="bezplatne"?"selected":""}>Bezpłatne</option></select>
 <div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="saveClass(${cid},${cl.id},${clid?1:0})">Zapisz</button></div>`) }
function saveClass(cid,id,exists){let ch=data.children.find(c=>c.id==cid),cl={id,type:clType.value,school:clSchool.value,day:clDay.value,time:clTime.value,price:+clPrice.value,discount:+clDisc.value,status:clStatus.value};if(exists)ch.classes[ch.classes.findIndex(x=>x.id==id)]=cl;else ch.classes.push(cl);save();closeModal();render()}
function confirmModal({title,message,confirmText="Usuń",cancelText="Anuluj",danger=true}){
 return new Promise(resolve=>{
  const existing=document.getElementById("confirmModal"); if(existing)existing.remove();
  const wrap=document.createElement("div"); wrap.id="confirmModal"; wrap.className="confirmOverlay";
  wrap.innerHTML=`<div class="confirmBox"><div class="confirmIcon ${danger?"dangerIcon":""}">${danger?"!":"?"}</div><h2>${title}</h2><p>${message}</p><div class="confirmActions"><button class="soft" data-no>${cancelText}</button><button class="${danger?"confirmDanger":"primary"}" data-yes>${confirmText}</button></div></div>`;
  const done=v=>{wrap.remove();resolve(v)};
  wrap.querySelector("[data-no]").onclick=()=>done(false); wrap.querySelector("[data-yes]").onclick=()=>done(true); wrap.onclick=e=>{if(e.target===wrap)done(false)}; document.body.appendChild(wrap);
 });
}
async function deleteClass(cid,id){let ch=data.children.find(c=>c.id==cid),cl=ch?.classes.find(x=>x.id==id);let ok=await confirmModal({title:"Usunąć zajęcia?",message:`${cl?cl.type+" • "+cl.day+" "+cl.time+". ":""}Tej operacji nie można cofnąć.`,confirmText:"Usuń zajęcia"});if(!ok)return;ch.classes=ch.classes.filter(x=>x.id!=id);save();render()}
function openChild(id){page="children";render();setTimeout(()=>editChild(id),0)}
function payments(){
 let paid=data.payments.reduce((s,p)=>s+Number(p.amount),0), due=data.children.reduce((s,c)=>s+childDue(c),0),inc=data.income.reduce((s,p)=>s+Number(p.amount),0);
 app.innerHTML=`<div class="eyebrow">FINANSE</div><h2 class="title">Wpłaty</h2><div class="summary"><div class="stat">Należne<b>${money(due)}</b></div><div class="stat">Wpłaty dzieci<b>${money(paid)}</b></div><div class="stat">Dodatkowe przychody<b>${money(inc)}</b></div><div class="stat">Razem wpływy<b>${money(paid+inc)}</b></div></div>
 <div class="card"><h2>Dodaj wpłatę</h2><div class="search"><input id="paySearch" placeholder="Szukaj dziecka..." oninput="payHints(this.value)"></div><div id="payHints"></div><button class="primary" onclick="addPayment()">+ Dodaj wpłatę ręcznie</button></div>
 <div class="card"><h2>Import wpłat ze screena</h2><p class="muted">Dodaj zrzut ekranu z aplikacji bankowej. Aplikacja sprawdzi kwotę względem należności i ostrzeże także przed powtórnym dodaniem tego samego przelewu.</p><div class="drop" onclick="screenInput.click()">📷<h3>Dodaj zrzut ekranu</h3><div>PNG lub JPG</div></div><button class="dark" onclick="screenInput.click()">📷 Rozpoznaj wpłaty ze screena</button><div id="ocrStatus"></div></div>
 <div class="card"><h2>Lista wpłat</h2>${data.payments.map(p=>{
   const ch=data.children.find(c=>Number(c.id)===Number(p.childId));
   const ps=ch?paymentState(ch,p.month):null;
   return `<div class="classrow"><b>${p.child}</b><div>${money(p.amount)} • ${p.month} • ${p.date||""}</div>${ps?`<div class="paymentBadgeText ${paymentStatusClass(ps.kind)}">${ps.label}</div>`:""}<button class="danger" onclick="deletePayment(${p.id})">Usuń</button></div>`;
 }).join("")||'<div class="muted">Brak wpłat.</div>'}</div>`}
function payHints(q){q=q.toLowerCase();payHints.innerHTML=data.children.filter(c=>(c.last+" "+c.first).toLowerCase().includes(q)&&q).map(c=>`<button class="soft" onclick="addPayment(${c.id})">${c.last} ${c.first}</button>`).join("")}
function addPayment(cid){let ch=data.children.find(c=>c.id==cid);modal(`<h2>Dodaj wpłatę</h2><label>Dziecko</label><select id="pChild">${data.children.map(c=>`<option value="${c.id}" ${c.id==cid?"selected":""}>${c.last} ${c.first}</option>`).join("")}</select><div class="grid2"><div><label>Miesiąc</label><select id="pMonth">${opt(months,"Wrzesień")}</select></div><div><label>Kwota</label><input id="pAmount" type="number"></div></div><label>Data</label><input id="pDate" type="date"><label>Tytuł / uwagi</label><input id="pNote"><div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="savePayment()">Zapisz</button></div>`)}
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
function income(){app.innerHTML=`<div class="eyebrow">FINANSE</div><h2 class="title">Dodatkowe przychody</h2><button class="primary" onclick="addIncome()">+ Dodaj przychód</button><div class="card">${data.income.map(i=>`<div class="classrow"><b>${i.title}</b><div>${money(i.amount)} • ${i.date}</div></div>`).join("")||"Brak dodatkowych przychodów."}</div>`}
function addIncome(){modal(`<h2>Dodaj przychód</h2><label>Tytuł</label><input id="iTitle"><label>Kwota</label><input id="iAmount" type="number"><label>Data</label><input id="iDate" type="date"><div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="data.income.push({id:Date.now(),title:iTitle.value,amount:+iAmount.value,date:iDate.value});save();closeModal();render()">Zapisz</button></div>`)}
function groups(){app.innerHTML=`<div class="eyebrow">ZAJĘCIA</div><h2 class="title">Grupy i listy</h2><div class="card"><label>Szkoła</label><select id="gSchool" onchange="groupList()">${opt(schools,schools[0])}</select><label>Dzień</label><select id="gDay" onchange="groupList()">${opt(days,"Wtorek")}</select><label>Godzina</label><select id="gTime" onchange="groupList()">${opt(times,"15:00")}</select><div class="actions"><button class="dark" onclick="window.print()">Drukuj listę wyselekcjonowanych nazwisk</button></div></div><div id="gList"></div>`;groupList()}
function groupList(){let s=gSchool.value,d=gDay.value,t=gTime.value,arr=[];data.children.forEach(c=>c.classes.forEach(cl=>{if(cl.school==s&&cl.day==d&&cl.time==t)arr.push({c,cl})}));gList.innerHTML=arr.map(x=>`<div class="card"><b class="name">${x.c.last} ${x.c.first}</b><div class="muted">${x.c.class} • świetlica: ${x.c.club} • ${x.cl.type} • ${x.cl.day} ${x.cl.time}</div></div>`).join("")||'<div class="card">Brak dzieci dla wybranych filtrów.</div>'}
function reports(){app.innerHTML=`<div class="eyebrow">RAPORTY</div><h2 class="title">Raporty</h2><div class="card"><button class="dark" onclick="window.print()">Drukuj bieżący widok</button><p class="muted">Dane są zapisane lokalnie w tej przeglądarce.</p></div>`}
function lists(){app.innerHTML=`<div class="eyebrow">USTAWIENIA</div><h2 class="title">Listy</h2><div class="card"><h3>Wersja programu</h3><b>5.1</b><p class="muted">Szkoły: ${schools.join(", ")}<br>Zajęcia: ${workshops.join(", ")}</p><button class="danger" onclick="if(confirm('Przywrócić dane demonstracyjne?')){localStorage.removeItem('rw44');location.reload()}">Reset demo</button></div>`}
function signups(){
 app.innerHTML=`<div class="eyebrow">ZGŁOSZENIA</div><h2 class="title">Zapisy</h2>
 <div class="card"><h2>Import formularza zapisu</h2>
 <p class="muted">Wczytaj plik CSV wyeksportowany z formularza WordPress / Fluent Forms. Dane nie zostaną dodane automatycznie — najpierw zobaczysz je do sprawdzenia i poprawy.</p>
 <div class="drop" onclick="signupCsvInput.click()">📄<h3>Wybierz plik CSV</h3><div>Format jak w eksporcie formularza zapisu dziecka</div></div>
 <button class="dark" onclick="signupCsvInput.click()">Importuj zgłoszenia z CSV</button></div>
 <div class="card"><h2>Ostatnio dodane zgłoszenia</h2><div class="muted">Po zaakceptowaniu formularza dziecko trafia do zakładki Dzieci razem z danymi rodzica i wybranymi zajęciami.</div></div>`
}
function parseCSV(text){
 const rows=[]; let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
   const ch=text[i],next=text[i+1];
   if(ch==='"'){
     if(quoted&&next==='"'){cell+='"';i++;}
     else quoted=!quoted;
   }else if(ch===','&&!quoted){row.push(cell);cell='';}
   else if((ch==='\n'||ch==='\r')&&!quoted){
     if(ch==='\r'&&next==='\n')i++;
     row.push(cell);cell='';
     if(row.some(x=>String(x).trim()!==''))rows.push(row);
     row=[];
   }else cell+=ch;
 }
 row.push(cell); if(row.some(x=>String(x).trim()!==''))rows.push(row);
 if(!rows.length)return [];
 const headers=rows.shift().map(x=>String(x).trim());
 return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
}
function signupVal(obj,names){
 for(const n of names){if(obj[n]!==undefined&&String(obj[n]).trim()!=='')return String(obj[n]).trim()}
 return '';
}
function splitPersonName(full){
 const p=String(full||'').trim().split(/\s+/).filter(Boolean);
 if(p.length<=1)return {first:p[0]||'',last:''};
 return {first:p.slice(0,-1).join(' '),last:p[p.length-1]};
}
function normalizeSchool(v){
 const x=String(v||'').trim().toLowerCase().replace(/\s+/g,'');
 if(x==='sp162'||x==='162')return 'SP 162';
 if(x==='zsp17'||x==='17')return 'ZSP 17';
 return String(v||'').trim()||schools[0];
}
function signupRecord(row,index){
 const childName=splitPersonName(signupVal(row,['Imię i nazwisko dziecka']));
 const types=[signupVal(row,['Rodzaj zajęć']),signupVal(row,['Rodzaj zajęć.1'])].filter(Boolean);
 const daysSel=[signupVal(row,['Które dni odpowiadają Państwu najbardziej?']),signupVal(row,['Które dni odpowiadają Państwu najbardziej?.1'])].filter(Boolean);
 return {
  importIndex:index,entryId:signupVal(row,['entry_id']),createdAt:signupVal(row,['created_at']),entryStatus:signupVal(row,['entry_status']),
  first:childName.first,last:childName.last,sex:'Dziewczynka',school:normalizeSchool(signupVal(row,['Szkoła'])),className:signupVal(row,['Klasa']),club:'Tak',
  parent:signupVal(row,['Imię i nazwisko rodzica / opiekuna']),phone:signupVal(row,['Numer telefonu rodzica / opiekuna']),email:signupVal(row,['Adres e-mail rodzica / opiekuna']),notes:signupVal(row,['Uwagi']),
  rules:signupVal(row,['Regulamin zajęć']),personal:signupVal(row,['Dane osobowe']),imageConsent:signupVal(row,['Zgoda na wizerunek']),
  types,days:daysSel
 };
}
function signupSchoolOptions(value){
 const all=[...new Set([...schools,value].filter(Boolean))];
 return all.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('');
}
function signupWorkshopOptions(value){
 const all=[...new Set([...workshops,value].filter(Boolean))];
 return all.map(x=>`<option ${x===value?'selected':''}>${x}</option>`).join('');
}
function signupDayOptions(value){
 const nice=value?value.charAt(0).toUpperCase()+value.slice(1).toLowerCase():days[0];
 const all=[...new Set([...days,nice].filter(Boolean))];
 return all.map(x=>`<option ${x===nice?'selected':''}>${x}</option>`).join('');
}
function showSignupReview(items,fileName){
 window.__signupItems=items;
 if(!items.length){modal(`<h2>Brak zgłoszeń</h2><p>Nie znalazłem danych w pliku ${fileName}.</p><button class="soft" onclick="closeModal()">Zamknij</button>`);return}
 modal(`<h2>Sprawdź zgłoszenia przed dodaniem</h2><div class="notice">Plik: <b>${fileName}</b> • znaleziono <b>${items.length}</b> zgłoszeń. Możesz poprawić każde pole przed akceptacją.</div>
 <div id="signupReview">${items.map((r,i)=>`<div class="signupReviewCard" id="signupCard${i}">
  <h3>${r.last} ${r.first}</h3>${r.entryId?`<div class="muted">ID formularza: ${r.entryId} • ${r.createdAt||''}</div>`:''}
  <div class="grid2"><div><label>Nazwisko</label><input id="suLast${i}" value="${escapeAttr(r.last)}"></div><div><label>Imię</label><input id="suFirst${i}" value="${escapeAttr(r.first)}"></div></div>
  <div class="grid2"><div><label>Płeć</label><select id="suSex${i}">${opt(['Dziewczynka','Chłopiec'],r.sex)}</select></div><div><label>Klasa</label><input id="suClass${i}" value="${escapeAttr(r.className)}"></div></div>
  <label>Szkoła</label><select id="suSchool${i}">${signupSchoolOptions(r.school)}</select>
  <label>Świetlica</label><select id="suClub${i}">${opt(['Tak','Nie'],r.club)}</select>
  ${[0,1].map(k=>`<div class="signupWorkshop"><div class="grid2"><div><label>${k===0?'Rodzaj zajęć':'Drugie zajęcia'}</label><select id="suType${i}_${k}"><option value="">— brak —</option>${signupWorkshopOptions(r.types[k]||'')}</select></div><div><label>Dzień preferowany</label><select id="suDay${i}_${k}"><option value="">— wybierz później —</option>${signupDayOptions(r.days[k]||r.days[0]||'')}</select></div></div><label>Godzina</label><select id="suTime${i}_${k}"><option value="">— ustal później —</option>${times.map(t=>`<option>${t}</option>`).join('')}</select></div>`).join('')}
  <label>Rodzic / opiekun</label><input id="suParent${i}" value="${escapeAttr(r.parent)}"><label>Telefon</label><input id="suPhone${i}" value="${escapeAttr(r.phone)}"><label>E-mail</label><input id="suEmail${i}" value="${escapeAttr(r.email)}"><label>Uwagi</label><textarea id="suNotes${i}">${escapeHtml(r.notes)}</textarea>
  <div class="consentLine">Regulamin: <b>${escapeHtml(r.rules||'brak')}</b> • Dane osobowe: <b>${escapeHtml(r.personal||'brak')}</b> • Wizerunek: <b>${escapeHtml(r.imageConsent||'brak')}</b></div>
  <div id="suInfo${i}"></div><div class="actions"><button class="primary" onclick="acceptSignup(${i})">✓ Akceptuję i dodaję dziecko</button><button class="soft" onclick="skipSignup(${i})">Pomiń</button></div>
 </div>`).join('')}</div><div class="actions"><button class="soft" onclick="closeModal()">Zamknij</button></div>`);
}
function escapeAttr(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function escapeHtml(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

function existingChildDialog(existing){
 return new Promise(resolve=>{
  const old=document.getElementById('existingChildDialog');if(old)old.remove();
  const wrap=document.createElement('div');
  wrap.id='existingChildDialog';wrap.className='confirmOverlay';
  wrap.innerHTML=`<div class="confirmBox existingChildBox">
   <div class="confirmIcon">?</div>
   <h2>Dziecko już istnieje</h2>
   <p><b>${escapeHtml(existing.last)} ${escapeHtml(existing.first)}</b> jest już w bazie.</p>
   <p>To może być zapis na kolejne warsztaty. Co chcesz zrobić?</p>
   <div class="existingChildActions">
    <button class="primary" data-action="add">+ Dodaj nowe zajęcia do tego dziecka</button>
    <button class="soft" data-action="edit">Wróć i popraw zgłoszenie</button>
    <button class="soft" data-action="cancel">Pomiń zgłoszenie</button>
   </div>
  </div>`;
  const done=v=>{wrap.remove();resolve(v)};
  wrap.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>done(b.dataset.action));
  wrap.onclick=e=>{if(e.target===wrap)done('edit')};
  document.body.appendChild(wrap);
 });
}
function signupClassesFromForm(i,child,existingCount=0){
 const result=[];
 for(let k=0;k<2;k++){
  const type=document.querySelector(`#suType${i}_${k}`).value;
  if(!type)continue;
  const day=document.querySelector(`#suDay${i}_${k}`).value||days[0];
  const time=document.querySelector(`#suTime${i}_${k}`).value||'';
  result.push({
   id:Date.now()+i*10+k,
   type,day,time,school:document.querySelector(`#suSchool${i}`).value,
   price:0,
   discount:(existingCount+result.length)>=1?10:0,
   status:'brak'
  });
 }
 return result;
}
function classLooksSame(a,b){
 return String(a.type||'').toLowerCase()===String(b.type||'').toLowerCase()
   && String(a.day||'').toLowerCase()===String(b.day||'').toLowerCase()
   && String(a.school||'').toLowerCase()===String(b.school||'').toLowerCase()
   && (!a.time || !b.time || String(a.time)===String(b.time));
}
function addSignupClassesToExisting(existing,i,src){
 const proposed=signupClassesFromForm(i,existing,existing.classes?.length||0);
 if(!proposed.length)return {added:0,duplicates:0};
 existing.classes=existing.classes||[];
 let added=0,duplicates=0;
 proposed.forEach(cl=>{
  if(existing.classes.some(old=>classLooksSame(old,cl))){duplicates++;return}
  existing.classes.push(cl);added++;
 });
 // zachowujemy główny profil dziecka, ale uzupełniamy brakujące dane kontaktowe z nowego zgłoszenia
 const values={
  parent:document.querySelector(`#suParent${i}`).value.trim(),
  phone:document.querySelector(`#suPhone${i}`).value.trim(),
  email:document.querySelector(`#suEmail${i}`).value.trim(),
  notes:document.querySelector(`#suNotes${i}`).value.trim()
 };
 ['parent','phone','email','notes'].forEach(k=>{if(!existing[k]&&values[k])existing[k]=values[k]});
 existing.lastSignupEntryId=src.entryId||'';
 existing.lastSignupCreatedAt=src.createdAt||'';
 return {added,duplicates};
}

function signupAlreadyExists(entryId,first,last){
 return data.children.find(c=>(entryId&&String(c.sourceEntryId||'')===String(entryId))||((c.first||'').toLowerCase()===String(first||'').toLowerCase()&&(c.last||'').toLowerCase()===String(last||'').toLowerCase()));
}
async function acceptSignup(i){
 const src=window.__signupItems?.[i]||{};
 const first=document.querySelector(`#suFirst${i}`).value.trim(),last=document.querySelector(`#suLast${i}`).value.trim();
 const info=document.querySelector(`#suInfo${i}`);
 if(!first||!last){info.className='ocrWarn';info.textContent='Uzupełnij imię i nazwisko dziecka.';return}

 const existing=signupAlreadyExists(src.entryId,first,last);
 if(existing){
  const action=await existingChildDialog(existing);
  if(action==='edit'){
   info.className='ocrWarn';
   info.textContent='Dane nie zostały zapisane. Możesz poprawić zgłoszenie i spróbować ponownie.';
   return;
  }
  if(action==='cancel'){
   skipSignup(i);
   return;
  }
  if(action==='add'){
   const result=addSignupClassesToExisting(existing,i,src);
   if(result.added===0){
    info.className='ocrWarn';
    info.textContent=result.duplicates
      ?'Te zajęcia wyglądają na już zapisane przy tym dziecku. Niczego nie dodałem.'
      :'W zgłoszeniu nie wybrano nowych zajęć do dodania.';
    return;
   }
   save();
   const card=document.querySelector(`#signupCard${i}`);
   card.classList.add('ocrAccepted');
   card.querySelectorAll('input,select,textarea,button').forEach(x=>x.disabled=true);
   info.className='ocrOk';
   info.textContent=`✓ Dodano ${result.added} ${result.added===1?'nowe zajęcia':'nowe zajęcia'} do istniejącego dziecka${result.duplicates?`. Pominięto ${result.duplicates} duplikat.`:''}`;
   return;
  }
 }

 const child={id:Date.now()+i,last,first,sex:document.querySelector(`#suSex${i}`).value,class:document.querySelector(`#suClass${i}`).value.trim(),school:document.querySelector(`#suSchool${i}`).value,club:document.querySelector(`#suClub${i}`).value,parent:document.querySelector(`#suParent${i}`).value.trim(),phone:document.querySelector(`#suPhone${i}`).value.trim(),email:document.querySelector(`#suEmail${i}`).value.trim(),notes:document.querySelector(`#suNotes${i}`).value.trim(),sourceEntryId:src.entryId||'',sourceCreatedAt:src.createdAt||'',consents:{rules:src.rules||'',personal:src.personal||'',image:src.imageConsent||''},classes:[]};
 child.classes=signupClassesFromForm(i,child,0);
 data.children.push(child);save();
 const card=document.querySelector(`#signupCard${i}`);card.classList.add('ocrAccepted');card.querySelectorAll('input,select,textarea,button').forEach(x=>x.disabled=true);
 info.className='ocrOk';info.textContent='✓ Dziecko zostało dodane do bazy. Ceny i godzinę możesz ustawić później w zakładce Dzieci.';
}
function skipSignup(i){const card=document.querySelector(`#signupCard${i}`);if(card){card.classList.add('ocrAccepted');card.querySelectorAll('input,select,textarea,button').forEach(x=>x.disabled=true)} }
signupCsvInput.onchange=async e=>{
 const f=e.target.files[0];if(!f)return;
 try{
  const text=await f.text();
  const rows=parseCSV(text);const items=rows.map(signupRecord);
  showSignupReview(items,f.name);
 }catch(err){modal(`<h2>Błąd importu CSV</h2><p>${escapeHtml(err.message||err)}</p><button class="soft" onclick="closeModal()">Zamknij</button>`)}
 finally{e.target.value=''}
};
backupBtn.onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rozliczenia-kopia-v51.json";a.click()}
render();
