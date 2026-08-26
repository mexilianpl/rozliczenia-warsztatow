/* attendance-base.js — v11.2 */
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
