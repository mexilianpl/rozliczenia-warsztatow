/* =========================================================
   lists.js — Rozliczenia Warsztatów v10.9
   Wydzielone z app.js: Listy, wydruki, eksport i szybka obecność.
   Ulepszenia zaległości nadal są nakładane przez income.js.
   ========================================================= */
"use strict";

function listFilteredChildren(){
 const sf=document.querySelector("#lSchool")?.value||"__ALL__";
 const wf=document.querySelector("#lWorkshop")?.value||"";
 const df=document.querySelector("#lDay")?.value||"";
 const tf=document.querySelector("#lTime")?.value||"";
 let arr=data.children.filter(c=>{
  const schoolOk=sf==="__ALL__"||c.school===sf||(c.classes||[]).some(cl=>cl.school===sf);
  if(!schoolOk)return false;
  if(!wf&&!df&&!tf)return true;
  return (c.classes||[]).some(cl=>(!wf||cl.type===wf)&&(!df||cl.day===df)&&(!tf||cl.time===tf)&&(sf==="__ALL__"||cl.school===sf||c.school===sf));
 });
 return arr.sort((a,b)=>pickupSortValue(a)-pickupSortValue(b)||(a.last+" "+a.first).localeCompare(b.last+" "+b.first,"pl"));
}

function listRowsBase(type){
 const arr=listFilteredChildren(),month=currentMonthName();
 if(type==="children")return {title:"Lista dzieci",headers:["Dziecko","Klasa","Szkoła","Sala / odbiór"],rows:arr.map(c=>[`${c.last} ${c.first}`,c.class||"",c.school||"",c.pickupPlace||""])};
 if(type==="attendance")return {title:"Lista obecności",headers:["Lp.","Dziecko","Klasa","Sala / odbiór","Obecny","Nieobecny","Uwagi"],rows:arr.map((c,i)=>[i+1,`${c.last} ${c.first}`,c.class||"",c.pickupPlace||"","","",""])};
 if(type==="attendanceReport")return {title:"Raport frekwencji",headers:["Lp.","Dziecko","Klasa","Zajęcia","Obecności","Nieobecności","Frekwencja","Daty nieobecności"],rows:arr.map((c,i)=>{const a=attendanceSummary(c.id);return [i+1,`${c.last} ${c.first}`,c.class||"",a.total,a.present,a.absent,a.total?`${a.pct}%`:"—",a.h.filter(x=>x.status==="absent").map(x=>attendanceDatePL(x.date)).join(", ")]})};
 if(type==="pickup")return {title:"Lista odbioru dzieci",headers:["Lp.","Sala / odbiór","Dziecko","Klasa"],rows:arr.map((c,i)=>[i+1,c.pickupPlace||"Nieustalone",`${c.last} ${c.first}`,c.class||""])};
 if(type==="contacts")return {title:"Lista kontaktowa",headers:["Imię i nazwisko dziecka","Imię i nazwisko rodzica / opiekuna","Telefon","E-mail","Sala / odbiór"],rows:arr.map(c=>[`${c.last} ${c.first}`,c.parent||"",c.phone||"",c.email||"",c.pickupPlace||""])};
 if(type==="arrears"){
   const rows=arr.map(c=>{const ps=paymentState(c,month);return ["unpaid","partial"].includes(ps.kind)?[`${c.last} ${c.first}`,c.school||"",money(ps.due),money(ps.paid),money(ps.missing),ps.label]:null}).filter(Boolean);
   return {title:`Lista zaległości — ${month}`,headers:["Dziecko","Szkoła","Należne","Wpłacono","Brakuje","Status"],rows};
 }
 if(type==="consents")return {title:"Lista zgód",headers:["Imię i nazwisko dziecka","Zgoda na wizerunek","Zgoda na przetwarzanie danych osobowych","Akceptacja regulaminu"],rows:arr.map(c=>[`${c.last} ${c.first}`,consentLabel(c.consents?.image)||"brak danych",consentLabel(c.consents?.personal)||"brak danych",consentLabel(c.consents?.rules)||"brak danych"])};
 if(type==="free"){
   const f=arr.filter(c=>(c.classes||[]).some(cl=>cl.status==="bezplatne"));
   return {title:"Lista dzieci bezpłatnych",headers:["Dziecko","Szkoła","Warsztaty"],rows:f.map(c=>[`${c.last} ${c.first}`,c.school||"",(c.classes||[]).filter(cl=>cl.status==="bezplatne").map(cl=>cl.type).join(", ")])};
 }
 if(type==="workshops"){
   const rows=[];
   arr.forEach(c=>(c.classes||[]).forEach(cl=>{
     const sf=document.querySelector("#lSchool")?.value||"__ALL__",wf=document.querySelector("#lWorkshop")?.value||"",df=document.querySelector("#lDay")?.value||"",tf=document.querySelector("#lTime")?.value||"";
     if((sf==="__ALL__"||cl.school===sf||c.school===sf)&&(!wf||cl.type===wf)&&(!df||cl.day===df)&&(!tf||cl.time===tf))
       rows.push([`${c.last} ${c.first}`,c.class||"",cl.school||c.school||"",cl.type||"",cl.day||"",cl.time||"",c.pickupPlace||""]);
   }));
   return {title:"Lista zapisów na warsztaty",headers:["Dziecko","Klasa","Szkoła","Warsztaty","Dzień","Godzina","Sala / odbiór"],rows};
 }
 return {title:"Lista",headers:[],rows:[]};
}

