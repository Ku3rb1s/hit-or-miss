# Konzept: Hit or Miss – neues Jukebox-Spiel „Wahr oder falsch?“

Stand: 07.11.2026 · Version 1.0.0 ist veröffentlicht (ku3rb1s.github.io/hit-or-miss/). Für die offenen Fragen in Abschnitt 8 wurden die Vorschläge aus diesem Konzept umgesetzt, dazu auf Wunsch: Wischen wie bei Tinder, Modus „Entspannt“ ohne Zeitlimit, drei Schwierigkeitsstufen, Logo „Kartenstapel“.
Name gewählt: **Hit or Miss** (Arbeitsname war „Hit oder Niete“).

---

## 1. Die Idee in drei Sätzen

Ein Song-Ausschnitt läuft, dazu steht eine Behauptung auf einer Karte: „erschien in den 80ern“, „ist von Bon Jovi“,
„hat über 2 Mrd. Streams bei Spotify“. Wisch nach **rechts = stimmt**, nach **links = stimmt nicht** (oder Knöpfe ✓/✗,
oder Pfeiltasten). In **60 Sekunden** so viele richtige Antworten wie möglich – am Ende zeigt die Auflösung die echten Fakten.

---

## 2. Name

Die anderen Spiele haben kurze englische Namen mit Doppelsinn aus der Musikwelt: *Needle Drop* (Nadel aufsetzen),
*Older or Newer*, *Gold Record*. Der neue Name sollte (a) nach Musik klingen, (b) das Richtig/Falsch-Prinzip andeuten,
(c) sich nicht mit den anderen beißen, (d) in allen 5 Sprachen funktionieren.

| Name | Doppelsinn | Stärken | Schwächen |
|---|---|---|---|
| **Right Track** | „on the right track“ = auf dem richtigen Weg · *track* = Song · *right* = rechts | Drei Bedeutungen auf einmal, und eine davon ist die Bedienung: Wisch nach **rechts**, wenn die Behauptung zum **Track** passt. Klingt wie die anderen (zwei Wörter, Musik-Begriff). Unverwechselbar. | Sagt nicht direkt „wahr oder falsch“, erklärt sich erst mit dem Untertitel. Im Deutschen ist „on the right track“ weniger geläufig. |
| **Hit or Miss** | Redewendung „mal Treffer, mal daneben“ · *Hit* = Hit-Song · *Miss* = Fehlgriff | Die direkte Übersetzung des Arbeitsnamens, sofort verständlich, kurz. | Sehr ähnlicher Aufbau wie *Older or Newer* („X or Y“) – zwei Spiele mit „or“ wirken austauschbar. Allgemeiner Begriff, gibt es oft. |
| **Sound Check** | Soundcheck vor dem Konzert · *check* = Behauptung prüfen | Jeder kennt das Wort, auch auf Deutsch. | Verrät nichts über das Wischen oder Tempo; klingt eher nach Technik-Test. |
| **Liner Notes** | Die Texte im Plattencover mit allen Fakten (Jahr, Interpret, Studio) | Für Musik-Fans der klügste Name: genau diese Fakten werden geprüft. | Kaum jemand außer Plattensammlern kennt das Wort; kein Tempo-Gefühl. |
| **Off Key** | „schief gesungen“ = falsch | Kurz, frech, eindeutig musikalisch. | Betont nur das Falsche; klingt negativ. |
| **Track Check** | Reim, „den Track checken“ | Eingängig, beschreibt das Spiel. | Etwas holprig zu sprechen, wirkt wie ein Werkzeug statt wie ein Spiel. |

**Entscheidung: Hit or Miss** – mit Untertitel *„Stimmt’s oder stimmt’s nicht? Rechts für Hit, links für Miss.“*
(Meine Empfehlung war Right Track; gewählt wurde Hit or Miss, weil man den Namen sofort versteht und er dem Arbeitsnamen entspricht.)
Die Redewendung passt auch zur Bedienung: **Hit** = Treffer = rechts wischen (stimmt), **Miss** = daneben = links wischen
(stimmt nicht). Die Knöpfe können genau so heißen: links „✗ Miss“, rechts „Hit ✓“ (in allen Sprachen gleich, nur die
Erklärung „stimmt / stimmt nicht“ wird übersetzt). Damit sich das Spiel trotz des „… or …“ klar von Older or Newer abhebt:
eigene Farbe, eigenes Logo und auf der Kachel gleich das Wischen zeigen.

