# Hit or Miss

@../Spiele-Hub/JUKEBOX.md

Gemeinsame Dateien (css/base.css, css/fonts.css, fonts/, js/i18n.js, js/profile.js, js/sync.js, js/pwa.js, sw.js)
hier **nicht** direkt ändern, sondern das Original in `../Spiele-Hub/shared/` und dann `node ../Spiele-Hub/scripts/share.js --write`.

Songdaten: `data/tracks.json` nur mit `node scripts/build-data.js` bauen (liest Gold Record und Older or Newer), dann
`scripts/.cache/report.txt` überfliegen und `DATA_V` in `js/game.js` erhöhen. Alle Regeln für faire Behauptungen stehen in
`js/claims.js` (Begründungen in `KONZEPT.md`, Abschnitt 4).
