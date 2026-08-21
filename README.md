# Rozliczenia Warsztatów v2

Mobilna aplikacja testowa do rozliczania zajęć.

## Uruchomienie na GitHub Pages
Wgraj `index.html`, `style.css`, `app.js` do głównego katalogu repozytorium. Pages: Deploy from a branch → `main` → `/(root)`.

## Co działa
- baza dzieci i edycja danych,
- wyszukiwanie po pierwszych literach nazwiska,
- statystyki dziewczynki/chłopcy/grupy,
- wpłaty od września do sierpnia, także wpłata z góry na kolejny miesiąc,
- import CSV z Fluent Forms (obsługa pól w cudzysłowach i powtarzających się nagłówków),
- wstępne rozpoznawanie wklejonych operacji bankowych,
- grupy i wydruk: Nazwisko, Imię, Klasa, Świetlica, Rodzaj zajęć, Dzień, Godzina, Szkoła,
- raport roczny,
- eksport CSV i kopia/przywracanie JSON.

## Ważne
Ta wersja używa localStorage. Dane pozostają wyłącznie w danej przeglądarce. Nie używaj jej jako docelowej bazy prawdziwych danych dzieci/rodziców. Następny etap powinien dodać uwierzytelnianie, bazę danych po stronie serwera, kopie zapasowe i kontrolę dostępu.
