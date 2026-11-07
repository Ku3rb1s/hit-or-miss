// Hit or Miss – Besonderheiten für scripts/check-lang.js (das Skript selbst ist gemeinsam für alle Spiele)
module.exports = {
  ignore: ['zen', 'Hit or Miss', 'Hit', 'Miss', 'HIT', 'MISS', 'M', '✗ Miss', 'Hit ✓', 'Blinding Lights · The Weeknd', 'hat über 5 Mrd. Streams bei Spotify', '60s', 'sd'],
  tables: ['MODE_NAMES', 'MODE_INFO', 'TYPE_NAMES', 'DIFF_NAMES', 'DIFF_INFO'],
  add: ['Töne an', 'Töne aus', 'Vibration an', 'Vibration aus'],
  keep: ['OLED', 'Design', 'Sudden Death'],
};