Technisch: Ordner `Hit-or-Miss`, Repo `Ku3rb1s/hit-or-miss`, Adresse `ku3rb1s.github.io/hit-or-miss/`,
Speicher-Kürzel `hom.`, Zwischenspeicher-Kürzel `hom`, lokaler Port **8894**.

---

## 3. Spielablauf

### 3.1 Eine Karte

```
┌──────────────────────────────┐
│  [Cover verschwommen]   ♪ ▮▮▮ │  ← Ausschnitt läuft automatisch
│                              │
│   Africa                      │  ← was zur Behauptung nötig ist,
│   Toto                        │     wird gezeigt (siehe unten)
│                              │
│   „erschien in den 70ern“     │  ← die Behauptung, groß
│                              │
│   ✗ stimmt nicht   stimmt ✓   │
└──────────────────────────────┘
   ⏱ 0:42      🔥 6      1.240
```

- **Was steht auf der Karte?** Titel und Interpret – außer dem Teil, um den es in der Behauptung geht:
  bei „ist von …“ fehlt der Interpret, bei „heißt …“ fehlt der Titel. Das Cover bleibt verschwommen
  (auf vielen Covern steht der Name des Interpreten) und wird nach der Antwort kurz scharf.
- **Musik:** Der 30-Sekunden-Ausschnitt von Deezer startet sofort, wenn die Karte erscheint. Er hilft vor allem bei
  „ist von …“ (Stimme erkennen) und bei Jahrzehnten (Klang). Die nächsten 3 Karten werden schon im Hintergrund geladen,
  damit kein Warten entsteht (wie in Older or Newer, `previewOf`).
- **Antworten:** Wischen (die Karte kippt mit, ab etwa einem Drittel der Breite zählt es; vorher springt sie zurück),
  Knöpfe ✗/✓ unten, Pfeiltasten ←/→. Nach dem Erscheinen einer Karte ist sie 0,3 s gesperrt, damit ein Doppel-Wisch
  nicht aus Versehen die nächste Karte beantwortet.
- **Rückmeldung sofort, ohne Pause:** grüner bzw. roter Blitz am Rand, kurzer Ton; bei einem Fehler erscheint für
  1,5 s unten eine Zeile mit der Wahrheit („Africa: 1982“), während schon die nächste Karte läuft.

### 3.2 Modi

| Modus | Ablauf | Wertung |
|---|---|---|
| **60 Sekunden** (Hauptmodus) | Uhr läuft 60 s. Fehler kosten **3 Sekunden**. Ende, wenn die Uhr bei 0 ist. | Punkte (siehe 3.3), Rekord je Gerät, Bestenliste „Highscores“ |
| **Sudden Death** | Keine Gesamtuhr, aber jede Karte hat **5 Sekunden**. Der erste Fehler (oder zu langsam) beendet die Runde. | Anzahl richtiger Antworten am Stück, Bestenliste „Highscores“ |
| **Tages-Challenge** | Wie 60 Sekunden, aber alle bekommen am selben Tag **dieselben Behauptungen in derselben Reihenfolge** (Zufall mit dem Datum als Startwert, wie bei Gold Record). Pro Tag eine Wertung, nachspielen erlaubt, zählt dann nicht. | Punkte, Bestenliste „Tages-Challenge“ und „Serien“, Ergebnis zum Teilen |

Der Tag wechselt nach deutscher Zeit (`Europe/Berlin`, wie Needle Drop und der Worker), damit die Bestenliste stimmt.

### 3.3 Punkte, Serien-Bonus, Zeitstrafe

- Richtige Antwort: **10 Punkte × Serien-Stufe**.
- Serien-Stufe: ab 5 richtigen in Folge ×2, ab 10 ×3, ab 20 ×4 (sichtbar als 🔥 mit Zahl, Stufenwechsel mit kleinem Effekt).
- Falsche Antwort: Serie zurück auf 0, **−3 Sekunden**.
- Warum so? Wer blind wischt, trifft etwa jede zweite Karte, verliert dauernd Zeit und kommt nie über ×1 hinaus –
  rechnerisch etwa 15 Treffer und rund 150 Punkte. Wer überlegt antwortet (etwa 2 s pro Karte, 9 von 10 richtig),
  schafft etwa 23 Treffer und mit Serien rund 350 Punkte; wer schnell *und* fehlerfrei ist, kommt über 1.000. Raten lohnt sich also nicht.
- Auf dem Endbildschirm stehen beide Zahlen: **Punkte** (für Rekord und Bestenliste) und **„27 richtig · 3 falsch“**.
- Obergrenze für die Prüfung im Worker: Mehr als 150 Karten in 60 s sind wegen der Sperre nicht möglich →
  höchstens 150 × 40 = 6.000 Punkte, immer durch 10 teilbar.

