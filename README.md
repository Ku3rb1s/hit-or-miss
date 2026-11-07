# Hit or Miss

Stimmt’s oder stimmt’s nicht? Ein Song läuft, dazu eine Behauptung („erschien in den 80ern“, „ist von Bon Jovi“,
„hat über 2 Mrd. Streams bei Spotify“). Wisch nach rechts (Hit), wenn sie stimmt, nach links (Miss), wenn nicht.
Teil der [Jukebox](https://ku3rb1s.github.io/jukebox/) – Regeln für alle Spiele: `../Spiele-Hub/JUKEBOX.md`.

- **Modi:** 60 Sekunden (Fehler −3 s, Serien ×2 ab 5, ×3 ab 10, ×4 ab 20), Sudden Death (5 s pro Karte), Entspannt
  (ohne Zeitlimit, 20 Karten), Tages-Challenge (gleiche Karten für alle, Tag nach deutscher Zeit, immer Normal)
- **Schwierigkeit:** Leicht / Normal / Schwer (`DIFF` in `js/game.js`) – Rekorde und Bestenliste je Stufe
- **Lokal starten:** `node server.js` → http://127.0.0.1:8894/ (anderer Port: `PORT=8896 node server.js`)
- **Daten:** `node scripts/build-data.js` baut `data/tracks.json` aus Gold Record und Older or Newer und schreibt einen
  Prüfbericht nach `scripts/.cache/report.txt`. Danach `DATA_V` in `js/game.js` erhöhen.
- **Behauptungen:** `js/claims.js` – alle Regeln gegen unfaire Fakten an einer Stelle, mit Gegenprüfung jeder Karte.
- **Handlisten:** `scripts/related-artists.json` (Solo-Star und Band, andere Namen – nie gegeneinander als falsche Antwort),
  `scripts/versions-extra.json` (bekannte Remixe/Cover, die Deezer nicht findet). Andere Fassungen sucht `scripts/build-versions.js`.
- **Icons:** `node scripts/render-icons.js` (aus `logo.svg`, braucht Microsoft Edge)
- **Übersetzungen prüfen:** `node scripts/check-lang.js`
- **Speicher:** `hom.best.<60s|sd|zen>.<easy|normal|hard>`, `hom.daily.<Tag>`, `hom.dailyLog`, `hom.stats`, `hom.ach` (abgeglichen),
  `hom.mode`, `hom.diff`, `hom.sfx`, `hom.vib`, `hom.vol` (nur auf dem Gerät)

Konzept mit allen Datenprüfungen: `KONZEPT.md`.
