# Rozliczenia Warsztatów

Aktualna wersja: **11.4 — 26.08.2026**

## Porządki 11.4

Usunięto historyczne numery wersji z nazw funkcji wewnętrznych.

Przykłady:
- `openQuickPayForChild98` → `openQuickPayForChild`
- `editPayment102` → `editPayment`
- `saveCertainOCR98` → `saveCertainOCRPayments`
- `openMakeup94` → `openMakeup`
- `deleteMakeup94` → `deleteMakeup`
- `deleteChild107` → `deleteChild`
- `editIncome107` → `editIncome`
- `addCloseX96` → `addModalCloseButton`

Ujednolicono również nazwy helperów i wrapperów wewnątrz modułów.
Format danych użytkownika i wygląd aplikacji nie zostały zmienione.

## Aktywne moduły

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

## Po wdrożeniu

Nie ma nowych plików do ręcznego usunięcia.

## Następny etap

Można teraz wyczyścić historyczne numery z nazw klas CSS/identyfikatorów DOM
oraz uprościć duże moduły `children.js` i `payments.js` przez wydzielenie
mniejszych sekcji wewnętrznych bez zwiększania liczby plików.
