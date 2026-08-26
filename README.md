# Rozliczenia Warsztatów

Aktualna wersja: **11.5 — 26.08.2026**

## Porządki 11.5

Wyczyszczono historyczne numery wersji z:
- klas CSS,
- identyfikatorów DOM,
- nazw pól formularzy,
- pozostałych funkcji i helperów z dawnych wersji 8.9–10.7.

Przykładowo:
- `openQuickPayment89` → `openQuickPayment`
- `quickPaymentStart89` → `quickPaymentStart`
- `modalCloseX96` → `modalCloseX`
- `makeupProfile94` → `makeupProfile`
- `ocrBulkBar98` → `ocrBulkBar`
- `incomeRow107` → `incomeRow`

`children.js` i `payments.js` otrzymały czytelniejsze sekcje wewnętrzne.
Nie zmieniono formatu danych, interfejsu ani zasad rozliczania.

## Po wdrożeniu

Nie ma nowych plików do usunięcia.

## Następny etap

Następne porządki mogą objąć:
- usunięcie starych numerów wersji z nazw kluczy localStorage,
- ujednolicenie prywatnych nazw wrapperów `original...`,
- analizę powtarzających się helperów HTML/escape i redukcję duplikacji.
