# Rozliczenia Warsztatów

Aktualna wersja: **11.6 — 26.08.2026**

## Offline-first

Dodano `sync.js`, który przygotowuje aplikację do pracy:
- bez internetu,
- przy bardzo słabym internecie,
- z późniejszą automatyczną synchronizacją na serwer.

Każde wywołanie centralnego `save()`:
1. zapisuje dane lokalnie tak jak dotychczas,
2. zwiększa lokalny numer rewizji,
3. oznacza zmianę jako oczekującą na synchronizację.

Na razie endpoint serwera jest pusty, więc żadne dane nie są wysyłane.
Po podłączeniu backendu wystarczy skonfigurować endpoint przez
`RWOfflineSync.configureEndpoint(...)`.

## Status synchronizacji

W nagłówku aplikacji pojawia się mały status:
- 🔴 Offline
- 🟠 X oczekuje
- 🟡 Tryb lokalny
- 🔵 Synchronizacja…
- 🟢 Zsynchronizowano

Kliknięcie statusu pokazuje szczegóły.

## Service Worker

Cache aplikacji obejmuje cały lokalny shell wraz z logo.
Tesseract i XLSX z jsDelivr są teraz cache'owane przy pierwszym udanym
użyciu online, dzięki czemu później mogą działać offline.

## Bezpieczeństwo danych

Brak internetu nigdy nie kasuje danych. Nieudana synchronizacja pozostawia
wszystkie zmiany lokalnie i oznacza je jako oczekujące.

## Po wdrożeniu

Nie ma plików do usunięcia.

## Następny krok za 3 dni

Na serwerze należy uruchomić backend synchronizacji (PHP + MySQL lub
równoważny endpoint), a następnie skonfigurować jego adres w aplikacji.
