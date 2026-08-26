# Rozliczenia Warsztatów

Aktualna wersja: **10.8 — 26.08.2026**

## Aktywna struktura

- `app.js` — główny kod legacy; będzie dalej dzielony etapami.
- `dashboard.js` — Start i podsumowania finansowe.
- `payments.js` — szybkie wpłaty, edycja wpłat i OCR.
- `children.js` — lista/profil dzieci, statusy, szybka wpłata i usuwanie.
- `income.js` — dodatkowe przychody i rozszerzenia listy zaległości.
- `attendance.js` — obecności, powrót do poprzedniego ekranu i odrabianie zajęć.
- `ui.js` — modale, X oraz obsługa Android Wstecz.
- `v89.js` — starszy aktywny moduł wymagany przez szybkie wpłaty i część obecności.
- `style.css`, `v89.css`, `v90.css` — style.
- `service-worker.js` — PWA/cache.

## Porządki w 10.8

Scalono:
- `attendance-fix.js` + `v94.js` -> `attendance.js`
- `v96.js` -> `ui.js`

Po wdrożeniu 10.8 można bezpiecznie usunąć z repozytorium:
- `attendance-fix.js`
- `v94.js`
- `v96.js`

## Kolejny etap

Następne moduły do wydzielenia z `app.js`:
`groups.js`, `lists.js`, `reports.js`, `signups.js`, `settings.js`.

Docelowo warto również przenieść funkcje z `v89.js`, aby pozbyć się ostatniego pliku wersyjnego JS.
