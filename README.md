# FitLog – deine Fitness-App

Eine Web-App (PWA) für Trainingspläne, Trainingslog, Kalender und Fortschritt. Läuft auf Handy, Tablet und Computer, komplett kostenlos und ohne Server.

## Dateien

| Datei | Aufgabe |
|---|---|
| `index.html` | Startseite der App |
| `style.css` | Design (Dark Mode) |
| `app.js` | Alle Funktionen und Ansichten |
| `storage.js` | Speicherung der Daten (später austauschbar gegen Datenbank/Sync) |
| `mobility.js` | Dehn-, Mobility- und Haltungsprogramme mit Übungsbildern |
| `sw.js` | Offline-Funktion |
| `manifest.webmanifest` | Installation als App |
| `icon-*.png` | App-Symbole |

## Ausprobieren (am Computer)

Doppelklick auf `index.html` – die App öffnet sich im Browser. Die Daten werden im Browser gespeichert.
Hinweis: Die lokal geöffnete Datei und die spätere GitHub-Seite haben getrennte Speicher. Zum Übertragen: Einstellungen → Daten exportieren, dann auf der neuen Seite importieren.

## Kostenlos veröffentlichen (GitHub Pages)

1. Kostenloses Konto auf github.com anlegen.
2. Oben rechts **+ → New repository**. Name z. B. `fitlog`, Sichtbarkeit **Public**, **Create repository**.
3. **uploading an existing file** anklicken, alle Dateien aus diesem Ordner hineinziehen (nicht den Ordner selbst), **Commit changes**.
4. **Settings → Pages**: Bei „Branch“ `main` und `/ (root)` wählen, **Save**.
5. Nach 1–2 Minuten ist die App erreichbar unter `https://DEIN-NAME.github.io/fitlog/`.

## Auf dem Handy installieren

- **Android (Chrome):** Seite öffnen → Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm“.
- **iPhone (Safari):** Seite öffnen → Teilen-Symbol → „Zum Home-Bildschirm“.

## Wichtig: Datensicherung

Die Daten liegen nur im Browser deines Geräts. Erstelle regelmäßig eine Sicherung unter **Einstellungen → Daten exportieren**. Beim Löschen der Browserdaten wären sie sonst weg.

## App später aktualisieren

Dateien auf GitHub ersetzen und in `sw.js` die Zeile `const CACHE = 'fitlog-v2'` auf `fitlog-v3` ändern, damit Geräte die neue Version laden.

## Neu: Körperdaten, Ausdauersport, Beweglichkeit

- **Körper:** Gewicht täglich eintragen (mit −/+ in 0,1-kg-Schritten), Verlauf als Diagramm, Zielgewicht.
- **Sportarten:** Beim Erstellen eines Plans wählst du Krafttraining, Laufen, Radfahren oder Schwimmen. Ausdauerpläne haben Zieldistanz, Zieldauer und Beschreibung. Beim Training trägst du Distanz und Dauer ein, das Tempo wird berechnet. Alle Sportarten lassen sich dem Wochenplan und dem Kalender zuordnen.
- **Mobility:** Sechs Programme (Morgenroutine, Haltung & Schreibtisch, nach dem Laufen, nach dem Radfahren, nach dem Krafttraining, Rücken & Hüfte am Abend). Jede Übung hat ein Bild und eine Anleitung. „Geführt starten“ zeigt die Übungen nacheinander mit Timer.
- Die Übungsbilder sind selbst gezeichnete Strichfiguren, keine Fotos.
