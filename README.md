# Rozliczenia Warsztatów

Aktualna wersja: **11.3 — 26.08.2026**

## Porządki 11.3

Usunięto warstwę przejściową `legacy-workflows.js` oraz wszystkie `*-base.js`.

Struktura jest teraz domenowa:
- `core.js`
- `dashboard.js`
- `children.js`
- `payments.js`
- `attendance.js`
- `groups.js`
- `lists.js`
- `reports.js`
- `signups.js`
- `settings.js`
- `income.js`
- `ui.js`

Dawna logika szybkiej wpłaty trafiła do `payments.js`.
Dawna logika okna obecności trafiła do `attendance.js`.
Aktualna grupa na Start trafiła do `dashboard.js`.
Zapamiętywanie filtrów grupy trafiło do `groups.js`.

## Po wdrożeniu usuń z repozytorium

- `legacy-workflows.js`
- `dashboard-base.js`
- `children-base.js`
- `payments-base.js`
- `attendance-base.js`

## Kolejny etap

Następnie można usunąć historyczne sufiksy funkcji (`89`, `94`, `98`, `107` itd.)
i ujednolicić nazewnictwo wewnątrz modułów, bez zmiany interfejsu.
