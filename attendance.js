/* =========================================================
   attendance.js — Rozliczenia Warsztatów v11.5
   Pełny moduł obecności i odrabiania.
   Scalono attendance-base.js i część legacy-workflows.js.
   ========================================================= */
"use strict";


/* ===== PODSTAWOWA OBECNOŚĆ ===== */
function attendanceKey(){return `${new Date().toISOString().slice(0,10)}|${gSchool.value}|${gDay.value}|${gTime.value}`}
function showAttendance(){
 const arr=selectedGroupRows();if(!arr.length)return;
 const key=attendanceKey(),saved=data.attendance[key]||{};
 modal(`<h2>Obecność — ${gSchool.value}</h2><div class="muted">${gDay.value} ${gTime.value}</div><div class="attendanceModalDate">${new Intl.DateTimeFormat("pl-PL",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(new Date())}</div>
 ${arr.map(({c})=>`<div class="attendanceRow"><div><b>${c.last} ${c.first}</b><small>${c.class||""} • ${c.pickupPlace||""}</small></div>
 <div class="attendanceBtns"><button class="${saved[c.id]==="present"?"attActive presentBtn":"soft"}" onclick="setAttendance('${key}',${c.id},'present',this)">Obecny</button>
 <button class="${saved[c.id]==="absent"?"attActive absentBtn":"soft"}" onclick="setAttendance('${key}',${c.id},'absent',this)">Nieobecny</button></div></div>`).join("")}
 <div class="actions"><button class="primary" onclick="save();closeModal()">Zapisz obecność</button><button class="soft" onclick="closeModal()">Zamknij</button></div>`)
}
function setAttendance(key,cid,status,btn){
 data.attendance[key]=data.attendance[key]||{};data.attendance[key][cid]=status;
 const row=btn.closest(".attendanceBtns");row.querySelectorAll("button").forEach(b=>b.className="soft");
 btn.className=status==="present"?"attActive presentBtn":"attActive absentBtn";
}

(function(){
"use strict";

/* ---------- 8.9 / OBECNOŚĆ ---------- */

  window.markAllPresent = function(key){
    const arr=selectedGroupRows();
    data.attendance[key]=data.attendance[key]||{};
    arr.forEach(({c})=>data.attendance[key][c.id]="present");

    // Aktualizuj bieżące okno zamiast otwierać drugi modal.
    document.querySelectorAll(".attendanceBtns").forEach(row=>{
      const buttons=row.querySelectorAll("button");
      buttons.forEach(btn=>btn.className="soft");
      if(buttons[0])buttons[0].className="attActive presentBtn";
    });
  };

  // attendance-fix.js jest ładowany wcześniej. Nadpisujemy tylko jego okno,
  // zachowując poprawny powrót na Start / Grupy.
  window.showAttendance = function(){
    const arr=selectedGroupRows();
    if(!arr.length)return;

    if(typeof attendanceReturnPage!=="undefined" && !attendanceReturnPage){
      attendanceReturnPage=page||"groups";
    }

    const key=attendanceKey();
    const saved=data.attendance[key]||{};

    modal(`<h2>Obecność — ${escapeHtml(gSchool.value)}</h2>
      <div class="muted">${escapeHtml(gDay.value)} ${escapeHtml(gTime.value)}</div>
      <div class="attendanceModalDate">${new Intl.DateTimeFormat("pl-PL",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(new Date())}</div>

      <div class="attendanceBulkBar">
        <button class="primary" onclick="markAllPresent('${key}')">✓ Wszyscy obecni</button>
      </div>

      ${arr.map(({c})=>`<div class="attendanceRow">
        <div><b>${escapeHtml(c.last)} ${escapeHtml(c.first)}</b><small>${escapeHtml(c.class||"")} • ${escapeHtml(c.pickupPlace||"")}</small></div>
        <div class="attendanceBtns">
          <button class="${saved[c.id]==="present"?"attActive presentBtn":"soft"}"
            onclick="setAttendance('${key}',${c.id},'present',this)">Obecny</button>
          <button class="${saved[c.id]==="absent"?"attActive absentBtn":"soft"}"
            onclick="setAttendance('${key}',${c.id},'absent',this)">Nieobecny</button>
        </div>
      </div>`).join("")}

      <div class="actions">
        <button class="primary" onclick="finishAttendance(true)">Zapisz obecność</button>
        <button class="soft" onclick="finishAttendance(false)">Zamknij</button>
      </div>`);
  };

  
})();
/*
  Poprawka nawigacji obecności.
  Zachowuje ekran, z którego otwarto obecność.
  Start -> obecność -> Zapisz/Zamknij -> Start
  Grupy -> obecność -> Zapisz/Zamknij -> Grupy
*/
let attendanceReturnPage = null;

