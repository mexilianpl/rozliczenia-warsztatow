
const VERSION="4.4";
const months=["Wrzesień","Październik","Listopad","Grudzień","Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec"];
const schools=["SP 162","ZSP 17"];
const workshops=["Rękodzieło","Zaawansowane","Artystyczne"];
const days=["Poniedziałek","Wtorek","Środa","Czwartek","Piątek"];
const times=["13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
let data=JSON.parse(localStorage.getItem("rw44")||"null")||{
 children:[
 {id:1,last:"Kolasa",first:"Nikola",sex:"Dziewczynka",class:"4A",school:"SP 162",club:"Tak",parent:"Łukasz Kolasa",phone:"50340488",email:"mexilianpl@gmail.com",classes:[
  {id:11,type:"Rękodzieło",day:"Wtorek",time:"15:00",school:"SP 162",price:155,discount:0,status:"brak"},
  {id:12,type:"Zaawansowane",day:"Środa",time:"15:30",school:"SP 162",price:165,discount:10,status:"brak"}]},
 {id:2,last:"Kowalski",first:"Jan",sex:"Chłopiec",class:"5A",school:"ZSP 17",club:"Nie",parent:"",phone:"",email:"",classes:[{id:21,type:"Rękodzieło",day:"Wtorek",time:"15:30",school:"ZSP 17",price:155,discount:0,status:"brak"}]},
 {id:3,last:"Nowak",first:"Maja",sex:"Dziewczynka",class:"3B",school:"SP 162",club:"Tak",parent:"",phone:"",email:"",classes:[{id:31,type:"Artystyczne",day:"Wtorek",time:"15:30",school:"SP 162",price:155,discount:100,status:"bezplatne"}]}
 ],payments:[],income:[]};
let page="start"; const app=document.querySelector("#app"), nav=document.querySelector("#nav");
function save(){localStorage.setItem("rw44",JSON.stringify(data))}
function money(v){return Number(v||0).toLocaleString("pl-PL",{minimumFractionDigits:2,maximumFractionDigits:2})+" zł"}
function dueClass(c){return c.status==="bezplatne"?0:Math.max(0,c.price*(1-(c.discount||0)/100))}
function childDue(ch){return ch.classes.reduce((s,c)=>s+dueClass(c),0)}
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
function filterChildren(){let q=(document.querySelector("#cs")?.value||"").toLowerCase(),sf=document.querySelector("#schoolFilter")?.value; let arr=data.children.filter(c=>(c.last+" "+c.first).toLowerCase().includes(q)&&(sf=="Wszystkie szkoły"||c.school==sf));document.querySelector("#childrenList").innerHTML=arr.map(childCard).join("")}
function childCard(c){return `<div class="card"><div class="childhead"><div><div class="name">${c.last} ${c.first}</div><div class="muted">${c.class} • ${c.school} • świetlica: ${c.club} • ${c.sex}</div><div class="due">Do zapłaty: ${money(childDue(c))}</div></div><button class="soft" onclick="editChild(${c.id})">Profil</button></div>
 ${c.classes.map(cl=>`<div class="classrow"><span class="status ${cl.status=="oplacone"?"paid":cl.status=="bezplatne"?"free":"unpaid"}">${cl.status=="oplacone"?"WPŁACONO":cl.status=="bezplatne"?"BEZPŁATNE":"BRAK WPŁATY"}</span><h3>${cl.type}</h3><div class="muted">${cl.day} ${cl.time} • ${cl.school}</div><div class="muted">Cena ${money(dueClass(cl))}${cl.discount?` • rabat ${cl.discount}%`:""}</div><div class="actions"><button class="soft" onclick="editClass(${c.id},${cl.id})">Edytuj zajęcia</button><button class="danger" onclick="deleteClass(${c.id},${cl.id})">Usuń zajęcia</button></div></div>`).join("")}
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
function deleteClass(cid,id){if(!confirm("Usunąć te zajęcia? Tej operacji nie można cofnąć."))return;let ch=data.children.find(c=>c.id==cid);ch.classes=ch.classes.filter(x=>x.id!=id);save();render()}
function openChild(id){page="children";render();setTimeout(()=>editChild(id),0)}
function payments(){let paid=data.payments.reduce((s,p)=>s+Number(p.amount),0), due=data.children.reduce((s,c)=>s+childDue(c),0),inc=data.income.reduce((s,p)=>s+Number(p.amount),0);
 app.innerHTML=`<div class="eyebrow">FINANSE</div><h2 class="title">Wpłaty</h2><div class="summary"><div class="stat">Należne<b>${money(due)}</b></div><div class="stat">Wpłaty dzieci<b>${money(paid)}</b></div><div class="stat">Dodatkowe przychody<b>${money(inc)}</b></div><div class="stat">Razem wpływy<b>${money(paid+inc)}</b></div></div>
 <div class="card"><h2>Dodaj wpłatę</h2><div class="search"><input id="paySearch" placeholder="Szukaj dziecka..." oninput="payHints(this.value)"></div><div id="payHints"></div><button class="primary" onclick="addPayment()">+ Dodaj wpłatę ręcznie</button></div>
 <div class="card"><h2>Import wpłat ze screena</h2><p class="muted">Dodaj zrzut ekranu z aplikacji bankowej. W wersji GitHub Pages obraz jest analizowany lokalnie tylko jako plik do ręcznej weryfikacji — bez wysyłania danych na serwer.</p><div class="drop" onclick="screenInput.click()">📷<h3>Dodaj zrzut ekranu</h3><div>PNG, JPG, HEIC</div></div><button class="dark" onclick="screenInput.click()">Import wpłat ze screena</button></div>
 <div class="card"><h2>Lista wpłat</h2>${data.payments.map(p=>`<div class="classrow"><b>${p.child}</b><div>${money(p.amount)} • ${p.month} • ${p.date||""}</div><button class="danger" onclick="deletePayment(${p.id})">Usuń</button></div>`).join("")||'<div class="muted">Brak wpłat.</div>'}</div>`}
function payHints(q){q=q.toLowerCase();payHints.innerHTML=data.children.filter(c=>(c.last+" "+c.first).toLowerCase().includes(q)&&q).map(c=>`<button class="soft" onclick="addPayment(${c.id})">${c.last} ${c.first}</button>`).join("")}
function addPayment(cid){let ch=data.children.find(c=>c.id==cid);modal(`<h2>Dodaj wpłatę</h2><label>Dziecko</label><select id="pChild">${data.children.map(c=>`<option value="${c.id}" ${c.id==cid?"selected":""}>${c.last} ${c.first}</option>`).join("")}</select><div class="grid2"><div><label>Miesiąc</label><select id="pMonth">${opt(months,"Wrzesień")}</select></div><div><label>Kwota</label><input id="pAmount" type="number"></div></div><label>Data</label><input id="pDate" type="date"><label>Tytuł / uwagi</label><input id="pNote"><div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="savePayment()">Zapisz</button></div>`)}
function savePayment(){let ch=data.children.find(c=>c.id==pChild.value);data.payments.push({id:Date.now(),childId:ch.id,child:ch.last+" "+ch.first,month:pMonth.value,amount:+pAmount.value,date:pDate.value,note:pNote.value});ch.classes.forEach(c=>c.status="oplacone");save();closeModal();render()}
function deletePayment(id){if(confirm("Usunąć wpłatę?")){data.payments=data.payments.filter(p=>p.id!=id);save();render()}}
screenInput.onchange=e=>{let f=e.target.files[0];if(!f)return;modal(`<h2>Import ze screena</h2><div class="notice">Wybrano: <b>${f.name}</b></div><p>GitHub Pages nie ma bezpiecznego OCR ani dostępu do banku. Dlatego przed zapisaniem wpłaty wybierz dziecko i wpisz rozpoznaną kwotę ręcznie. To zapobiega błędnemu przypisaniu przelewu.</p><button class="primary" onclick="closeModal();addPayment()">Przejdź do weryfikacji wpłaty</button>`)};
function income(){app.innerHTML=`<div class="eyebrow">FINANSE</div><h2 class="title">Dodatkowe przychody</h2><button class="primary" onclick="addIncome()">+ Dodaj przychód</button><div class="card">${data.income.map(i=>`<div class="classrow"><b>${i.title}</b><div>${money(i.amount)} • ${i.date}</div></div>`).join("")||"Brak dodatkowych przychodów."}</div>`}
function addIncome(){modal(`<h2>Dodaj przychód</h2><label>Tytuł</label><input id="iTitle"><label>Kwota</label><input id="iAmount" type="number"><label>Data</label><input id="iDate" type="date"><div class="actions"><button class="soft" onclick="closeModal()">Anuluj</button><button class="primary" onclick="data.income.push({id:Date.now(),title:iTitle.value,amount:+iAmount.value,date:iDate.value});save();closeModal();render()">Zapisz</button></div>`)}
function groups(){app.innerHTML=`<div class="eyebrow">ZAJĘCIA</div><h2 class="title">Grupy i listy</h2><div class="card"><label>Szkoła</label><select id="gSchool" onchange="groupList()">${opt(schools,schools[0])}</select><label>Dzień</label><select id="gDay" onchange="groupList()">${opt(days,"Wtorek")}</select><label>Godzina</label><select id="gTime" onchange="groupList()">${opt(times,"15:00")}</select><div class="actions"><button class="dark" onclick="window.print()">Drukuj listę wyselekcjonowanych nazwisk</button></div></div><div id="gList"></div>`;groupList()}
function groupList(){let s=gSchool.value,d=gDay.value,t=gTime.value,arr=[];data.children.forEach(c=>c.classes.forEach(cl=>{if(cl.school==s&&cl.day==d&&cl.time==t)arr.push({c,cl})}));gList.innerHTML=arr.map(x=>`<div class="card"><b class="name">${x.c.last} ${x.c.first}</b><div class="muted">${x.c.class} • świetlica: ${x.c.club} • ${x.cl.type} • ${x.cl.day} ${x.cl.time}</div></div>`).join("")||'<div class="card">Brak dzieci dla wybranych filtrów.</div>'}
function reports(){app.innerHTML=`<div class="eyebrow">RAPORTY</div><h2 class="title">Raporty</h2><div class="card"><button class="dark" onclick="window.print()">Drukuj bieżący widok</button><p class="muted">Dane są zapisane lokalnie w tej przeglądarce.</p></div>`}
function lists(){app.innerHTML=`<div class="eyebrow">USTAWIENIA</div><h2 class="title">Listy</h2><div class="card"><h3>Wersja programu</h3><b>4.4</b><p class="muted">Szkoły: ${schools.join(", ")}<br>Zajęcia: ${workshops.join(", ")}</p><button class="danger" onclick="if(confirm('Przywrócić dane demonstracyjne?')){localStorage.removeItem('rw44');location.reload()}">Reset demo</button></div>`}
function signups(){app.innerHTML=`<div class="eyebrow">ZGŁOSZENIA</div><h2 class="title">Zapisy</h2><div class="card"><p>Moduł przygotowany do dalszego połączenia z formularzem zgłoszeń.</p></div>`}
backupBtn.onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rozliczenia-kopia-v44.json";a.click()}
render();
