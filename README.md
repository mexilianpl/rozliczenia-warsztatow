# Rozliczenia Warsztatów

Aktualna wersja: **10.7 — 25.08.2026**

## Struktura aplikacji

- `app.js` — główny kod legacy aplikacji; będzie dzielony etapami.
- `dashboard.js` — podsumowanie strony Start i przepływy finansowe.
- `payments.js` — szybkie wpłaty, edycja wpłat i OCR.
- `children.js` — karta dziecka, profil, statusy, szybka wpłata z profilu i usuwanie dziecka.
- `income.js` — dodatkowe przychody i rozszerzenia listy zaległości.
- `v94.js` — jednorazowe odrabianie zajęć; pozostaje osobno, ponieważ łączy profil dziecka z obecnością.
- `v96.js` — zamykanie modali X i obsługa przycisku Wstecz na Androidzie.
- `v89.js` — działające mechanizmy szybkiej wpłaty i obecności wymagane przez późniejsze moduły.
- `attendance-fix.js` — poprawka powrotu z obecności.
- `style.css`, `v89.css`, `v90.css` — style.
- `service-worker.js` — PWA/cache.

## Pliki stare, nieładowane od wersji 10.7

Po potwierdzeniu, że 10.7 działa poprawnie, z repozytorium można usunąć:

- `v90.js`
- `v91.js`
- `v91.css`
- `v92.js`
- `v93.js`
- `v95.js`
- `v99.js`
- `v100.js`
- `v103.js`
- `v104.js`
- `v105.js`
- `v106.js`

Stare `README.txt` i `INSTRUKCJA.txt` również są nieaktualne i mogą zostać usunięte po przejściu na ten plik `README.md`.

## Kolejne etapy optymalizacji

Następny bezpieczny krok to stopniowe wydzielanie z `app.js`:
`attendance.js`, `groups.js`, `reports.js`, `lists.js`, `signups.js`, `settings.js` i `ui.js`.

Nie należy przepisywać całego `app.js` jednocześnie — moduły powinny być przenoszone i testowane pojedynczo.
