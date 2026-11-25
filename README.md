# DnD Game Creator Online – 0.9.4 Solo-Test + Render

## GitHub Pages (ohne Render)
1. Dieses ZIP entpacken und alle enthaltenen Dateien und Ordner in das DnD-Repository hochladen. Für GitHub Free muss das Repository öffentlich sein. Keine privaten Kampagnendateien hochladen.
2. Settings → Pages → Build and deployment → Source: Deploy from a branch → main → /docs → Save.
3. Sobald GitHub die Seite veröffentlicht hat, unter Settings → Pages den Link „Visit site“ öffnen.

Die Solo-Testversion liegt in `docs/`. Sie benötigt keinen Server und keine Installation. Online-Lobby, Online-Beitritt und gemeinsame Musiksession sind bewusst deaktiviert. Lokale Testlobby, Welteneditor, Weltkarte, Würfel und lokale Audiodateien sind verfügbar. Kampagnen werden im Browser gespeichert; über Export/Import kannst du sie sichern und zwischen Adressen übertragen.

## Render (später)
Das vollständige Serverprojekt bleibt im Repository: `server.js`, `campaign.js`, `lobby-server.js`, `package.json`, `render.yaml` und `public/`. Render nutzt weiterhin `npm install` und `npm start` aus dem Repository-Stamm. Änderungen in `docs/` wirken sich nicht automatisch auf `public/` aus; künftige Updates sollen beide Varianten enthalten.

## Bisherige Server-Dokumentation

## Lokal starten
Node.js 22 installieren, ZIP vollständig entpacken, im entpackten Ordner `npm start` ausführen und http://localhost:3000 im Browser öffnen. Keine zusätzlichen npm-Pakete nötig. Zum Testen mehrere unabhängige Browserprofile oder private Fenster verwenden.

## GitHub / Render
Alle Dateien und Ordner in das bestehende DnD-Repository hochladen. Render Web Service: Node, Root Directory leer, Build Command `npm install`, Start Command `npm start`. Render wird erst nach erneuter Freischaltung des Kontos benötigt. Keine neuen Anbieter nötig. `render.yaml` ist enthalten. Kampagnen vorher exportieren, da der Browser-Speicher an die Adresse gebunden ist.

## Online-Lobby
Im Welteneditor „Online-Lobby“ öffnen, Kampagnennamen prüfen und Lobby erstellen. Beitrittscode an Freunde geben. Spieler wählen im Hauptmenü „Spiel beitreten“ → „Online beitreten“, geben Code, Charaktername und optional Bild ein. WASD/Pfeiltasten bewegen nur die eigene Figur. Der Server prüft Kollisionen, Rollen und Bereitschaft; der DM startet, sobald alle bereit sind. Die Spieler sehen den synchronisierten Startstatus, bleiben aber noch in der Taverne. Mit „Zurück in den Warteraum“ kann der DM zurücksetzen. Der Editor bleibt im ursprünglichen Tab geöffnet.

Die Lobby nutzt HTTP-Abfragen im 700-ms-Takt. Sie speichert keine Kampagne auf dem Server. Die Sitzung und Portraits liegen vorübergehend im RAM und gehen beim Serverneustart verloren. Inaktive Lobbys werden nach sechs Stunden entfernt, vor Spielstart werden inaktive Spieler nach 90 Sekunden ausgetragen. Maximal 32 Spieler je Lobby, 20 Lobbys je Server. Der bisherige Musikserver bleibt erhalten, ist aber noch nicht mit der neuen Lobby verbunden. Die eigentlichen Kampagnenkarten, vorbereitete Spielerplätze, individuelle Startpunkte, Würfel und Musik folgen in der Multiplayer-Synchronisierung. Die Lobby ist ein Entwicklungsstand, kein gehärteter Produktionsserver.

## Weltkarte
+ / − oder Mausrad zoomt von 100 bis 400 %. „Karte verschieben“ aktivieren und mit gedrückter Maus ziehen (alternativ mittlere Maustaste). 100 % setzt den Zoom zurück. PNG-Export verwendet weiterhin die gesamte Karte.
Die gemalten Weltkarten-Assets sind in public/assets/world enthalten. Die bestehenden Karten und Ortsdaten bleiben erhalten.

## Version 0.9.4 – Gemeinsame Spielwelt

1. Kampagne im Welteneditor öffnen, sichtbare Karten prüfen, für Spielerplätze Startpunkte setzen. Die aktuell gewählte Karte ist die Ersatz-Startkarte.
2. **Online-Lobby** anklicken und Übertragung bestätigen (Popup erlauben). Die Lobby öffnet im neuen Tab, der Editor bleibt erhalten.
3. Spieler öffnen die gleiche Webseite, wählen Online beitreten und geben den Code ein. Die Reihenfolge des Beitritts bestimmt die Spielernummer und damit den vorbereiteten Startplatz.
4. Sobald alle bereit sind, startet der DM. Jeder Spieler bekommt nur die eigene Karte und kann sich mit WASD/Pfeiltasten bewegen. Der DM kann Karten wechseln und Spieler durch Auswahl und Klick auf ein freies Feld versetzen.

Die Karten sind gerenderte Momentaufnahmen (sichtbare Boden-/Objektlayer, Wände/Türen, Hintergründe), keine Live-Editor-Synchronisation. Marker-/Kreaturenlayer, Notizen, Musikdateien, Weltkarte und vollständige Kampagnendaten werden nicht übertragen. Sichtbare andere Layer sind vollständig sichtbar; es gibt noch keinen Nebel des Krieges, keine dynamischen NPCs, Fallen oder Licht-/Effekt-Synchronisierung. Kollisionen werden serverseitig geprüft, entsprechend den vorhandenen Feld- und Wandregeln. Die Sitzungen liegen im Arbeitsspeicher, nicht dauerhaft auf Render. Maximal 20 Karten pro Kampagne, 12 MiB Upload pro Lobby (max. 3 MB Base64 je Kartenbild), 5 aktive Kampagnen und 32 Spieler pro Lobby. Bei Serverneustart müssen Lobbys neu erstellt werden. Nur Karten/Assets hochladen, deren Online-Nutzung erlaubt ist.

Lokaler Start: `npm start`, anschließend `http://localhost:3000/` öffnen. Keine zusätzlichen npm-Abhängigkeiten. Render-Konfiguration bleibt unverändert. Die Standalone-HTML-Datei dient weiterhin dem lokalen Editor; echte Online-Sitzungen benötigen den Webserver.
