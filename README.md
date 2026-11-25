# DnD Game Creator Online – Web-Version 0.9.1b

## Render
1. Neues GitHub-Repository `dnd-game-creator-online` erstellen (privat möglich).
2. Den Inhalt des ZIPs entpacken und auf die Hauptebene des Repositories hochladen, inklusive `public/`.
3. Render Dashboard → New → Web Service → Repository auswählen.
4. Runtime Node; Branch main; Root Directory leer; Build Command `npm install`; Start Command `npm start`; Instance Free; Health Check Path `/health`.
5. Deploy starten. Bei späteren Änderungen dieselben Pfade aktualisieren und committen. Auto-Deploy aktivieren.

## Lokal
Node.js 22 installieren, `npm install`, `npm start`, dann http://localhost:3000 öffnen.

## Umfang
Welteneditor, lokale Lobby mit Taverne, Würfel, Audio-Bibliothek, bisheriger separater Musik-Testserver. Kein synchronisiertes Mehrspieler-Spiel, keine Server-Kampagnenspeicherung. Kampagnen im Browser werden je Website gespeichert; vor dem Umzug exportieren, sofern die verwendete Version einen Export unterstützt. Musikserver: vorübergehende Sitzungen im RAM, maximal drei gleichzeitig, ca. 35 MB pro Audiodatei. Keine Zugangsdaten im Repository speichern. Neustarts und Deploys beenden Musik-Testsessionen.

## Dateien
`public/index.html` Oberfläche, `public/style.css` Design, `public/game.js` Spielmechanik, `public/assets/` Hintergrundbilder, `public/listener.html` Musik-Testspieler, `server.js` Webserver und Musik-API. Keine externen Asset-Packs enthalten.