Offen (siehe Fragen): Zeit-Bonus für lange Serien (z. B. +2 s pro 10er-Serie)? Macht es spannender, aber unübersichtlicher.

### 3.4 Wahr und falsch gerecht verteilen

- Insgesamt etwa **50 % wahr / 50 % falsch**, aber nicht abwechselnd: höchstens 4 gleiche Antworten hintereinander,
  sonst merkt man ein Muster.
- Mischung der Arten (Startwert): Jahrzehnt 30 %, Interpret 30 %, Streams 15 %, Älter-als 15 %, Titel 10 %.
- **Schwierigkeit steigt in der Runde:** Die ersten Karten sind große Hits und klare Fälle („Bohemian Rhapsody ist aus den 2010ern“),
  später kommen unbekanntere Songs und knappere Behauptungen (Nachbar-Jahrzehnt, Interpret aus derselben Zeit).
  Dadurch braucht es keine Schwierigkeitswahl – und die Bestenliste ist vergleichbar.
- Songs aus allen Jahrzehnten: Die Daten haben sehr viele neue Songs (2020er sind die größte Gruppe). Damit es kein
  „2020er-Spiel“ wird, wird je Karte erst ein Jahrzehnt gelost (gleichmäßig 60er–2020er, 50er selten), dann ein Song daraus.
- Kein Song zweimal in einer Runde, kein Interpret zweimal in 5 Karten.

### 3.5 Auflösung am Ende

Nach der Runde: großer Punktestand, Rekord-Hinweis, „27 richtig · 3 falsch · beste Serie 14“, dann die Liste **aller Karten**:

```
✓  Africa – Toto            „erschien in den 70ern“   stimmt nicht · 1982
✗  It’s My Life – Bon Jovi  „ist von Dr. Alban“       stimmt nicht · Bon Jovi (2000)
                             Tipp: Dr. Alban hat auch einen Song „It’s My Life“ (1992)
✓  Espresso                 „über 3 Mrd. Streams“     stimmt · 3,25 Mrd. (Stand 07.11.2026)
```

- Fehler oben (umschaltbar „Alle / Nur Fehler“), jeder Eintrag mit kleinem Cover und ▶ zum Nachhören.
- Bei Streams immer mit Datum („Stand …“), weil die Zahlen wachsen.
- Teilen (Tages-Challenge): `Hit or Miss #12 · 640 Punkte · 27 ✓ 3 ✗ · 🔥 14` plus eine Zeile ✅✅❌✅… und der Link.

---

## 4. Welche Behauptungen gehen – und welche nicht

Alle Zahlen unten stammen aus einem Probelauf über die echten Daten (Gold Record + Older or Newer, Stand 07.11.2026).
Ausgangsmenge: 6.027 Songs → nach Entfernen von Dubletten und Cover-Bands **4.893 Songs** (ohne die rein deutschen
Playlist-Songs, wie bei Gold Record „Alle“), davon 4.137 mit geprüftem Jahr.

### 4.1 Geeignet

#### A) Jahrzehnt – „erschien in den 80ern“ (≈ 3.270 geeignete Songs)

Stichproben (echt): *All That She Wants – Ace of Base* „90er“ → stimmt (1992) · *Africa – Toto* „70er“ → stimmt nicht (1982) ·
*The Kids Aren’t Alright – The Offspring* „80er“ → stimmt nicht (1998).

Regeln:
1. Nur **geprüftes Jahr** (songs.json, years.json oder Older or Newer). Ungeprüfte Jahre nie.
2. **Keine Jahre an der Grenze**: Jahr endet auf 9 oder 0 → keine Jahrzehnt-Behauptung (weder wahr noch falsch).
   Begründung aus den Daten: Gold Record und Older or Newer sind sich bei 18 von 2.005 gemeinsamen Songs um 1–2 Jahre
   uneinig (z. B. *Like a Prayer* 1989 / 1988, *Smells Like Teen Spirit* 1991 / 1990, *Boulevard of Broken Dreams* 2004 / 2002).
   Auch *Borderline – Tame Impala* steht auf 2020, die Single kam 2019. Ein Jahr Abweichung darf nie die Antwort umdrehen.
