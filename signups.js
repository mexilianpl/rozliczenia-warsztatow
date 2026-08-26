/* =========================================================
   signups.js — Rozliczenia Warsztatów v11.0
   Zapisy i import CSV wydzielone z app.js.
   ========================================================= */
"use strict";

function signups(){
 app.innerHTML=`<div class="eyebrow">ZGŁOSZENIA</div><h2 class="title">Zapisy</h2><div class="actions signupTopActions"><button class="primary" onclick="editChild()">+ Dodaj dziecko ręcznie</button></div>
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
  first:childName.first,last:childName.last,sex:'Dziewczynka',school:normalizeSchool(signupVal(row,['Szkoła'])),className:signupVal(row,['Klasa']),
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

function updateSignupSchedule(i,k){
 const school=document.getElementById(`suSchool${i}`)?.value||"";
 const day=document.getElementById(`suDay${i}_${k}`),time=document.getElementById(`suTime${i}_${k}`);
 if(!day||!time)return;
 const cfg=dependentSchedule(school,day.value,time.value);
 day.innerHTML='<option value="">— wybierz później —</option>'+cfg.days.map(x=>`<option ${x===cfg.day?"selected":""}>${x}</option>`).join("");
 time.innerHTML='<option value="">— ustal później —</option>'+cfg.times.map(x=>`<option ${x===cfg.time?"selected":""}>${x}</option>`).join("");
}
function updateAllSignupSchedules(i){updateSignupSchedule(i,0);updateSignupSchedule(i,1)}
function updateSignupTimes(i,k){
 const school=document.getElementById(`suSchool${i}`)?.value||"",day=document.getElementById(`suDay${i}_${k}`)?.value||"";
 const time=document.getElementById(`suTime${i}_${k}`);if(!time)return;
 const allowed=schoolScheduleTimes(school,day),use=allowed.length?allowed:times;
 time.innerHTML='<option value="">— ustal później —</option>'+use.map(x=>`<option>${x}</option>`).join("");
}

function showSignupReview(items,fileName){
 window.__signupItems=items;
 if(!items.length){modal(`<h2>Brak zgłoszeń</h2><p>Nie znalazłem danych w pliku ${fileName}.</p><button class="soft" onclick="closeModal()">Zamknij</button>`);return}
 modal(`<h2>Sprawdź zgłoszenia przed dodaniem</h2><div class="notice">Plik: <b>${fileName}</b> • znaleziono <b>${items.length}</b> zgłoszeń. Możesz poprawić każde pole przed akceptacją.</div>
 <div id="signupReview">${items.map((r,i)=>`<div class="signupReviewCard" id="signupCard${i}">
  <h3>${r.last} ${r.first}</h3>${r.entryId?`<div class="muted">ID formularza: ${r.entryId} • ${r.createdAt||''}</div>`:''}
  <div class="grid2"><div><label>Nazwisko</label><input id="suLast${i}" value="${escapeAttr(r.last)}"></div><div><label>Imię</label><input id="suFirst${i}" value="${escapeAttr(r.first)}"></div></div>
  <div class="grid2"><div><label>Płeć</label><select id="suSex${i}">${opt(['Dziewczynka','Chłopiec'],r.sex)}</select></div><div><label>Klasa</label><input id="suClass${i}" value="${escapeAttr(r.className)}"></div></div>
  <label>Szkoła</label><select id="suSchool${i}" onchange="updateAllSignupSchedules(${i})">${signupSchoolOptions(r.school)}</select>
  <label>Sala / sposób odbioru</label><select id="suPickup${i}">${opt(["",...pickupPlaces],"")}</select>
  ${[0,1].map(k=>`<div class="signupWorkshop"><div class="grid2"><div><label>${k===0?'Rodzaj zajęć':'Drugie zajęcia'}</label><select id="suType${i}_${k}"><option value="">— brak —</option>${signupWorkshopOptions(r.types[k]||'')}</select></div><div><label>Dzień preferowany</label><select id="suDay${i}_${k}" onchange="updateSignupTimes(${i},${k})"><option value="">— wybierz później —</option>${dependentSchedule(r.school,r.days[k]||r.days[0]||days[0],times[0]).days.map(d=>`<option ${d===(r.days[k]||r.days[0])?"selected":""}>${d}</option>`).join("")}</select></div></div><label>Godzina</label><select id="suTime${i}_${k}"><option value="">— ustal później —</option>${dependentSchedule(r.school,r.days[k]||r.days[0]||days[0],times[0]).times.map(t=>`<option>${t}</option>`).join('')}</select></div>`).join('')}
  <label>Rodzic / opiekun</label><input id="suParent${i}" value="${escapeAttr(r.parent)}"><label>Telefon</label><input id="suPhone${i}" value="${escapeAttr(r.phone)}"><label>E-mail</label><input id="suEmail${i}" value="${escapeAttr(r.email)}"><label>Uwagi</label><textarea id="suNotes${i}">${escapeHtml(r.notes)}</textarea>
  <div class="consentLine">Regulamin: <b>${escapeHtml(r.rules||'brak')}</b> • Dane osobowe: <b>${escapeHtml(r.personal||'brak')}</b> • Wizerunek: <b>${escapeHtml(r.imageConsent||'brak')}</b></div>
  <div id="suInfo${i}"></div><div class="actions"><button class="primary" onclick="acceptSignup(${i})">✓ Akceptuję i dodaję dziecko</button><button class="soft" onclick="skipSignup(${i})">Pomiń</button></div>
 </div>`).join('')}</div><div class="actions"><button class="soft" onclick="closeModal()">Zamknij</button></div>`);
}


function normalizeConsentValue(v){return consentLabel(v)||""}
function consentChanges(existing,src){
 const old=existing.consents||{};
 return [
  {key:"image",label:"Zgoda na wizerunek",old:normalizeConsentValue(old.image),next:normalizeConsentValue(src.imageConsent)},
  {key:"personal",label:"Dane osobowe",old:normalizeConsentValue(old.personal),next:normalizeConsentValue(src.personal)},
  {key:"rules",label:"Regulamin zajęć",old:normalizeConsentValue(old.rules),next:normalizeConsentValue(src.rules)}
 ].filter(x=>x.next&&x.old!==x.next);
}
function consentUpdateDialog(changes){
 return new Promise(resolve=>{
  if(!changes.length){resolve(false);return}
  const wrap=document.createElement("div");wrap.className="confirmOverlay";wrap.id="consentUpdateDialog";
  wrap.innerHTML=`<div class="confirmBox"><div class="confirmIcon">?</div><h2>Nowe zgody w formularzu</h2>
  <p>Nowy formularz różni się od zapisanych danych:</p>
  <div class="consentDiffList">${changes.map(x=>`<div><b>${x.label}</b><br>${x.old||"brak danych"} → <b>${x.next}</b></div>`).join("")}</div>
  <p>Czy zaktualizować zgody w profilu?</p><div class="confirmActions"><button class="soft" data-no>Zostaw obecne</button><button class="primary" data-yes>Aktualizuj</button></div></div>`;
  const done=v=>{wrap.remove();resolve(v)};
  wrap.querySelector("[data-no]").onclick=()=>done(false);wrap.querySelector("[data-yes]").onclick=()=>done(true);
  document.body.appendChild(wrap)
 })
}
function applyConsentChanges(existing,src){
 existing.consents=existing.consents||{};
 if(normalizeConsentValue(src.imageConsent))existing.consents.image=normalizeConsentValue(src.imageConsent);
 if(normalizeConsentValue(src.personal))existing.consents.personal=normalizeConsentValue(src.personal);
 if(normalizeConsentValue(src.rules))existing.consents.rules=normalizeConsentValue(src.rules);
}
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
   price:defaultWorkshopPrice(type),
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
  notes:document.querySelector(`#suNotes${i}`).value.trim(),
  pickupPlace:document.querySelector(`#suPickup${i}`)?.value||""
 };
 ['parent','phone','email','notes','pickupPlace'].forEach(k=>{if(!existing[k]&&values[k])existing[k]=values[k]});
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
   const changes=consentChanges(existing,src);
   if(changes.length && await consentUpdateDialog(changes))applyConsentChanges(existing,src);
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

 const child={id:Date.now()+i,last,first,sex:document.querySelector(`#suSex${i}`).value,class:document.querySelector(`#suClass${i}`).value.trim(),school:document.querySelector(`#suSchool${i}`).value,club:(document.querySelector(`#suPickup${i}`)?.value==="Przychodzi sam/a"?"Nie":(document.querySelector(`#suPickup${i}`)?.value?"Tak":"")),pickupPlace:document.querySelector(`#suPickup${i}`)?.value||"",parent:document.querySelector(`#suParent${i}`).value.trim(),phone:document.querySelector(`#suPhone${i}`).value.trim(),email:document.querySelector(`#suEmail${i}`).value.trim(),notes:document.querySelector(`#suNotes${i}`).value.trim(),
  pickupPlace:document.querySelector(`#suPickup${i}`)?.value||"",sourceEntryId:src.entryId||'',sourceCreatedAt:src.createdAt||'',consents:{rules:src.rules||'',personal:src.personal||'',image:src.imageConsent||''},classes:[]};
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


window.RWModules=window.RWModules||{};
window.RWModules.signups={version:"11.5"};
