# Rozliczenia Warsztatów

Aktualna wersja: **11.0 — 26.08.2026**

## Moduły

- `app.js` — pozostały kod bazowy/core.
- `dashboard.js` — Start i podsumowania.
- `payments.js` — wpłaty i OCR.
- `children.js` — dzieci i profil dziecka.
- `income.js` — dodatkowe przychody.
- `groups.js` — grupy.
- `lists.js` — listy.
- `reports.js` — raporty i eksport raportów.
- `signups.js` — zapisy i import CSV.
- `settings.js` — ustawienia i kopia danych.
- `attendance.js` — obecności i odrabianie.
- `ui.js` — modale/X/Android Wstecz.
- `v89.js` — ostatni aktywny starszy moduł do uporządkowania.

## 11.0

Wydzielono z `app.js` trzy duże sekcje: Raporty, Zapisy i Ustawienia.
Wewnętrzny numer `VERSION` został ustawiony na 11.0.
Eksport kopii danych ma nazwę `rozliczenia-kopia-v11.0.json`.

Następny etap: przeniesienie funkcji z `v89.js` do docelowych modułów oraz scalenie `v89.css`/`v90.css` ze `style.css`.