3. Sind sich beide Quellen uneinig, gilt der Song nur, wenn **beide Jahre im selben Jahrzehnt** liegen.
4. **Keine Cover-Versionen**: Gibt es den Titel in den Daten von mehreren Interpreten (101 Fälle, z. B. *Fast Car* von
   Tracy Chapman 1988, Jonas Blue 2015, Luke Combs 2023), keine Jahres-Behauptung – sonst ist unklar, ob der Song oder die Aufnahme gemeint ist.
5. **Keine Neuaufnahmen/Neuausgaben**: Titel mit „Taylor’s Version“, „Remaster“, „ - … Soundtrack“ o. ä. raus
   (*Style (Taylor’s Version)* steht mit 2013 drin, die Aufnahme ist von 2023; *Numb - Unshatter Film Soundtrack* ist der
   Linkin-Park-Song von 2003 mit neuer Deezer-Nummer).
6. Falsche Jahrzehnte nur zwischen 50er und 2020er (der Probelauf hat sonst „2030er“ erzeugt). Leicht: 2+ Jahrzehnte daneben,
   schwer: Nachbar-Jahrzehnt.
7. 50er (nur 13 Songs) mit 60ern zusammen als „vor 1970“.

#### B) Vor/nach einem Jahr – „erschien vor 2000“ (≈ 3.950 Songs)

Abwechslung zum Jahrzehnt, gleiche Regeln 1, 3, 4, 5. Nur runde Grenzen (1970, 1980 … 2020) und **mindestens 3 Jahre Abstand**
zwischen Songjahr und Grenze. Keine genauen Jahre („erschien 1985“): bei 18 Abweichungen in 2.005 Songs wäre das
unfair, und in 2 Sekunden auch kaum zu wissen.

#### C) Interpret – „ist von Bon Jovi“ (alle 4.893 Songs, 2.392 Interpreten)

Wahr: der Interpret ohne „feat.“-Teil (*I Need Your Love (feat. Ellie Goulding)* → „ist von Calvin Harris“).
„&“ bleibt, wenn es zum Namen gehört (*Simon & Garfunkel*, *Earth, Wind & Fire*).

Falsche Interpreten – hier lauern die meisten Fallen. Regeln:
1. **Nicht beteiligt**: Der falsche Name darf in keinem Teil des echten Interpreten-Felds vorkommen und umgekehrt
   (Vergleich nach ganzen Wörtern, Groß-/Kleinschreibung, Akzente und „The“ egal).
   Gefundene Fälle: *Sonny & Cher* ↔ *Cher*, *Jon Bon Jovi* ↔ *Bon Jovi*, *Elton John & Dua Lipa* ↔ *Dua Lipa*,
   *Macklemore & Ryan Lewis* ↔ *Macklemore*, *Selena Gomez & The Scene* ↔ *Selena Gomez*, *Wisin & Yandel* ↔ *Yandel*.
2. **Schreibweisen zusammenführen**: 19 Interpreten stehen doppelt in den Daten (*Jay-Z / JAY Z*, *Celine Dion / Céline Dion*,
   *OutKast / Outkast*, *The Black Eyed Peas / Black Eyed Peas*, *Jungkook / Jung Kook*, *MØ / M* …). Sonst entsteht
   „Crazy in Love ist von JAY Z“ als angeblich falsch.
3. **Keine Cover-Falle**: Hat der falsche Interpret einen Song **mit demselben Titel** (*It’s My Life*: Bon Jovi und Dr. Alban,
   *Apologize*: Timbaland und OneRepublic – das ist sogar dieselbe Aufnahme), ist er als falsche Antwort verboten.
4. **Bekannte Namen**: Der falsche Interpret muss selbst bekannt sein (mindestens 3 Songs in den Daten oder unter den
   bekanntesten 1.500). Im Probelauf kamen sonst Namen wie *Banners*, *Aquilo* oder *Catherine Deneuve* – das ist
   kein Rätsel, sondern Zufall.
5. **Passend zur Zeit**: Der falsche Interpret hatte Hits in ±5 Jahren um den Song (schwer: gleiches Jahrzehnt und
   gleiches Deezer-Genre). *Something in the Way (Nirvana) ist von Whitney Houston* ist zu leicht.
6. **Cover-Bands und Karaoke raus** aus allen Arten: *Hello I’m Adele*, *Bruno Mars Cover Band*, *Creedence Clearwater
   Revival Experience*, *T»MA a.k.a. Falco*, Titel mit „(Karaoke)“.
7. **Alle Mitwirkenden** (ab 1.0.4): Deezer nennt im Interpreten-Feld oft nur den Hauptinterpreten. Die Liste der Mitwirkenden
   aus Gold Record (`data/feat.json`, 1.131 Songs) zählt mit – sonst wäre „Under Pressure (Queen) ist von David Bowie“ „falsch“.
