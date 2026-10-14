# sprachen

Vokabeltrainer (Web-Apps für iPhone-Homescreen), ein gemeinsamer Kern für alle Sprachen.

- `kern/app.js`, `kern/app.css` – alle Funktionen (Leitner-Fächer je Richtung, Karten, Quiz, Schreiben, Sätze, Liste, Filter, Sicherungscode). Verbesserungen hier gelten für alle Sprachen.
- Kern-Schalter (`features` in `sprache.json`): `tts` (Sprachausgabe, Standard an; Sprache aus `tts` oder `code`), `mic` (Mikrofon-Knopf in Schreiben/Sätze), `firstPass` (Reiter „Neu": Erstdurchgang in Paketen, „Kann ich" = erledigt, kommt nie wieder), `packSize` (Standard 50), `report` (Knopf „Fehler melden"). Vokabeln können optional `ex`/`exde` (Beispielsatz) tragen.
- `<sprache>/sprache.json` – Eigenheiten der Sprache: Name, Artikel + Farben, Schreibtoleranz, Speicherschlüssel, Sicherungscode-Präfix, `features` (Modi, Wiederholungsabstände, Startrichtung …).
- `<sprache>/index.html` – wird mit `python3 werkzeug/build.py <sprache> <vokabeldatei.json>` erzeugt (Vokabeldatei bleibt intern, Quellenangaben werden entfernt).

Lernstand liegt nur lokal im Browser des jeweiligen Geräts.
