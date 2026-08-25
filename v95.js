/* Rozliczenia Warsztatów v9.5
   Poprawka pierwszego renderu po odświeżeniu strony.
   app.js renderuje Start zanim załadują się późniejsze poprawki.
   Po załadowaniu wszystkich skryptów wykonujemy jeden końcowy render.
*/
(function(){
"use strict";

function finalInitialRender95(){
  if(typeof render!=="function")return;
  if(typeof page==="undefined")return;

  /* Nie przeszkadzamy użytkownikowi, jeżeli zdążył już wejść
     do innej zakładki podczas ładowania. */
  if(page==="start"){
    render();
  }
}

/* setTimeout gwarantuje, że v89-v94 wykonały już swoje nadpisania. */
setTimeout(finalInitialRender95,0);

})();