8. **Keine eigene Fassung** (ab 1.0.4, Hinweis aus der Fehler-Durchsicht: „Good Luck, Babe! ist von Disco Lines“ – Disco Lines
   hat einen bekannten Remix): Wer bei Deezer eine Fassung mit demselben Titel hat (Cover, Remix, auch als Remixer im Titel),
   kommt bei diesem Song nie als falscher Interpret (`scripts/build-versions.js`). Fassungen, die es bei Deezer nicht gibt,
   stehen von Hand in `scripts/versions-extra.json`.

#### D) Titel – „Dieser Song heißt »Livin’ on a Prayer«“ (Interpret wird gezeigt, Titel nicht)

Gut für Abwechslung und zum Hören. Regeln:
1. Falscher Titel vom **selben Interpreten** (schwer) oder von einem Song aus derselben Zeit (leicht).
2. Titel ohne Zusätze in Klammern vergleichen; ähnliche Titel sind verboten (einer im anderen enthalten: *Alive* / *I’m Alive*,
   *Kids* / *The Kids Aren’t Alright*).
3. Keine Titel mit mehreren Interpreten (Regel 4 bei A).
4. Seltener einsetzen (10 %): Es kann vorkommen, dass ein falscher Titel als Zeile im laufenden Song gesungen wird –
   das lässt sich mit den Daten nicht prüfen.

#### E) Streams – „hat über 2 Mrd. Streams bei Spotify“ (1.360 Songs mit genauer Zahl)

Stichproben: *Treat You Better – Shawn Mendes* „über 2 Mrd.“ → stimmt (3,24) · *Scream & Shout – will.i.am* „über 1,5 Mrd.“ → stimmt nicht (1,14) ·
*Hit ’Em Up – 2Pac* „über 3 Mrd.“ → stimmt nicht (1,11).

| Grenze | wahr | falsch (≤ 85 %) | Grauzone, wird nicht gestellt |
|---|---|---|---|
| 1,5 Mrd. | 623 | 484 | 253 |
| 2 Mrd. | 317 | 890 | 153 |
| 2,5 Mrd. | 151 | 1.096 | 113 |
| 3 Mrd. | 79 | 1.223 | 58 |
| 4 Mrd. | 16 | 1.321 | 23 |

Regeln:
1. **Nur „über …“**, nie „unter …“ oder „unter 1 Mrd.“: Die Liste von kworb.net ist **nicht vollständig** – *We Found Love*
   von Rihanna fehlt ganz, obwohl er sicher über 1 Mrd. hat. „Fehlt in der Liste“ heißt also nicht „wenig Streams“.
2. **Wahr** ist sicher, denn Streams wachsen nur: wer heute über 2 Mrd. hat, hat es auch morgen.
3. **Falsch** braucht Abstand, weil die Zahlen wachsen: höchstens 85 % der Grenze, bei Songs der letzten 3 Jahre höchstens 70 %
   (*BIRDS OF A FEATHER* kam in gut 2 Jahren auf 4,09 Mrd. – rund 130 Mio. im Monat).
4. **Stand-Datum** wird mitgeliefert. Sind die Zahlen älter als 6 Monate, stellt das Spiel keine „falsch“-Behauptungen
   mehr zu Streams, bis neue Zahlen da sind. Die Zahlen alle 2–3 Monate erneuern (gleiches Skript wie für Gold Record).
5. Zuordnung über die Deezer-Nummer **und** über Titel + Interpret: 100 der 1.393 Songs haben in der Stream-Liste eine
   andere Deezer-Nummer als in den Songdaten (*Smells Like Teen Spirit*, *Billie Jean* …).
6. Grenzen in einfachen Zahlen (1,5 · 2 · 2,5 · 3 · 4 Mrd.), Anzeige in der Sprache des Spielers („2 Mrd.“, „2 billion“, „2 milliards“).

#### F) Älter als – „ist älter als »Umbrella« (Rihanna)“

Bekannt aus Older or Newer, hier als schnelle Ja/Nein-Frage. Beide Songs mit geprüftem Jahr, Regeln 3–5 von A,
**mindestens 3 Jahre Abstand** (wegen der 1–2 Jahre Unsicherheit). Der zweite Song wird nur als Text gezeigt.

#### G) Mehr Streams als – „hat mehr Spotify-Streams als »Hey Ya!«“ (später, optional)

