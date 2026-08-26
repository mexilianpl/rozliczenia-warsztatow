# Rozliczenia Warsztatów

Aktualna wersja: **10.9 — 26.08.2026**

## Aktywna struktura

- `app.js` — główny kod legacy; po 10.9 nie zawiera już Grup ani List.
- `dashboard.js` — Start i podsumowania finansowe.
- `payments.js` — szybkie wpłaty, edycja wpłat i OCR.
- `children.js` — lista/profil dzieci, statusy, szybka wpłata i usuwanie.
- `income.js` — dodatkowe przychody i rozszerzenia zaległości.
- `groups.js` — Grupy, filtrowanie grupy i wydruki grupowe.
- `lists.js` — Listy, podgląd, wydruk, Excel i szybkie zaznaczanie obecności.
- `attendance.js` — obecności grupowe, powrót i odrabianie zajęć.
- `ui.js` — modale, X i Android Wstecz.
- `v89.js` — aktywny starszy moduł, jeszcze do migracji.
- `style.css`, `v89.css`, `v90.css` — style.
- `service-worker.js` — PWA/cache, w 10.9 także cache logo.

## Zmiany techniczne 10.9

- Funkcje Grup zostały fizycznie przeniesione z `app.js` do `groups.js`.
- Funkcje List zostały fizycznie przeniesione z `app.js` do `lists.js`.
- Logo aplikacji zostało dodane do cache offline.
- `app.js` został zmniejszony bez zmiany danych użytkownika.

## Kolejny etap

Najbezpieczniej wydzielić następnie:
`reports.js`, `signups.js`, `settings.js`.

Później można przenieść aktywne funkcje z `v89.js` i usunąć ostatni wersyjny plik JS.
