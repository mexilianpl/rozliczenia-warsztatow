/* =========================================================
   attendance.js — Rozliczenia Warsztatów v11.3
   Pełny moduł obecności i odrabiania.
   Scalono attendance-base.js i część legacy-workflows.js.
   ========================================================= */
"use strict";

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

function esc89(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
/* ---------- 8.9 / OBECNOŚĆ ---------- */

  window.markAllPresent89 = function(key){
    const arr=selectedGroupRows();
    data.attendance[key]=data.attendance[key]||{};
    arr.forEach(({c})=>data.attendance[key][c.id]="present");
    showAttendance();
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

    modal(`<h2>Obecność — ${esc89(gSchool.value)}</h2>
      <div class="muted">${esc89(gDay.value)} ${esc89(gTime.value)}</div>
      <div class="attendanceModalDate">${new Intl.DateTimeFormat("pl-PL",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(new Date())}</div>

      <div class="attendanceBulkBar">
        <button class="primary" onclick="markAllPresent89('${key}')">✓ Wszyscy obecni</button>
      </div>

      ${arr.map(({c})=>`<div class="attendanceRow">
        <div><b>${esc89(c.last)} ${esc89(c.first)}</b><small>${esc89(c.class||"")} • ${esc89(c.pickupPlace||"")}</small></div>
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

function esc94(s){
  return String(s??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function localToday94(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function dayName94(dateStr){
  const d=new Date(dateStr+"T12:00:00");
  return ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"][d.getDay()];
}

function nextDateForDay94(dayName){
  const map={"Niedziela":0,"Poniedziałek":1,"Wtorek":2,"Środa":3,"Czwartek":4,"Piątek":5,"Sobota":6};
  const wanted=map[dayName];
  const d=new Date();
  d.setHours(12,0,0,0);
  let diff=(wanted-d.getDay()+7)%7;
  if(diff===0) diff=7;
  d.setDate(d.getDate()+diff);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function allGroups94(){
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

function childMakeups94(childId){
  return data.makeups
    .filter(m=>Number(m.childId)===Number(childId))
    .sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}

window.updateMakeupDate94=function(){
  const idx=Number(document.getElementById("makeupGroup94")?.value||0);
  const g=(window.__makeupGroups94||[])[idx];
  const input=document.getElementById("makeupDate94");
  if(g&&input)input.value=nextDateForDay94(g.day);
};

window.openMakeup94=function(childId){
  const ch=(data.children||[]).find(c=>Number(c.id)===Number(childId));
  if(!ch)return;

  const groups=allGroups94();
  window.__makeupGroups94=groups;

  if(!groups.length){
    modal(`<h2>Odrabianie zajęć</h2>
      <div class="notice">Brak dostępnych grup, do których można dopisać dziecko.</div>
      <div class="actions"><button class="soft" onclick="closeModal();editChild(${ch.id})">Wróć</button></div>`);
    return;
  }

  const existing=childMakeups94(ch.id);
  const upcoming=existing.filter(m=>m.date>=localToday94());

  modal(`<h2>🔄 Odrabianie zajęć</h2>
    <div class="muted"><b>${esc94(ch.first)} ${esc94(ch.last)}</b> • jednorazowe dopisanie do innej grupy. Nie zmienia stałych zajęć ani płatności.</div>

    ${upcoming.length?`<div class="makeupList94">
      <h3>Zaplanowane</h3>
      ${upcoming.map(m=>`<div class="makeupItem94">
        <div><b>${esc94(m.date)}</b><span>${esc94(m.school)} • ${esc94(m.type)} • ${esc94(m.day)} ${esc94(m.time)}</span>${m.note?`<small>${esc94(m.note)}</small>`:""}</div>
        <button class="danger makeupDelete94" onclick="deleteMakeup94(${m.id},${ch.id})">Usuń</button>
      </div>`).join("")}
    </div>`:""}

    <label>Grupa, w której dziecko odrabia</label>
    <select id="makeupGroup94" onchange="updateMakeupDate94()">
      ${groups.map((g,i)=>`<option value="${i}">${esc94(g.school)} • ${esc94(g.type)} • ${esc94(g.day)} ${esc94(g.time)}</option>`).join("")}
    </select>

    <label>Data odrabiania</label>
    <input id="makeupDate94" type="date" value="${nextDateForDay94(groups[0].day)}">

    <label>Notatka (opcjonalnie)</label>
    <input id="makeupNote94" placeholder="np. ustalone z mamą">

    <div class="actions">
      <button class="soft" onclick="closeModal();editChild(${ch.id})">Anuluj</button>
      <button class="primary" onclick="saveMakeup94(${ch.id})">Zapisz odrabianie</button>
    </div>`);
};

window.saveMakeup94=function(childId){
  const groups=window.__makeupGroups94||[];
  const idx=Number(document.getElementById("makeupGroup94")?.value||0);
  const g=groups[idx];
  const date=document.getElementById("makeupDate94")?.value||"";
  const note=document.getElementById("makeupNote94")?.value.trim()||"";
  const ch=(data.children||[]).find(c=>Number(c.id)===Number(childId));

  if(!g||!date||!ch)return;

  const actualDay=dayName94(date);
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

window.deleteMakeup94=function(id,childId){
  const m=data.makeups.find(x=>Number(x.id)===Number(id));
  data.makeups=data.makeups.filter(x=>Number(x.id)!==Number(id));
  const ch=(data.children||[]).find(c=>Number(c.id)===Number(childId));
  if(ch&&m&&typeof logHistory==="function"){
    logHistory(ch.id,`Usunięto odrabianie: ${m.date} • ${m.school} • ${m.type} • ${m.time}.`);
  }
  save();
  closeModal();
  openMakeup94(childId);
};

/* ===== PROFIL DZIECKA ===== */
const originalEditChild94=window.editChild;
if(typeof originalEditChild94==="function"){
  window.editChild=function(id){
    originalEditChild94(id);
    if(!id)return;

    setTimeout(()=>{
      const box=document.querySelector("#modal .modalbox");
      if(!box || box.querySelector("#makeupProfile94"))return;

      const header=box.querySelector(".childProfileHeader");
      if(!header)return;

      const upcoming=childMakeups94(id).filter(m=>m.date>=localToday94());
      const html=`<div id="makeupProfile94" class="makeupProfile94">
        <div>
          <b>🔄 Odrabianie zajęć</b>
          <span>${upcoming.length?`${upcoming.length} zaplanowane`:"Brak zaplanowanych terminów"}</span>
        </div>
        <button class="soft" onclick="closeModal();openMakeup94(${Number(id)})">${upcoming.length?"Zarządzaj":"+ Dodaj"}</button>
      </div>`;
      header.insertAdjacentHTML("afterend",html);
    },0);
  };
}

/* ===== LISTA OBECNOŚCI ===== */
const originalSelectedGroupRows94=window.selectedGroupRows;
if(typeof originalSelectedGroupRows94==="function"){
  window.selectedGroupRows=function(){
    const base=originalSelectedGroupRows94();
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
        makeup94:true,
        makeupData94:m
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
const originalShowAttendance94=window.showAttendance;
if(typeof originalShowAttendance94==="function"){
  window.showAttendance=function(){
    const rowsBefore=selectedGroupRows();
    originalShowAttendance94();

    setTimeout(()=>{
      const domRows=[...document.querySelectorAll("#modal .attendanceRow")];
      rowsBefore.forEach((x,i)=>{
        if(!x.makeup94 || !domRows[i])return;
        const info=domRows[i].querySelector("small");
        if(info){
          info.insertAdjacentHTML("beforeend",` <span class="makeupBadge94">🔄 Odrabianie</span>`);
          if(x.makeupData94?.note){
            info.insertAdjacentHTML("beforeend",`<span class="makeupNote94">${esc94(x.makeupData94.note)}</span>`);
          }
        }
      });
    },0);
  };
}

/* style tylko dla tej funkcji — bez osobnego CSS */
const style=document.createElement("style");
style.textContent=`
.makeupProfile94{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;margin:12px 0;border:1px solid #c8e7df;border-radius:18px;background:#f2fbf8}
.makeupProfile94 b,.makeupProfile94 span{display:block}.makeupProfile94 b{color:var(--blue);font-size:16px}.makeupProfile94 span{color:#687680;margin-top:3px;font-size:13px;font-weight:700}
.makeupList94{margin:16px 0;padding:14px;border:1px solid var(--line);border-radius:18px;background:#fafcfd}.makeupList94 h3{margin:0 0 8px;color:var(--blue)}
.makeupItem94{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}.makeupItem94:last-child{border-bottom:0}
.makeupItem94 b,.makeupItem94 span,.makeupItem94 small{display:block}.makeupItem94 span{margin-top:3px;color:#52616f;font-weight:700}.makeupItem94 small{margin-top:3px;color:#7a8490}
.makeupDelete94{padding:9px 12px;font-size:13px}
.makeupBadge94{display:inline-block;margin-left:6px;padding:3px 7px;border-radius:999px;background:#e6f7f2;color:#13745e;font-weight:900;font-size:11px}
.makeupNote94{display:block;margin-top:4px;color:#8a6b00;font-weight:800}
@media(max-width:520px){.makeupProfile94{align-items:flex-start}.makeupItem94{align-items:flex-start}.makeupItem94 .danger{flex:0 0 auto}}
`;
document.head.appendChild(style);

})();