function finishAttendance(returnAfterSave) {
  const target = attendanceReturnPage || page || "start";
  attendanceReturnPage = null;
  if (returnAfterSave) save();
  closeModal();
  page = target;
  render();
}

openAttendanceForGroup = function(school,type,day,time){
  attendanceReturnPage = page || "start";

  page="groups";
  render();

  setTimeout(()=>{
    const s=document.getElementById("gSchool"),
          w=document.getElementById("gWorkshop"),
          d=document.getElementById("gDay"),
          t=document.getElementById("gTime");

    if(s)s.value=school;
    updateScheduleSelects("gSchool","gDay","gTime");

    if(w)w.value=type||"";
    if(d&&[...d.options].some(o=>o.value===day))d.value=day;

    updateTimeSelect("gSchool","gDay","gTime");

    if(t&&[...t.options].some(o=>o.value===time))t.value=time;

    groupList();
    showAttendance();
  },0);
};


/* =========================================================
   Moduł odrabiania zajęć (przeniesiony do attendance.js)
   Jednorazowe odrabianie zajęć
   ========================================================= */
(function(){
"use strict";

data.makeups = Array.isArray(data.makeups) ? data.makeups : [];


function makeupLocalToday(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function dayNameForDate(dateStr){
  const d=new Date(dateStr+"T12:00:00");
  return ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"][d.getDay()];
}

function nextDateForDay(dayName){
  const map={"Niedziela":0,"Poniedziałek":1,"Wtorek":2,"Środa":3,"Czwartek":4,"Piątek":5,"Sobota":6};
  const wanted=map[dayName];
  const d=new Date();
  d.setHours(12,0,0,0);
  let diff=(wanted-d.getDay()+7)%7;
  if(diff===0) diff=7;
  d.setDate(d.getDate()+diff);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function allMakeupGroups(){
  const map=new Map();
  (data.children||[]).forEach(c=>{
    if(typeof childActiveNow==="function" && !childActiveNow(c))return;
    (c.classes||[]).forEach(cl=>{
      if(cl.waitlist)return;
      const school=cl.school||c.school||"";
      const type=cl.type||"";
      const day=cl.day||"";
      const time=cl.time||"";
      if(!school||!day||!time)return;
      const key=[school,type,day,time].join("|");
      if(!map.has(key))map.set(key,{school,type,day,time});
    });
  });
  return [...map.values()].sort((a,b)=>
    a.school.localeCompare(b.school,"pl") ||
    (days.indexOf(a.day)-days.indexOf(b.day)) ||
    String(a.time).localeCompare(String(b.time)) ||
    a.type.localeCompare(b.type,"pl")
  );
}

function childMakeups(childId){
  return data.makeups
    .filter(m=>Number(m.childId)===Number(childId))
    .sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}

window.updateMakeupDate=function(){
  const idx=Number(document.getElementById("makeupGroup")?.value||0);
  const g=(window.__makeupGroups||[])[idx];
  const input=document.getElementById("makeupDate");
  if(g&&input)input.value=nextDateForDay(g.day);
};

window.openMakeup=function(childId){
  const ch=(data.children||[]).find(c=>Number(c.id)===Number(childId));
  if(!ch)return;

  const groups=allMakeupGroups();
  window.__makeupGroups=groups;

  if(!groups.length){
    modal(`<h2>Odrabianie zajęć</h2>
      <div class="notice">Brak dostępnych grup, do których można dopisać dziecko.</div>
      <div class="actions"><button class="soft" onclick="closeModal();editChild(${ch.id})">Wróć</button></div>`);
    return;
  }

  const existing=childMakeups(ch.id);
  const upcoming=existing.filter(m=>m.date>=makeupLocalToday());

  modal(`<h2>🔄 Odrabianie zajęć</h2>
    <div class="muted"><b>${escapeHtml(ch.first)} ${escapeHtml(ch.last)}</b> • jednorazowe dopisanie do innej grupy. Nie zmienia stałych zajęć ani płatności.</div>

    ${upcoming.length?`<div class="makeupList">
      <h3>Zaplanowane</h3>
      ${upcoming.map(m=>`<div class="makeupItem">
        <div><b>${escapeHtml(m.date)}</b><span>${escapeHtml(m.school)} • ${escapeHtml(m.type)} • ${escapeHtml(m.day)} ${escapeHtml(m.time)}</span>${m.note?`<small>${escapeHtml(m.note)}</small>`:""}</div>
        <button class="danger makeupDelete" onclick="deleteMakeup(${m.id},${ch.id})">Usuń</button>
      </div>`).join("")}
    </div>`:""}

    <label>Grupa, w której dziecko odrabia</label>
    <select id="makeupGroup" onchange="updateMakeupDate()">
      ${groups.map((g,i)=>`<option value="${i}">${escapeHtml(g.school)} • ${escapeHtml(g.type)} • ${escapeHtml(g.day)} ${escapeHtml(g.time)}</option>`).join("")}
    </select>

    <label>Data odrabiania</label>
    <input id="makeupDate" type="date" value="${nextDateForDay(groups[0].day)}">

    <label>Notatka (opcjonalnie)</label>
    <input id="makeupNote" placeholder="np. ustalone z mamą">

    <div class="actions">
      <button class="soft" onclick="closeModal();editChild(${ch.id})">Anuluj</button>
      <button class="primary" onclick="saveMakeup(${ch.id})">Zapisz odrabianie</button>
    </div>`);
};

window.saveMakeup=function(childId){
  const groups=window.__makeupGroups||[];
  const idx=Number(document.getElementById("makeupGroup")?.value||0);
  const g=groups[idx];
  const date=document.getElementById("makeupDate")?.value||"";
  const note=document.getElementById("makeupNote")?.value.trim()||"";
  const ch=(data.children||[]).find(c=>Number(c.id)===Number(childId));

  if(!g||!date||!ch)return;

  const actualDay=dayNameForDate(date);
  if(actualDay!==g.day){
    if(typeof showToast==="function")showToast(`Wybrana grupa ma zajęcia w: ${g.day}`);
    return;
  }

  const duplicate=data.makeups.some(m=>
    Number(m.childId)===Number(childId) &&
    m.date===date &&
    m.school===g.school &&
    m.type===g.type &&
    m.day===g.day &&
    m.time===g.time
  );
  if(duplicate){
    if(typeof showToast==="function")showToast("To odrabianie jest już zapisane");
    return;
  }

  data.makeups.push({
    id:Date.now(),
    childId:Number(childId),
    date,
    school:g.school,
    type:g.type,
    day:g.day,
    time:g.time,
    note,
    createdAt:new Date().toISOString()
  });

  if(typeof logHistory==="function"){
    logHistory(ch.id,`Zaplanowano odrabianie: ${date} • ${g.school} • ${g.type} • ${g.day} ${g.time}${note?` • ${note}`:""}.`);
  }

  save();
  closeModal();
  editChild(ch.id);
  if(typeof showToast==="function")showToast("Odrabianie zapisane");
};

window.deleteMakeup=function(id,childId){
  const m=data.makeups.find(x=>Number(x.id)===Number(id));
  data.makeups=data.makeups.filter(x=>Number(x.id)!==Number(id));
  const ch=(data.children||[]).find(c=>Number(c.id)===Number(childId));
  if(ch&&m&&typeof logHistory==="function"){
    logHistory(ch.id,`Usunięto odrabianie: ${m.date} • ${m.school} • ${m.type} • ${m.time}.`);
  }
  save();
  closeModal();
  openMakeup(childId);
};

/* ===== PROFIL DZIECKA ===== */
const previousEditChildForMakeup=window.editChild;
if(typeof previousEditChildForMakeup==="function"){
  window.editChild=function(id){
    previousEditChildForMakeup(id);
    if(!id)return;

    setTimeout(()=>{
      const box=document.querySelector("#modal .modalbox");
      if(!box || box.querySelector("#makeupProfile"))return;

      const header=box.querySelector(".childProfileHeader");
      if(!header)return;

      const upcoming=childMakeups(id).filter(m=>m.date>=makeupLocalToday());
      const html=`<div id="makeupProfile" class="makeupProfile">
        <div>
          <b>🔄 Odrabianie zajęć</b>
          <span>${upcoming.length?`${upcoming.length} zaplanowane`:"Brak zaplanowanych terminów"}</span>
        </div>
        <button class="soft" onclick="closeModal();openMakeup(${Number(id)})">${upcoming.length?"Zarządzaj":"+ Dodaj"}</button>
      </div>`;
      header.insertAdjacentHTML("afterend",html);
    },0);
  };
}

/* ===== LISTA OBECNOŚCI ===== */
const previousSelectedGroupRowsForMakeup=window.selectedGroupRows;
if(typeof previousSelectedGroupRowsForMakeup==="function"){
  window.selectedGroupRows=function(){
    const base=previousSelectedGroupRowsForMakeup();
    const school=document.getElementById("gSchool")?.value||"";
    const workshop=document.getElementById("gWorkshop")?.value||"";
    const day=document.getElementById("gDay")?.value||"";
    const time=document.getElementById("gTime")?.value||"";
    const today=new Date().toISOString().slice(0,10);

    const extras=data.makeups.filter(m=>
      m.date===today &&
      m.school===school &&
      (!workshop||m.type===workshop) &&
      m.day===day &&
      m.time===time
    );

    extras.forEach(m=>{
      const c=(data.children||[]).find(x=>Number(x.id)===Number(m.childId));
      if(!c)return;
      if(base.some(x=>Number(x.c.id)===Number(c.id)))return;
      base.push({
        c,
        cl:{school:m.school,type:m.type,day:m.day,time:m.time},
        isMakeup:true,
        makeupData:m
      });
    });

    return base.sort((a,b)=>
      (typeof pickupSortValue==="function"?pickupSortValue(a.c):0) -
      (typeof pickupSortValue==="function"?pickupSortValue(b.c):0) ||
      (a.c.last+" "+a.c.first).localeCompare(b.c.last+" "+b.c.first,"pl")
    );
  };
}

/* v8.9 nadal renderuje samo okno obecności.
   Po jego otwarciu dokładamy oznaczenie "Odrabianie" przy odpowiednim dziecku. */
const previousShowAttendanceForMakeup=window.showAttendance;
if(typeof previousShowAttendanceForMakeup==="function"){
  window.showAttendance=function(){
    const rowsBefore=selectedGroupRows();
    previousShowAttendanceForMakeup();

    setTimeout(()=>{
      const domRows=[...document.querySelectorAll("#modal .attendanceRow")];
      rowsBefore.forEach((x,i)=>{
        if(!x.isMakeup || !domRows[i])return;
        const info=domRows[i].querySelector("small");
        if(info){
          info.insertAdjacentHTML("beforeend",` <span class="makeupBadge">🔄 Odrabianie</span>`);
          if(x.makeupData?.note){
            info.insertAdjacentHTML("beforeend",`<span class="makeupNote">${escapeHtml(x.makeupData.note)}</span>`);
          }
        }
      });
    },0);
  };
}

/* style tylko dla tej funkcji — bez osobnego CSS */
const style=document.createElement("style");
style.textContent=`
.makeupProfile{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;margin:12px 0;border:1px solid #c8e7df;border-radius:18px;background:#f2fbf8}
.makeupProfile b,.makeupProfile span{display:block}.makeupProfile b{color:var(--blue);font-size:16px}.makeupProfile span{color:#687680;margin-top:3px;font-size:13px;font-weight:700}
.makeupList{margin:16px 0;padding:14px;border:1px solid var(--line);border-radius:18px;background:#fafcfd}.makeupList h3{margin:0 0 8px;color:var(--blue)}
.makeupItem{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}.makeupItem:last-child{border-bottom:0}
.makeupItem b,.makeupItem span,.makeupItem small{display:block}.makeupItem span{margin-top:3px;color:#52616f;font-weight:700}.makeupItem small{margin-top:3px;color:#7a8490}
.makeupDelete{padding:9px 12px;font-size:13px}
.makeupBadge{display:inline-block;margin-left:6px;padding:3px 7px;border-radius:999px;background:#e6f7f2;color:#13745e;font-weight:900;font-size:11px}
.makeupNote{display:block;margin-top:4px;color:#8a6b00;font-weight:800}
@media(max-width:520px){.makeupProfile{align-items:flex-start}.makeupItem{align-items:flex-start}.makeupItem .danger{flex:0 0 auto}}
`;
document.head.appendChild(style);

})();
