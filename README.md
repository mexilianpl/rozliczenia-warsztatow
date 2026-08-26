# Rozliczenia Warsztatów

Aktualna wersja: **11.9 — 26.08.2026**

## Porządki 11.9

Wspólne kodowanie tekstu HTML zostało sprowadzone do `escapeHtml()` z `core.js`.
Usunięto lokalne duplikaty z modułów dashboard, income, attendance i payments.

Nazwy wrapperów `original...` zostały ujednolicone do `previous...`, żeby
było jasne, że moduł rozszerza wcześniejszą funkcję zamiast przechowywać
drugą wersję funkcjonalności.

`normalizeChildText` zmieniono na `normalizeChildSearchText`, aby nazwa
jednoznacznie opisywała zastosowanie.

Nie zmieniono interfejsu, danych, płatności, obecności ani synchronizacji.

## Po wdrożeniu

Nie ma plików do usunięcia.

## Następny etap

Dalsze porządki można wykonać w `payments.js`: rozdzielić wewnętrznie
OCR, szybką wpłatę i edycję wpłat na wyraźne sekcje oraz ograniczyć
pozostałe lokalne helpery bez tworzenia nowych plików.