Beide Songs in der Stream-Liste, der größere mindestens 30 % vorn; ist der kleinere ein Song der letzten 3 Jahre, 60 % vorn.

### 4.2 Nicht geeignet (mit Begründung)

| Behauptung | Warum nicht |
|---|---|
| Genaues Jahr („erschien 1985“) | 18 Abweichungen von 1–2 Jahren zwischen den beiden geprüften Quellen; zu knapp für ein Schnell-Spiel. |
| Ungeprüfte Jahre (ca. 760 Songs aus extra/more) | Deezer-Jahre sind oft das Jahr eines Samplers oder einer Neuausgabe. |
| Genre („ist ein Rocksong“) | Feld `g` ist das Deezer-Albumgenre, viel zu grob (2.322 × „pop“); Streit vorprogrammiert. |
| „Ist deutschsprachig“ | Feld `de` heißt nur „kam in einer deutschen Playlist vor“ – auch Green Day, Modern Talking, Scooter sind markiert. |
| Chart-Platzierung, „war Nummer 1“ | Gibt es in den Daten nicht. |
| „Unter X Streams“ / „unter 1 Mrd.“ | Stream-Liste unvollständig (siehe E1). |
| Band oder Solo, Herkunftsland, Grammy, Debütsingle | Keine Daten. |
| Album-Name, Länge des Songs | Deezer liefert das Album, auf dem der Track liegt (oft ein Sampler); Längen hängen von der Version ab. |
| „Erschien im selben Jahr wie …“ | Braucht genaue Jahre (siehe oben). |

### 4.3 Allgemeine Regeln für alle Arten

- Jede Behauptung wird beim Erstellen **gegengeprüft**: Ein zweiter Durchlauf rechnet die Antwort unabhängig noch einmal aus;
  stimmen beide nicht überein, wird die Karte verworfen. Das Bau-Skript (Abschnitt 5) schreibt außerdem eine Liste mit
  zufälligen Beispiel-Behauptungen je Art, die man vor dem Hochladen überfliegen kann.
- „Melden“-Knopf in der Auflösung („Diese Antwort ist falsch“) – speichert lokal und zeigt eine kurze Anleitung für eine
  Rückmeldung (ohne Server, ohne Tracking). Offen, ob gewünscht.
- Lädt der Ausschnitt eines Songs nicht, wird die Karte stillschweigend durch eine andere ersetzt (die Uhr läuft erst,
  wenn die erste Karte bereit ist).

---

## 5. Daten: eigenes Paket statt direkt lesen

**Empfehlung: eigenes kompaktes Datenpaket**, gebaut per Skript `scripts/build-data.js` im neuen Spiel.

Warum nicht direkt aus Gold Record lesen? Technisch ginge es (alle Spiele liegen auf derselben Adresse ku3rb1s.github.io),
aber:
- Gold Record lädt 7 Dateien mit zusammen rund 1 MB; hier reicht etwa ein Drittel.
- Jede Formatänderung in Gold Record würde das neue Spiel kaputt machen, ohne dass es jemand merkt.
- Lokal laufen die Spiele auf verschiedenen Ports, da würde das Lesen am Browser-Schutz scheitern.
- Die Regeln aus Abschnitt 4 (Dubletten, Cover-Bands, Grenzjahre, uneinige Quellen, Schreibweisen) lassen sich einmal im
  Skript prüfen statt bei jedem Start auf dem Handy.

**Das Skript liest:** `Gold-Record/data/songs.json`, `extra.json`, `more.json`, `years.json`, `covers.json`, `genres.json`,
`billions.json` und `Older-or-Newer/data/songs.json`.

**Es schreibt** `data/tracks.json` (geschätzt 300–400 KB, gepackt etwa 120 KB):

```json
{ "built": "2026-11-07", "streamsAt": "2026-11-07", "v": 1,
  "artists": ["Toto", "Bon Jovi", …],                    // jeder Interpret einmal, Schreibweisen zusammengeführt
  "tracks": [[1079668, "Africa", 0, 1982, 3, "c-md5|mb:…", 0.12, 2820000000, "rock", 1]] }
//            Deezer-ID, Titel, Interpret-Nr., Jahr, Jahr-Güte (0 ungeprüft … 3 zwei Quellen einig), Cover,
//            Bekanntheit 0–1, Streams (oder 0), Genre, Merkmale (Bits: Cover-Version, Neuaufnahme, Grenzjahr …)
```

