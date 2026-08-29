# Rozliczenia Warsztatów — v12.10

Frontend aplikacji PWA do rozliczeń, płatności i obecności na warsztatach.

## Wersja

**12.10** — 28.08.2026

## Bezpieczeństwo repozytorium

Repozytorium jest przeznaczone wyłącznie na kod źródłowy aplikacji. Dane startowe są demonstracyjne i nie zawierają prawdziwych danych kontaktowych.

**Nigdy nie dodawaj do GitHuba:**
- `api/config.php`
- `api/.encryption-key.php`
- haseł, kluczy API i danych logowania
- kopii bazy `*.sql` / `*.sql.gz`
- eksportów zawierających dane dzieci, rodziców lub płatności
- katalogów `_backups/` i `backup/`

Plik `.gitignore` blokuje typowe pliki poufne, ale przed każdym commitem nadal warto sprawdzić listę zmian.

## Produkcja

Wersja produkcyjna korzysta z serwerowego API synchronizacji. Poufna konfiguracja backendu i klucz szyfrowania **nie są częścią tego repozytorium**.
