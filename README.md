# Rozliczenia Warsztatów v3 — prototyp

Wersja testowa przygotowana pod GitHub Pages.

Najważniejsze zmiany:
- jedno dziecko może mieć wiele zapisów na różne zajęcia,
- każde zajęcia mają własną cenę, rabat i status rozliczenia,
- rabat: brak / 5 / 10 / 15 / własny procent,
- status: Płatne / Bezpłatne / Charytatywne / Indywidualna cena,
- bezpłatne dzieci są liczone w statystykach, ale nie jako zalegające,
- ręczna korekta Wpłacono / Nie wpłacono,
- edycja i usuwanie wpłat,
- wyszukiwarka dziecka w oknie wpłaty,
- pola wyboru z list zarządzanych w sekcji Listy,
- Grupy: Szkoła + Dzień + Godzina,
- wydruk tylko wyfiltrowanej listy w kolejności:
  Nazwisko, Imię, Klasa, Świetlica, Rodzaj zajęć, Dzień, Godzina, Szkoła,
- dodatkowe przychody,
- lipiec i sierpień,
- import Fluent Forms z kontrolą duplikatu dziecka,
- raport miesięczny i eksport.

WAŻNE: to nadal wersja demonstracyjna oparta o localStorage. Nie przechowuj w niej docelowo prawdziwych danych dzieci/rodziców. Wersja produkcyjna powinna mieć logowanie i bazę danych na prywatnym serwerze.