function lists(){
 app.innerHTML=`<div class="eyebrow">WYDRUKI I ZESTAWIENIA</div><h2 class="title">Listy</h2><div class="notice listsIntro">Tutaj znajdziesz wszystkie listy robocze, wydruki i eksporty do Excel.</div>
 <div class="card">
  <div class="grid2"><div><label>Szkoła</label><select id="lSchool" onchange="if(this.value!=='__ALL__')updateScheduleSelects('lSchool','lDay','lTime');refreshListPreview()"><option value="__ALL__">Wszystkie szkoły</option>${schools.map(s=>`<option>${s}</option>`).join("")}</select></div>
  <div><label>Rodzaj listy</label><select id="lType" onchange="refreshListPreview()">
   <option value="children">Lista dzieci</option><option value="attendance">Lista obecności — na zajęcia</option><option value="attendanceReport">Raport frekwencji</option><option value="pickup">Lista odbioru dzieci</option>
   <option value="contacts">Lista kontaktowa</option><option value="arrears">Lista zaległości</option><option value="consents">Lista zgód</option>
   <option value="free">Lista dzieci bezpłatnych</option><option value="workshops">Lista zapisów na warsztaty</option>
  </select></div></div>
  <label>Warsztaty</label><select id="lWorkshop" onchange="refreshListPreview()"><option value="">Wszystkie warsztaty</option>${workshops.map(w=>`<option>${w}</option>`).join("")}</select>
  <div class="grid2"><div><label>Dzień</label><select id="lDay" onchange="if(document.getElementById('lSchool')?.value!=='__ALL__')updateTimeSelect('lSchool','lDay','lTime');refreshListPreview()"><option value="">Wszystkie dni</option>${days.map(d=>`<option>${d}</option>`).join("")}</select></div>
  <div><label>Godzina</label><select id="lTime" onchange="refreshListPreview()"><option value="">Wszystkie godziny</option>${times.map(t=>`<option>${t}</option>`).join("")}</select></div></div>
  <div class="actions"><button class="dark" onclick="printSelectedList()">🖨 Drukuj</button><button class="primary" onclick="exportSelectedListExcel()">⬇ Excel</button></div>
 </div>
 <div id="listPreview"></div><div id="listInteractiveHost"></div>`;
 refreshListPreview();
}