Dazu `data/blocked.json` mit den vorberechneten Verboten für falsche Interpreten (wer mit wem verwandt/gleicher Titel ist)
und ein Bericht `scripts/.cache/report.txt` mit Zählungen und 20 Beispiel-Behauptungen je Art.

Die Behauptungen selbst entstehen erst im Spiel (mit Zufall bzw. Datum als Startwert) – so gibt es unbegrenzt viele.
Die Tages-Challenge hängt damit an der Datenversion: Daten nur zwischen zwei Tagen erneuern und `v` erhöhen; das Spiel
holt vor der Tages-Challenge immer die neueste Datei (nicht aus dem Zwischenspeicher), damit alle dasselbe sehen.

Neue Songs in Gold Record oder Older or Newer → Skript erneut laufen lassen, Datenversion erhöhen.

---

## 6. Einbindung in die Jukebox (Checkliste für den Bau)

Alles nach `Spiele-Hub/JUKEBOX.md`, Abschnitt „Neues Spiel“:

1. **Ordner und Repo**: `Hit-or-Miss`, Repo `Ku3rb1s/hit-or-miss`, GitHub Pages auf `main`, `server.js` mit Port 8894,
   `CLAUDE.md` mit `@../Spiele-Hub/JUKEBOX.md` und dem Hinweis auf die gemeinsamen Dateien (wie bei Needle Drop).
2. **Gemeinsame Dateien**: In `Spiele-Hub/shared/games.json` eintragen
   (`{ "name": "Hit or Miss", "dir": "Hit-or-Miss", "repo": "Ku3rb1s/hit-or-miss", "url": …, "port": 8894, "sw": "hom", "storage": "hom.", "set": "basis" }`),
   dann `node scripts/share.js --write`. Damit kommen Design, Schrift, Sprachen, Profil, Abgleich, App-Modus und `sw.js`.
3. **`index.html`**: Reihenfolge `lang/*.js`, `profile.js`, `sync.js`, `i18n.js`, `deezer.js`, `game.js`, `pwa.js`;
   Viewport `maximum-scale=1,viewport-fit=cover`; Manifest mit `"scope": "/"`; Logo-Knopf mit `id="logoBtn"` (für das Spiele-Menü).
4. **Speicher** (nur unter `hom.`):
   `hom.best.60s` (Punkte), `hom.best.sd` (Sudden Death), `hom.daily.<Tag>` (Ergebnis des Tages), `hom.dailyLog` (Tag → Punkte),
   `hom.stats` (Statistik je Gerät), `hom.ach` (Erfolge), `hom.top` (beste Runden), Einstellungen (`hom.sfx`, `hom.vol` – nicht abgeglichen).
5. **Abgleich – `RULES` in `shared/js/sync.js`** ergänzen:
   `[/^hom\.best\./, 'max']`, `[/^hom\.daily\.\d{4}-\d{2}-\d{2}$/, 'day']`, `[/^hom\.dailyLog$/, 'mapmax']`,
   `hom` in die Erfolge-Regel (`/^(gr|mq|hom)\.ach$/`, `union`), `hom.top` (`top`), `hom.stats` (`device`) plus Zusammenzählen in `COMBINE`.
6. **Bestenliste**
   - `BOARD` in `shared/js/sync.js`: `daily` (aus `hom.daily.<Tag>`, Berliner Tag, nur `done && !late`), `high`
     (`{ game: 'hit-or-miss', cat: '60s', score: hom.best.60s }` und `cat: 'sd'`), `streak` (aus `hom.dailyLog`).
   - `Spiele-Hub/js/leaderboard.js`: `DAILY_RESULTS`, `HIGH` (Kategorien „60 Sekunden“ / „Sudden Death“, Anzeige „640 Punkte“ bzw.
     „31 in Folge“), `VIEWS` (in allen drei Ansichten ergänzen), `todayOf` (Berliner Tag).
   - Worker `Spiele-Hub/worker/sync.js`: `LB_GAMES['hit-or-miss'] = v => v >= 0 && v <= 6000 && v % 10 === 0`,
     `LB_HIGH['hit-or-miss'] = { cat: /^(60s|sd)$/, ok: v => v >= 1 && v <= 6000 }` (Sudden Death: höchstens ~2.000 sinnvoll),
     `LB_STREAK['hit-or-miss'] = true`, und **`http://localhost:8894` in die Liste der erlaubten Adressen** (Zeile 30, sonst
     klappt der lokale Test nicht). Keine neue Tabelle nötig. Danach `npx wrangler deploy`.
