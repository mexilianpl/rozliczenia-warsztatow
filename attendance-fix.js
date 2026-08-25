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

showAttendance = function(){
  const arr=selectedGroupRows();
  if(!arr.length)return;

  // Jeśli obecność została otwarta bezpośrednio z Grup,
  // zapamiętujemy bieżący ekran.
  if(!attendanceReturnPage) attendanceReturnPage = page || "groups";

  const key=attendanceKey(),
        saved=data.attendance[key]||{};

  modal(`<h2>Obecność — ${gSchool.value}</h2>
  <div class="muted">${gDay.value} ${gTime.value}</div>
  <div class="attendanceModalDate">${new Intl.DateTimeFormat("pl-PL",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(new Date())}</div>
  ${arr.map(({c})=>`<div class="attendanceRow">
    <div><b>${c.last} ${c.first}</b><small>${c.class||""} • ${c.pickupPlace||""}</small></div>
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
