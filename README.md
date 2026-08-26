# Rozliczenia Warsztatów

Aktualna wersja: **11.8 — 26.08.2026**

## Porządki 11.8

Usunięto martwe, starsze definicje funkcji, które były później
nadpisywane nowszymi wersjami.

Usunięte duplikaty:
- `childCard`
- `editChild`
- `saveChild`
- `saveClass`
- `addPayment`

Z `core.js` usunięto również funkcje domenowe, które były dublowane:
- `childDue` — pozostaje w `children.js`
- `childPaymentsForMonth` — pozostaje w `payments.js`

## Ustawienia szybkiej wpłaty

Dwa stare aliasy zapisu zostały sprowadzone do jednego klucza:

`rw_quick_payment_prefs`

Stary klucz `rw89_quickpay` jest obsługiwany wyłącznie przez jednorazową
migrację. Dane są najpierw kopiowane do nowego klucza, a dopiero potem
stary klucz jest usuwany.

## Synchronizacja

Mechanizm offline-first i oczekujące rewizje pozostają bez zmian.

## Po wdrożeniu

Nie ma plików do usunięcia.

## Następny etap

Redukcja powtarzających się helperów HTML/normalizacji oraz
uporządkowanie wrapperów `original...`.
