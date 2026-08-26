# Rozliczenia Warsztatów

Aktualna wersja: **11.1 — 26.08.2026**

## Porządki 11.1

- `v89.js` otrzymał nazwę funkcjonalną `legacy-workflows.js`.
- `v89.css` i `v90.css` zostały scalone z `style.css` z zachowaniem dotychczasowej kolejności kaskady.
- `index.html` ładuje teraz tylko jeden lokalny arkusz stylów.
- `service-worker.js` cache'uje nową strukturę.
- wewnętrzny `VERSION` i nazwa eksportu kopii danych zostały ustawione na 11.1.

## Aktywne moduły

`app.js`, `legacy-workflows.js`, `dashboard.js`, `payments.js`, `children.js`,
`income.js`, `groups.js`, `lists.js`, `reports.js`, `signups.js`, `settings.js`,
`attendance.js`, `ui.js`.

## Po wdrożeniu 11.1 usuń z repozytorium

- `v89.js`
- `v89.css`
- `v90.css`

Następny etap: rozdzielić pozostały `app.js` na `core.js` oraz mniejsze domeny,
a następnie stopniowo rozłożyć `legacy-workflows.js` pomiędzy `payments.js`
i `attendance.js`.
