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