function listPreviewCell(type,index,value){
 const text=String(value??"");
 if(type==="consents" && index>0){
   const n=text.trim().toLowerCase();
   if(n==="tak" || n==="zgoda" || n==="zaakceptowano")return `<span class="consentStatus consentYes">${text}</span>`;
   if(n==="nie" || n==="brak zgody" || n==="odmowa")return `<span class="consentStatus consentNo">${text}</span>`;
   return `<span class="consentStatus consentUnknown">${text}</span>`;
 }
 return text;
}

function refreshListPreview(){
 const type=document.querySelector("#lType")?.value||"children";
 const d=listRows(type);
 document.querySelector("#listPreview").innerHTML=`<div class="card"><h2>${d.title}</h2><div class="muted">Pozycji: <b>${d.rows.length}</b></div>
 ${d.rows.slice(0,30).map(r=>`<div class="listPreviewRow ${type==="consents"?"consentPreviewRow":""}">${r.slice(0,4).map((x,i)=>`<span>${listPreviewCell(type,i,x)}</span>`).join("")}</div>`).join("")||'<div class="muted">Brak danych dla wybranych filtrów.</div>'}
 ${d.rows.length>30?`<div class="muted">Podgląd pierwszych 30 pozycji.</div>`:""}</div>`;
 const activeType=document.getElementById("lType")?.value||"";
 injectInteractiveList(activeType);
}

function printSelectedList(){
 const d=listRows(document.querySelector("#lType").value);printSimpleStandalone(d.title,d.headers,d.rows);
}

