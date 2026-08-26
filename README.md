# Rozliczenia Warsztatów

Aktualna wersja: **11.7 — 26.08.2026**

## Poprawka synchronizacji

Do czasu podłączenia serwera okno synchronizacji nie pokazuje już
pozornie aktywnego przycisku „Synchronizuj teraz”.

Teraz:
- bez skonfigurowanego serwera: **Serwer niepodłączony** — przycisk nieaktywny,
- serwer skonfigurowany, ale brak internetu: **Brak internetu** — przycisk nieaktywny,
- serwer + internet: **Synchronizuj teraz** — aktywny.

Oczekujące zmiany pozostają zapisane lokalnie i nie są kasowane.

## Porządkowanie struktury

Style modułu synchronizacji zostały usunięte z `sync.js`
i przeniesione do głównego `style.css`.

Dzięki temu:
- `sync.js` zawiera tylko logikę synchronizacji,
- `style.css` odpowiada za wygląd,
- nie tworzymy już arkusza CSS dynamicznie przy starcie aplikacji.

## Offline-first

Mechanizm kolejkowania zmian z 11.6 pozostaje zgodny:
- zapis lokalny działa natychmiast,
- każda zmiana zwiększa lokalną rewizję,
- po podłączeniu backendu oczekujące zmiany będą mogły być wysłane na serwer.

## Po wdrożeniu

Nie ma plików do usunięcia.

## Następny etap

Po przeniesieniu aplikacji na serwer podłączamy endpoint synchronizacji
i mechanizm rozwiązywania zmian między telefonem i komputerem.
