# Rozliczenia Warsztatów

Aktualna wersja: **12.2 — 26.08.2026**

## Końcowy etap porządkowania

Ta wersja zamyka główne porządki struktury przed przeniesieniem aplikacji na serwer.

Uporządkowano:
- `core.js`,
- `dashboard.js`,
- `attendance.js`,
- `groups.js`,
- wcześniejsze porządki `payments.js` i `children.js`,
- wersjonowanie cache i plików,
- strukturę aktywnych modułów.

Usunięto podczas audytu dodatkowych wcześniejszych deklaracji funkcji:
**0**.

## Aktywna struktura

- `core.js`
- `sync.js`
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
- `style.css`
- `service-worker.js`
- `manifest.webmanifest`

## Offline-first

Mechanizm offline-first pozostaje aktywny:
- zapis lokalny działa od razu,
- zmiany oczekują na synchronizację,
- do czasu podłączenia serwera przycisk pokazuje `Serwer niepodłączony`,
- dane nie są kasowane przy braku internetu.

## Audyt 12.2

- składnia wszystkich JS: OK,
- duplikaty top-level funkcji: 0,
- brakujące lokalne odwołania: 0,
- stare pliki przejściowe: 0.

## Po wdrożeniu

Nie ma plików do usunięcia.

## Następny etap

Nie porządkujemy już dalej kodu bez potrzeby.
Kolejnym większym zadaniem będzie przeniesienie aplikacji na serwer i podłączenie backendu synchronizacji.