function printSimpleStandalone(title,headers,rows){
 if(!rows.length){confirmModal({title:"Brak danych",message:"Brak pozycji dla wybranych filtrów.",confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 const win=window.open("","_blank");
 win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aaa;padding:8px;text-align:left}th{background:#f2f4f7}@media print{button{display:none}}</style></head><body><h1>${title}</h1><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table><button onclick="window.print()">Drukuj</button></body></html>`);
 win.document.close();setTimeout(()=>win.print(),250)
}

function exportSelectedListExcel(){
 if(typeof XLSX==="undefined"){confirmModal({title:"Excel niedostępny",message:"Sprawdź internet i odśwież stronę.",confirmText:"OK",cancelText:"Zamknij",danger:false});return}
 const d=listRows(document.querySelector("#lType").value);
 const rows=d.rows.map(r=>Object.fromEntries(d.headers.map((h,i)=>[h,r[i]??""])));
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?rows:[{"Brak danych":""}]),"Lista");
 XLSX.writeFile(wb,`${d.title.toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/gi,"-")}.xlsx`);
}

function listSelectedMonth(){
 const m=document.getElementById("lMonth")?.value;
 return months.includes(m)?m:(months.includes(currentMonthName())?currentMonthName():"Wrzesień");
}

function listAttendanceDate(){
 return document.getElementById("lAttendanceDate")?.value||new Date().toISOString().slice(0,10);
}

function listAttendanceKey(c){
 const school=document.getElementById("lSchool")?.value||"",day=document.getElementById("lDay")?.value||"",time=document.getElementById("lTime")?.value||"",workshop=document.getElementById("lWorkshop")?.value||"";
 return `${listAttendanceDate()}|${school}|${day}|${time}|${workshop}`;
}

function setQuickAttendance(cid,status,btn){
 const c=data.children.find(x=>x.id==cid);if(!c)return;
 const key=listAttendanceKey(c);
 data.attendance[key]=data.attendance[key]||{};
 data.attendance[key][c.id]=status;
 logHistory(c.id,`${status==="present"?"Obecność":"Nieobecność"} — ${listAttendanceDate()}.`);
 save();
 const row=btn.closest(".interactiveListRow");
 row?.querySelectorAll(".quickAttendBtn").forEach(b=>b.classList.remove("selectedPresent","selectedAbsent"));
 btn.classList.add(status==="present"?"selectedPresent":"selectedAbsent");
}

function interactiveListPanel(type){
 const arr=listFilteredChildren();
 if(type==="arrears"){
   const month=listSelectedMonth();
   let debtors=arr.map(c=>({c,ps:paymentState(c,month)})).filter(x=>["unpaid","partial"].includes(x.ps.kind));
   if(window.dashboardArrearsMode==="partial")debtors=debtors.filter(x=>x.ps.kind==="partial");
   return `<div class="card interactiveListCard"><h2>Zaległości — szybkie działania</h2>
    <div class="muted interactiveListInfo">${month} • ${debtors.length} ${debtors.length===1?"osoba":"osób"} z zaległością</div>
    ${debtors.length?debtors.map(({c,ps})=>`<div class="interactiveListRow">
      <div class="interactiveMain"><b>${c.last} ${c.first}</b><span>${c.school||""}${c.class?` • ${c.class}`:""} • tel. ${c.phone||"brak"}</span></div>
      <div class="interactiveDebt"><span>Brakuje</span><b>${money(ps.missing)}</b></div>
      <div class="interactiveActions"><button class="smsBtn" onclick="sendReminderSMS(${c.id},'${month}')">💬 Wyślij SMS</button><button class="soft" onclick="copyReminder(${c.id},'${month}')">Kopiuj tekst</button><button class="soft" onclick="editChild(${c.id})">Profil</button></div>
    </div>`).join(""):'<div class="emptyInteractive">Brak zaległości dla wybranych filtrów 🎉</div>'}
   </div>`;
 }
 if(type==="attendance"){
   const date=listAttendanceDate();
   return `<div class="card interactiveListCard"><div class="interactiveHeader"><div><h2>Lista obecności — szybkie zaznaczanie</h2><div class="muted">Kliknij „Obecny” przy dziecku. Zapis następuje od razu.</div></div>
    <div><label>Data zajęć</label><input id="lAttendanceDate" type="date" value="${date}" onchange="refreshListPreview()"></div></div>
    ${arr.length?arr.map(c=>{
      const rec=data.attendance[listAttendanceKey(c)]||{},st=rec?.[c.id]||rec?.[String(c.id)]||"";
      return `<div class="interactiveListRow attendanceInteractiveRow">
       <div class="interactiveMain"><b>${c.last} ${c.first}</b><span>${c.class||""}${c.pickupPlace?` • ${c.pickupPlace}`:""}</span></div>
       <div class="interactiveActions attendanceButtons"><button class="quickAttendBtn ${st==="present"?"selectedPresent":""}" onclick="setQuickAttendance(${c.id},'present',this)">✓ Obecny</button><button class="quickAttendBtn absent ${st==="absent"?"selectedAbsent":""}" onclick="setQuickAttendance(${c.id},'absent',this)">Nieobecny</button></div>
      </div>`}).join(""):'<div class="emptyInteractive">Brak dzieci dla wybranych filtrów.</div>'}
   </div>`;
 }
 return "";
}

function injectInteractiveList(type){
 const host=document.getElementById("listInteractiveHost");
 if(host)host.innerHTML=interactiveListPanel(type);
}

function listRows(type){
 const result=listRowsBase(type);
 if(type==="arrears"){
   const month=currentMonthName(),arr=listFilteredChildren();
   result.headers=["Dziecko","Telefon","Szkoła","Należne","Wpłacono","Brakuje","Status"];
   result.rows=arr.map(c=>{const ps=paymentState(c,months.includes(month)?month:"Wrzesień");return ["unpaid","partial"].includes(ps.kind)?[`${c.last} ${c.first}`,c.phone||"",c.school||"",money(ps.due),money(ps.paid),money(ps.missing),ps.label]:null}).filter(Boolean);
 }
 return result;
}

window.RWModules=window.RWModules||{};
window.RWModules.lists={version:"11.4"};
