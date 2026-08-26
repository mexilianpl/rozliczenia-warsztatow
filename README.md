# Rozliczenia Warsztatów

Aktualna wersja: **11.2 — 26.08.2026**

## 11.2

`app.js` został całkowicie usunięty z aktywnej struktury.

Podział:
- `core.js` — model, zapis, wspólne obliczenia i nawigacja,
- `dashboard-base.js` — bazowy Start,
- `children-base.js` — bazowa lista/profil dzieci,
- `payments-base.js` — bazowe wpłaty/OCR/rodziny,
- `attendance-base.js` — bazowa obecność.

Dodatkowe przychody bazowe zostały dołączone do `income.js`,
a archiwizacja roku do `settings.js`.

Warstwy `*-base.js` są etapem przejściowym potrzebnym do zachowania
kolejności istniejącego `legacy-workflows.js`.

## Po wdrożeniu usuń

- `app.js`

## Następny etap

Rozłożyć `legacy-workflows.js` do docelowych modułów, a następnie
scalać `*-base.js` z `dashboard.js`, `children.js`, `payments.js`
i `attendance.js`.
