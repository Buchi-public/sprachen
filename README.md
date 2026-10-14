# sprachen

Vokabeltrainer (Web-Apps für iPhone-Homescreen), ein gemeinsamer Kern für alle Sprachen.

- `kern/app.js`, `kern/app.css` – alle Funktionen (Leitner-Fächer je Richtung, Karten, Quiz, Schreiben, Sätze, Liste, Filter, Sicherungscode). Verbesserungen hier gelten für alle Sprachen.
- `<sprache>/sprache.json` – Eigenheiten der Sprache: Name, Artikel + Farben, Schreibtoleranz, Speicherschlüssel, Sicherungscode-Präfix, `features` (Modi, Wiederholungsabstände, Startrichtung …).
- `<sprache>/index.html` – wird mit `python3 werkzeug/build.py <sprache> <vokabeldatei.json>` erzeugt (Vokabeldatei bleibt intern, Quellenangaben werden entfernt).

Lernstand liegt nur lokal im Browser des jeweiligen Geräts.
