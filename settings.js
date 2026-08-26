/* =========================================================
   settings.js — Rozliczenia Warsztatów v11.0
   Ustawienia i eksport kopii danych wydzielone z app.js.
   ========================================================= */
"use strict";

function settingRowButton(el){
 return el?.closest(".settingsRow,.schoolPlanRow")?.querySelector(".miniSave")||null;
}
function markSettingDirty(el){
 markButtonDirty(el);
 const btn=settingRowButton(el); if(!btn)return;
 btn.classList.remove("savedState");
 btn.textContent="Zapisz";
 btn.dataset.saved="0";
}
function markSettingSaved(btn){
 if(!btn)return;
 btn.classList.add("savedState");
 btn.textContent="✓ Zapisano";
 btn.dataset.saved="1";
}
function saveSettingButton(btn){
 saveSettings(true);
 markSettingSaved(btn);
}
function settingsBase(){
 app.innerHTML=`<div class="eyebrow">KONFIGURACJA</div><h2 class="title">Ustawienia</h2>
 <div class="card"><h2>Warsztaty i ceny</h2><div id="setWorkshops">${data.settings.workshops.map((w,i)=>`<div class="settingsRow"><input value="${escapeAttr(w.name)}" oninput="data.settings.workshops[${i}].name=this.value;markSettingDirty(this)"><input type="number" step="0.01" value="${Number(w.price||0)}" oninput="data.settings.workshops[${i}].price=+this.value;markSettingDirty(this)"><button class="primary miniSave" onclick="saveSettingButton(this)">Zapisz</button><button class="danger" onclick="removeWorkshopSetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addWorkshopSetting()">+ Dodaj warsztaty</button></div>
 <div class="card"><h2>Godziny zajęć</h2><div id="setTimes">${data.settings.times.map((t,i)=>`<div class="settingsRow"><input type="time" value="${t}" oninput="data.settings.times[${i}]=this.value;markSettingDirty(this)"><button class="primary miniSave" onclick="saveSettingButton(this)">Zapisz</button><button class="danger" onclick="removeTimeSetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addTimeSetting()">+ Dodaj godzinę</button></div>
 <div class="card"><h2>Szkoły</h2><div id="setSchools">${data.settings.schools.map((s,i)=>`<div class="settingsRow"><input value="${escapeAttr(s)}" oninput="data.settings.schools[${i}]=this.value;markSettingDirty(this)"><button class="primary miniSave" onclick="saveSettingButton(this)">Zapisz</button><button class="danger" onclick="removeSchoolSetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addSchoolSetting()">+ Dodaj szkołę</button></div>
 <div class="card"><h2>Dni zajęć</h2><div id="setDays">${data.settings.days.map((d,i)=>`<div class="settingsRow"><input value="${escapeAttr(d)}" oninput="data.settings.days[${i}]=this.value;markSettingDirty(this)"><button class="primary miniSave" onclick="saveSettingButton(this)">Zapisz</button><button class="danger" onclick="removeDaySetting(${i})">Usuń</button></div>`).join("")}</div><button class="soft" onclick="addDaySetting()">+ Dodaj dzień</button></div>
 <div class="card"><h2>Sale / miejsce odbioru dzieci</h2>
 <p class="muted">Tutaj możesz zmieniać numery/nazwy sal oraz dodawać i usuwać sale. Opcja „Przychodzi sam/a” pozostaje zawsze dostępna.</p>
 <div id="setPickupRooms">${data.settings.pickupRooms.map((r,i)=>`<div class="settingsRow"><input value="${escapeAttr(r)}" oninput="data.settings.pickupRooms[${i}]=this.value;markSettingDirty(this)"><button class="primary miniSave" onclick="saveSettingButton(this)">Zapisz</button><button class="danger" onclick="removePickupRoomSetting(${i})">Usuń</button></div>`).join("")}</div>
 <button class="soft" onclick="addPickupRoomSetting()">+ Dodaj salę</button>
 </div>
 <div class="card"><h2>Plan szkół — tygodniowy grafik</h2>
 <p class="muted">Zaznacz dni, w których szkoła ma zajęcia. Dla zaznaczonego dnia wybierz jedną lub kilka godzin.</p>
 ${data.settings.schools.map(s=>`<div class="schoolPlanBox">
   <div class="schoolPlanTitle">${s}</div>
   ${days.map(day=>`<div class="schoolWeekRow">
     <label class="schoolDayToggle">
       <input type="checkbox" ${schoolDayEnabled(s,day)?"checked":""} onchange="toggleSchoolDay('${s.replace(/'/g,"\\'")}','${day.replace(/'/g,"\\'")}',this.checked)">
       <span>${day}</span>
     </label>
     <div class="schoolTimeChoices ${schoolDayEnabled(s,day)?"":"disabledTimes"}">
       ${times.map(t=>`<label class="timeChip"><input type="checkbox" ${schoolDayTimes(s,day).includes(t)?"checked":""} ${schoolDayEnabled(s,day)?"":"disabled"} onchange="toggleSchoolDayTime('${s.replace(/'/g,"\\'")}','${day.replace(/'/g,"\\'")}','${t}',this.checked)"><span>${t}</span></label>`).join("")}
     </div>
   </div>`).join("")}
   <button class="primary schoolScheduleSave" onclick="saveSchoolScheduleButton(this)">Zapisz grafik szkoły</button>
 </div>`).join("")}
 </div>
 <div class="card"><h2>Dane programu</h2><p class="muted">Wersja ${VERSION}. Zmiany ustawień wpływają na listy wyboru w całej aplikacji.</p><div class="actions"><button class="primary" onclick="saveSettings()">✓ Zapisz ustawienia</button><button class="dark" onclick="backupBtn.click()">Kopia danych</button></div></div>`;
}
function saveSettings(quiet=false){
 data.settings.workshops=data.settings.workshops.filter(x=>String(x.name||"").trim()).map(x=>({name:String(x.name).trim(),price:Number(x.price||0)}));
 data.settings.schools=data.settings.schools.filter(x=>String(x||"").trim()).map(x=>String(x).trim());
 data.settings.times=data.settings.times.filter(Boolean).sort();
 data.settings.days=data.settings.days.filter(x=>String(x||"").trim()).map(x=>String(x).trim());
 data.settings.pickupRooms=data.settings.pickupRooms.filter(x=>String(x||"").trim()).map(x=>String(x).trim());

 Object.keys(data.settings.schoolSchedules||{}).forEach(s=>{data.settings.schoolSchedules[s]=(data.settings.schoolSchedules[s]||[]).filter(x=>x.day&&x.time)});
 syncSettingsArrays();save();
 if(!quiet) confirmModal({title:"Ustawienia zapisane",message:"Nowe szkoły, warsztaty, ceny i godziny są już dostępne w aplikacji.",confirmText:"OK",cancelText:"Zamknij",danger:false}); else showToast("Zapisano");
}
function addWorkshopSetting(){data.settings.workshops.push({name:"Nowe warsztaty",price:155});settings()}
function removeWorkshopSetting(i){data.settings.workshops.splice(i,1);settings()}
function addTimeSetting(){data.settings.times.push("15:00");settings()}
function removeTimeSetting(i){data.settings.times.splice(i,1);settings()}
function addSchoolSetting(){data.settings.schools.push("Nowa szkoła");settings()}
function removeSchoolSetting(i){data.settings.schools.splice(i,1);settings()}
function addDaySetting(){data.settings.days.push("Nowy dzień");settings()}
function addPickupRoomSetting(){data.settings.pickupRooms.push("Nowa sala");settings()}
function removePickupRoomSetting(i){
 const room=data.settings.pickupRooms[i];
 const used=data.children.some(c=>c.pickupPlace===room);
 if(used){
   confirmModal({title:"Sala jest używana",message:`Sala „${room}” jest przypisana do co najmniej jednego dziecka. Najpierw zmień salę w profilach dzieci.`,confirmText:"OK",cancelText:"Zamknij",danger:false});
   return;
 }
 data.settings.pickupRooms.splice(i,1);syncSettingsArrays();save();settings();
}
function removeDaySetting(i){data.settings.days.splice(i,1);settings()}


function settings(){
 settingsBase();
 const cards=document.querySelectorAll("#app .card"); if(!cards.length)return;
 const last=cards[cards.length-1];
 last.insertAdjacentHTML("beforebegin",`
 <div class="card"><h2>Organizacja grup</h2>
  <label>Domyślny limit miejsc w grupie</label><input id="setGroupLimit" type="number" min="1" value="${Number(data.settings.groupLimit||12)}">
  <button class="primary settingWideSave" onclick="data.settings.groupLimit=+setGroupLimit.value||12;save();showToast('Zapisano limit')">Zapisz limit</button>
 </div>
 <div class="card"><h2>Przypomnienia SMS</h2><p class="muted">Dostępne pola: {dziecko}, {miesiac}, {brakuje}, {warsztaty}</p>
  <textarea id="setReminderTemplate" rows="5">${escapeHtml(data.settings.reminderTemplate||"")}</textarea>
  <button class="primary settingWideSave" onclick="data.settings.reminderTemplate=setReminderTemplate.value;save();showToast('Zapisano tekst SMS')">Zapisz tekst SMS</button>
 </div>
 <div class="card"><h2>Rok szkolny i archiwum</h2>
  <label>Bieżący rok szkolny</label><input id="setSchoolYear" value="${escapeAttr(data.currentSchoolYear)}">
  <div class="actions"><button class="primary" onclick="data.currentSchoolYear=setSchoolYear.value;save();showToast('Zapisano rok')">Zapisz rok</button><button class="danger" onclick="archiveSchoolYear()">Archiwizuj i rozpocznij nowy rok</button></div>
  <div class="muted">Archiwa: ${data.archives.length?data.archives.map(a=>a.year).join(", "):"brak"}</div>
 </div>`);
}



backupBtn.onclick=()=>{let blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rozliczenia-kopia-v11.6.json";a.click()}

window.RWModules=window.RWModules||{};
window.RWModules.settings={version:"11.5"};

/* Archiwizacja roku z app.js — v11.2 */
function archiveSchoolYear(){
 confirmModal({title:"Zamknąć rok szkolny?",message:`Utworzę archiwum ${data.currentSchoolYear}. Wpłaty, przychody i obecności bieżącego roku zostaną wyzerowane, a dzieci i zajęcia pozostaną w bazie.`,confirmText:"Archiwizuj",cancelText:"Anuluj",danger:false}).then(ok=>{
  if(!ok)return;
  data.archives.push({year:data.currentSchoolYear,createdAt:new Date().toISOString(),payments:structuredClone(data.payments),income:structuredClone(data.income),attendance:structuredClone(data.attendance),history:structuredClone(data.history),creditTransfers:structuredClone(data.creditTransfers)});
  const parts=String(data.currentSchoolYear).match(/(\d{4}).*?(\d{4})/);
  if(parts)data.currentSchoolYear=`${Number(parts[1])+1}/${Number(parts[2])+1}`;
  data.payments=[];data.income=[];data.attendance={};data.creditTransfers=[];
  save();settings();showToast("Rok zarchiwizowany");
 });
}