7. **5 Sprachen**: Alle Texte mit `tx('…')`, Übersetzungen in `js/lang/{en,fr,es,nb}.js`. Die Behauptungen sind Textbausteine
   mit Platzhaltern – Jahrzehnte klingen je Sprache anders („in den 80ern“, „in the 80s“, „dans les années 80“,
   „en los años 80“, „på 80-tallet“), darum ein eigener Baustein je Art. Eigennamen (Hit or Miss) in `scripts/lang.config.js`.
   Prüfen mit `node scripts/share.js --lang`.
8. **Spiele-Menü**: in `GAMES` in `shared/js/pwa.js` ergänzen (`['Hit or Miss', 'hit-or-miss/', 'icon-192.png']`), dann `--write`
   (betrifft alle Spiele → überall `?v=` erhöhen, kurz testen, einchecken).
9. **Kachel**: Eintrag in `Spiele-Hub/apps.json` (id `hit-or-miss`, Farbe z. B. Türkis `#14b8a6` oder Violett `#8b5cf6` –
   beide noch nicht vergeben (Bingo Rosa, Needle Drop Orange, Older or Newer Grün, Gold Record Blau); Beschreibung in 5 Sprachen, Tags `solo`, `daily`, `nologin`) und in die Tabelle in `JUKEBOX.md`.
10. **Logo/Icons**: eigenes Logo im Stil der anderen (gewählt: „Kartenstapel“ – drei Karten wie beim Wischen, Mint = Hit, Koralle = Miss, Magenta als Akzent; Entwürfe in logo-options/).
11. **Musik**: Deezer per JSONP wie in Gold Record (`js/deezer.js` übernehmen); auf dem iPhone startet Ton erst nach einem
    Tipp – der „Los“-Knopf schaltet den Ton frei.

---

## 7. Erfolge (Vorschlag, im Format der anderen Spiele)

`['first', '🎧', 'Erste Runde', 'Eine Runde gespielt']`, `['streak10', '🔥', 'Heiße Spur', '10 richtig in Folge']`,
`['streak25', '🚀', 'Nicht zu bremsen', '25 richtig in Folge']`, `['p500', '⭐', 'Fünfhundert', '500 Punkte in einer Runde']`,
`['p1000', '🏆', 'Tausender', '1.000 Punkte in einer Runde']`, `['clean', '💯', 'Fehlerfrei', '20 Karten ohne Fehler in einer Runde']`,
`['sd20', '☠️', 'Überlebt', '20 im Sudden Death']`, `['daily3', '📅', 'Dranbleiben', '3 Tage in Folge die Tages-Challenge']`,
`['daily7', '🗓️', 'Eine ganze Woche', '7 Tage in Folge']`, `['decades', '📻', 'Zeitreisender', 'In einer Runde Songs aus 6 Jahrzehnten richtig']`.

---

## 8. Offene Fragen an dich

1. ~~Name~~ – entschieden: **Hit or Miss**. Sollen die Knöpfe „Miss“ / „Hit“ heißen (Vorschlag) oder „stimmt nicht“ / „stimmt“?
2. **Was soll man sehen?** Titel + Interpret auf der Karte (wie vorgeschlagen), oder zusätzlich ein Modus **„Nur hören“**
   (keine Namen, man muss den Song am Klang erkennen) – mit eigener Bestenliste wie bei Older or Newer?
3. **Zeitstrafe**: 3 Sekunden pro Fehler passend, oder lieber 2 / 5? Und soll es für lange Serien **Bonus-Zeit** geben?
4. **Schwierigkeit**: Reicht die steigende Schwierigkeit innerhalb der Runde, oder willst du eine Auswahl Leicht/Normal/Schwer
   (dann je Stufe eine eigene Bestenliste)?
5. **Themen**: Nur „Alle“, oder auch Runden nur mit 80ern, 90ern, Deutsch …? (Für die Bestenliste würde nur „Alle“ zählen.)
6. **Deutsche Songs**: Die vielen deutschen Playlist-Songs (z. B. Zartmann, AYLIVA) wie bei Gold Record nur in einem Thema „Deutsch“, oder
   auch in „Alle“?
7. **Streams**: Ist „über 2 Mrd. Streams bei Spotify“ okay, obwohl die Musik von Deezer kommt? (Die Zahlen sind von Spotify, weil
   Deezer keine Gesamtzahlen veröffentlicht.)
8. **Melden-Knopf** für falsche Fakten in der Auflösung – gewünscht?
9. **Sudden Death** mit 5 Sekunden pro Karte – oder ganz ohne Uhr?
10. **Farbe und Logo**: Vorlieben?
