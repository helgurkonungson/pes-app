---
id: cb-data-de
version: 1
title: Daten und Tabellen: Grundlagen
description: Wie tabellarische Daten aufgebaut sind, wie du sie sauber hältst, mit Formeln rechnest, Werte nachschlägst, zusammenfasst und ehrlich in Diagrammen zeigst. Für Excel, Google Tabellen und ähnliche Programme.
goal: Sicher mit Tabellen arbeiten und Schlüsse aus Daten ziehen
language: German
minutes: 7
hue: 174
---

# data-01 | Wie Daten aufgebaut sind | Was tabellarische Daten sind
## Zeilen und Spalten
Die meisten Arbeitsdaten stecken in **Tabellen**. In einer gut aufgebauten Tabelle gilt:
- jede **Zeile** ist ein Datensatz (ein Verkauf, ein Kunde, ein Tag);
- jede **Spalte** ist ein Merkmal dieses Datensatzes (Datum, Betrag, Stadt);
- in der ersten Zeile stehen die **Überschriften** der Spalten.

Dieses Format heißt „aufgeräumte Daten“ (tidy data). Formeln, Filter, Pivot-Tabellen und jedes Analysewerkzeug arbeiten damit.

## Datentypen
Jede Spalte hat einen Typ:
- **Zahlen** – damit kann man rechnen (Summe, Anzahl);
- **Text** – Namen, Bezeichnungen, Kategorien;
- **Datum und Uhrzeit** – im Programm ebenfalls Zahlen, deshalb kann man sie subtrahieren und gruppieren;
- **Wahrheitswerte** – WAHR/FALSCH.

Ein häufiger Fehler ist eine Zahl, die als Text gespeichert ist (zum Beispiel „1.200 €“). Das Programm kann sie nicht addieren. Schreib die Einheit lieber in die Überschrift: „Betrag in €“.

!key Eine Zeile ist ein Datensatz, eine Spalte ein Merkmal, die erste Zeile enthält Überschriften.
!key Eine aufgeräumte Tabelle funktioniert mit Formeln, Filtern und Pivot-Tabellen.
!key Haupttypen: Zahlen, Text, Datum, Wahrheitswerte.
!key Misch keine Zahlen und Text in einer Zelle: Einheiten gehören in die Überschrift.

?q:e Wofür steht in einer aufgeräumten Tabelle eine Zeile?
- Für ein Merkmal, etwa „Stadt“
+ Für einen Datensatz, etwa einen Verkauf
- Für den Titel der Tabelle
- Für die Summe aller Daten
= Zeilen sind Datensätze, Spalten sind Merkmale.

?q:m Warum ist „1.200 €“ in einer Zelle eine schlechte Idee?
- Es ist zu lang
+ Das Programm behandelt es als Text und kann es nicht mit anderen Beträgen addieren
- Euro dürfen nicht in Tabellen stehen
- Die Zelle wird rot
= Schreib die Einheit in die Überschrift: „Betrag in €“.

?q:m Welchen Datentyp hat die Spalte „Bestelldatum“?
- Text
- Wahrheitswert
- Nur eine bedeutungslose Zahl
+ Datum – im Programm eine Zahl, deshalb kann man Datumswerte subtrahieren und gruppieren
= Datumswerte werden als Zahlen gespeichert, so lassen sich Fristen berechnen.

?q:h Eine Tabelle hat die Spalten „Januar“, „Februar“, „März“, und in den Zeilen stehen die Vertriebsmitarbeitenden. Warum ist das für Analysen unpraktisch?
+ Ein Merkmal (der Monat) ist auf mehrere Spalten verteilt; besser sind die Spalten „Mitarbeiter“, „Monat“, „Betrag“
- Gar nicht, das ist das ideale Format
- Monate darf man nicht großschreiben
- Es gibt zu wenige Zeilen
= In aufgeräumten Daten ist jedes Merkmal eine Spalte.

?r:m Was gehört in die erste Zeile einer Tabelle?
+ Die Spaltenüberschriften
- Die Summen
- Eine leere Zeile
- Der Firmenname
= Formeln, Filter und Pivot-Tabellen brauchen Überschriften.

?r:e Was ist eine Spalte in einer aufgeräumten Tabelle?
- Ein Datensatz
+ Ein Merkmal der Datensätze
- Eine zufällige Sammlung von Werten
- Ein Platz für Kommentare
= Zum Beispiel „Stadt“ oder „Betrag“.

!open Nimm eine Tabelle aus deinem Beruf oder Alltag (Budget, Verkäufe, To-do-Liste). Beschreib ihre Zeilen, Spalten und Datentypen und was man verbessern könnte.
!rubric Zeilen und Spalten werden beschrieben
!rubric Datentypen werden genannt
!rubric Eine Verbesserung wird vorgeschlagen
!model Meine Ausgabentabelle: Eine Zeile ist ein Einkauf, die Spalten sind Datum (Datum), Kategorie (Text), Betrag (Zahl) und Karte oder bar (Text). Verbesserung: Die Beträge stehen gerade als „35€“ da; ich entferne das „€“ und schreibe die Einheit in die Überschrift „Betrag in €“, damit man sie addieren kann.

# data-02 | Wie Daten aufgebaut sind | Saubere Daten
## Typisches Durcheinander
Eine Analyse auf unsauberen Daten führt zu falschen Schlüssen. Die häufigsten Probleme:
- **Duplikate** – derselbe Datensatz zweimal;
- **überflüssige Leerzeichen** und unterschiedliche Schreibweisen: „Köln“, „köln“, „Köln “;
- **verschiedene Datumsformate**: 03.04.2025 und 2025-04-03 in einer Spalte;
- **verbundene Zellen** – sie stören Sortierung und Filter;
- **fehlende Werte** und Platzhalter wie „—“, „k. A.“ oder 0 statt „keine Daten“;
- **mehrere Tabellen auf einem Blatt** und Summen mitten in den Daten.

## So bereinigst du
- Entferne Duplikate mit dem eingebauten Befehl (Daten → Duplikate entfernen).
- Die Funktion **GLÄTTEN** (TRIM) entfernt überflüssige Leerzeichen; **GROSS/KLEIN/GROSS2** (UPPER/LOWER/PROPER) vereinheitlichen die Schreibweise.
- Nutz für Kategorien **Dropdown-Listen** (Datenüberprüfung), damit keine neuen Schreibweisen entstehen.
- Ein leerer Wert und eine Null sind nicht dasselbe: 0 heißt „null“, eine leere Zelle heißt „unbekannt“.
- Bewahr die Originaldaten getrennt auf und bereinige eine Kopie.

!key Unsaubere Daten: Duplikate, Leerzeichen, gemischte Formate, verbundene Zellen.
!key Null und ein leerer Wert bedeuten Verschiedenes.
!key Dropdown-Listen verhindern uneinheitliche Kategorien.
!key Behalte die Originaldaten und bereinige eine Kopie.

?q:e Was stört Sortierung und Filter am häufigsten?
- Spaltenüberschriften
+ Verbundene Zellen
- Zahlenwerte
- Datumswerte in einem Format
= Verbundene Zellen zerstören das Raster aus Zeilen und Spalten.

?q:m Die Spalte „Stadt“ enthält „Bonn“, „bonn“ und „Bonn “. Was passiert beim Zählen nach Städten?
- Alles wird richtig gezählt
+ Das Programm zählt sie womöglich als verschiedene Städte
- Die Tabelle löscht die überflüssigen Zeilen
- Ein Formelfehler erscheint
= Schreibweise vereinheitlichen und Leerzeichen entfernen.

?q:m Was ist der Unterschied zwischen einer leeren Zelle und einer Null in der Spalte „Umsatz“?
+ Null heißt, es gab keinen Umsatz; eine leere Zelle heißt, die Daten fehlen
- Kein Unterschied
- Eine leere Zelle bedeutet immer null
- Null bedeutet einen Fehler
= Leere Werte durch Nullen zu ersetzen verzerrt Mittelwerte und Summen.

?q:h Vor der Verkaufsanalyse findest du doppelte Bestellungen. Was ist richtig?
- Die Duplikate direkt in der Originaldatei löschen und keine Kopie behalten
+ Das Original behalten, in einer Kopie die Duplikate finden und entfernen und prüfen, wie viele Zeilen wegfielen
- Die Duplikate lassen – sie fallen kaum ins Gewicht
- Alle Zeilen mit gleichen Beträgen löschen
= Das Original ist dein Sicherheitsnetz; gleicher Betrag heißt nicht automatisch Duplikat.

?r:m Was macht die Funktion GLÄTTEN (TRIM)?
- Sie löscht leere Zeilen
+ Sie entfernt überflüssige Leerzeichen im Text
- Sie wandelt Text in Zahlen um
- Sie entfernt Duplikate
= Das hilft, Schreibweisen zu vereinheitlichen.

?r:e Wie verhinderst du uneinheitliche Schreibweisen von Kategorien?
+ Mit einer Dropdown-Liste
- Durch Großschreibung
- Durch verbundene Zellen
- Indem du die Spalte löschst
= Die Liste begrenzt, was eingegeben werden kann.

!open Beschreib drei Datenprobleme, die dir in Arbeitstabellen begegnet sind (oder begegnen könnten), und wie du sie lösen würdest.
!rubric Drei konkrete Probleme
!rubric Je eine Lösung
!rubric Arbeiten mit einer Kopie oder Prüfen des Ergebnisses wird erwähnt
!model 1) Datumswerte in verschiedenen Formaten – ich bringe sie in ein Datumsformat und prüfe, dass nach Zeit sortiert wird. 2) Produktnamen mit überflüssigen Leerzeichen – ich wende GLÄTTEN an. 3) Doppelte Bestellungen nach einem Export – ich entferne sie in einer Kopie mit „Duplikate entfernen“ und vergleiche die Zeilenzahl vorher und nachher.

# data-03 | Formeln | Formeln und Bezüge
## So funktioniert eine Formel
Eine Formel beginnt mit dem Zeichen **=**. Zum Beispiel multipliziert `=B2*C2` die Werte aus den Zellen B2 und C2. Ändern sich die Ausgangszahlen, wird das Ergebnis automatisch neu berechnet – das ist die Stärke von Tabellen.

Grundfunktionen (im deutschen Excel; in Klammern die englischen Namen):
- **SUMME** (SUM) – Summe: `=SUMME(D2:D100)`;
- **MITTELWERT** (AVERAGE) – Durchschnitt;
- **ANZAHL** (COUNT) – wie viele Zellen Zahlen enthalten; **ANZAHL2** (COUNTA) – wie viele nicht leer sind;
- **MIN / MAX**.

Mit deutschen Ländereinstellungen werden Argumente durch Semikolon getrennt: `=WENN(A2>0;1;0)`.

## Relative und absolute Bezüge
Wenn du eine Formel nach unten kopierst, **verschieben** sich die Bezüge: Aus `=B2*C2` wird in der nächsten Zeile `=B3*C3`. Das sind **relative** Bezüge.

Soll ein Bezug fest bleiben (zum Beispiel ein Wechselkurs in Zelle F1), fixierst du ihn mit Dollarzeichen: `=B2*$F$1`. Das ist ein **absoluter** Bezug. In Excel wechselst du die Bezugsart bequem mit der Taste F4.

!key Eine Formel beginnt mit „=“ und rechnet neu, wenn sich die Daten ändern.
!key SUMME, MITTELWERT, ANZAHL, MIN und MAX sind die Grundfunktionen.
!key Relative Bezüge verschieben sich beim Kopieren einer Formel.
!key $F$1 ist ein absoluter Bezug – er verschiebt sich nicht.

?q:e Mit welchem Zeichen beginnt eine Formel?
- Mit #
+ Mit =
- Mit $
- Mit *
= Das Gleichheitszeichen zeigt dem Programm, dass eine Formel folgt.

?q:m Die Formel =B2*C2 wird eine Zeile nach unten kopiert. Was ergibt sich?
- =B2*C2
+ =B3*C3
- =C2*D2
- Ein Fehler
= Relative Bezüge wandern mit der Formel mit.

?q:m Der Dollarkurs steht in Zelle F1. Welche Formel zum Umrechnen des Betrags in B2 lässt sich korrekt nach unten kopieren?
- =B2*F1
+ =B2*$F$1
- =$B$2*F1
- =B2+F1
= Der Bezug auf den Kurs muss mit Dollarzeichen fixiert werden.

?q:h Was ist der Unterschied zwischen ANZAHL (COUNT) und ANZAHL2 (COUNTA)?
+ ANZAHL zählt Zellen mit Zahlen, ANZAHL2 alle nicht leeren Zellen
- Es gibt keinen
- ANZAHL2 zählt nur leere Zellen
- ANZAHL addiert die Werte
= Enthält der Bereich Text, unterscheiden sich die Ergebnisse.

?r:m Was bedeuten die Dollarzeichen in $F$1?
- Dass die Zelle Geld enthält
+ Dass der Bezug absolut ist und sich beim Kopieren nicht verschiebt
- Dass die Zelle mit einem Passwort geschützt ist
- Dass die Formel einen Fehler enthält
= Das Dollarzeichen fixiert Spalte und Zeile.

?r:e Welche Funktion berechnet den Durchschnitt?
- SUMME (SUM)
+ MITTELWERT (AVERAGE)
- ANZAHL (COUNT)
- MAX
= MITTELWERT teilt die Summe durch die Anzahl der Zahlen.

!open Du hast die Spalten „Preis“ (B) und „Menge“ (C) und einen Rabattsatz in Zelle F1. Schreib eine Formel für den rabattierten Betrag in Zeile 2, die man nach unten kopieren kann, und erklär die Wahl der Bezüge.
!rubric Die Formel ist richtig
!rubric Der Rabatt ist mit einem absoluten Bezug fixiert
!rubric Es wird erklärt, warum B2 und C2 relativ sind
!model =B2*C2*(1-$F$1). B2 und C2 sind relativ – beim Kopieren nach unten werden sie zu B3, C3 und so weiter für jede Zeile. Der Rabattsatz gilt für alle gleich, deshalb ist $F$1 fixiert und verschiebt sich nicht.

# data-04 | Formeln | Bedingungen: WENN und Zählen nach Bedingung
## Die Funktion WENN
**WENN** (IF) wählt ein Ergebnis abhängig von einer Bedingung: `=WENN(Bedingung; Dann_Wert; Sonst_Wert)`.

Beispiel: `=WENN(D2>=100000;"Groß";"Normal")` kennzeichnet Bestellungen ab 100.000 als groß.

Bedingungen bestehen aus Vergleichen: `>`, `<`, `>=`, `<=`, `=`, `<>` (ungleich). Mehrere Bedingungen verknüpfst du mit **UND** (AND) und **ODER** (OR): `=WENN(UND(D2>0;E2="Berlin");1;0)`.

## Zählen und summieren nach Bedingung
- **ZÄHLENWENN** (COUNTIF) – wie viele Zellen eine Bedingung erfüllen: `=ZÄHLENWENN(E2:E100;"Berlin")`.
- **SUMMEWENN** (SUMIF) – Summe nach Bedingung: `=SUMMEWENN(E2:E100;"Berlin";D2:D100)` – der Umsatz nur für Berlin.
- Für mehrere Bedingungen gibt es **ZÄHLENWENNS** und **SUMMEWENNS** (COUNTIFS, SUMIFS).

Lange Ketten verschachtelter WENN-Funktionen sind schwer zu lesen. Bei vielen Varianten ist eine eigene Nachschlagetabelle besser – darum geht es in der nächsten Lektion.

!key WENN(Bedingung; Dann; Sonst) wählt ein Ergebnis nach einer Bedingung.
!key UND / ODER verknüpfen mehrere Bedingungen.
!key ZÄHLENWENN und SUMMEWENN zählen und summieren nach Bedingung.
!key Viele verschachtelte WENN sind ein Zeichen, dass du eine Nachschlagetabelle brauchst.

?q:e Was liefert =WENN(5>3;"ja";"nein")?
+ „ja“
- „nein“
- 5
- Einen Fehler
= Die Bedingung 5>3 ist wahr, also kommt das zweite Argument zurück.

?q:m Welche Formel zählt die Bestellungen aus Bonn im Bereich E2:E100?
- =SUMME(E2:E100;"Bonn")
+ =ZÄHLENWENN(E2:E100;"Bonn")
- =WENN(E2:E100="Bonn")
- =MITTELWERT(E2:E100)
= ZÄHLENWENN zählt die Zellen, die die Bedingung erfüllen.

?q:m Wie schreibst du in einer Formel „ungleich“?
- !=
- ><
+ <>
- =/
= In Tabellen schreibt man „ungleich“ als <>.

?q:h Du brauchst den Berliner Umsatz nur für März; die Stadt steht in E, der Monat in F, der Umsatz in D. Welche Funktion passt am besten?
- SUMMEWENN mit einer Bedingung
- WENN ohne Summe
+ SUMMEWENNS (SUMIFS) mit zwei Bedingungen
- ZÄHLENWENN
= SUMMEWENNS summiert nach mehreren Bedingungen zugleich.

?r:m Was macht SUMMEWENN (SUMIF)?
- Es zählt Zellen
+ Es summiert die Werte, die eine Bedingung erfüllen
- Es findet das Maximum
- Es löscht Zeilen nach einer Bedingung
= Zum Beispiel den Umsatz nur einer Stadt.

?r:e Wie verknüpfst du zwei Bedingungen, die beide erfüllt sein müssen?
+ Mit der Funktion UND (AND)
- Mit der Funktion ODER (OR)
- Mit einem Dollarzeichen
- Mit der Funktion SUMME
= UND liefert WAHR nur, wenn alle Bedingungen erfüllt sind.

!open Denk dir eine Aufgabe aus Beruf oder Alltag aus, bei der WENN oder SUMMEWENN hilft, und schreib die Formel.
!rubric Die Aufgabe wird beschrieben
!rubric Die Formel ist plausibel
!rubric Es wird erklärt, was sie liefert
!model In meiner Ausgabentabelle steht die Kategorie in B und der Betrag in C. Um zu sehen, wie viel ich für Lebensmittel ausgegeben habe, schreibe ich =SUMMEWENN(B2:B200;"Lebensmittel";C2:C200). Die Formel addiert die Beträge nur in Zeilen mit der Kategorie „Lebensmittel“.

# data-05 | Formeln | Werte nachschlagen: SVERWEIS und XVERWEIS
## Warum nachschlagen
Daten liegen oft in verschiedenen Tabellen: In einer stehen Bestellungen mit Artikelnummer, in einer anderen eine Preisliste. Nachschlagefunktionen holen den passenden Wert über einen Schlüssel.

## SVERWEIS und XVERWEIS
**SVERWEIS** (VLOOKUP) sucht einen Wert in der ersten Spalte eines Bereichs und liefert den Wert aus einer angegebenen Spalte derselben Zeile:
`=SVERWEIS(A2;Preise!A:C;3;FALSCH)`

Das letzte Argument **FALSCH** bedeutet exakte Übereinstimmung – das brauchst du fast immer. Ohne es kann SVERWEIS den „nächstgelegenen“ Wert liefern und sich unbemerkt irren.

Grenzen von SVERWEIS: Es sucht nur in der ersten Spalte und nur nach rechts, und die Spaltennummer stimmt nicht mehr, wenn du eine Spalte einfügst.

**XVERWEIS** (XLOOKUP) in neueren Excel-Versionen und in Google Tabellen ist bequemer: `=XVERWEIS(A2;Preise!A:A;Preise!C:C)` – du gibst getrennt an, wo gesucht und was zurückgegeben wird; standardmäßig wird exakt gesucht. Die klassische Alternative ist das Paar **INDEX + VERGLEICH** (INDEX + MATCH).

## Der Schlüssel muss eindeutig sein
Kommt dieselbe Nummer in der Nachschlagetabelle zweimal vor, liefert die Funktion den ersten Treffer – und du bemerkst den Fehler nicht. Prüf Schlüssel auf Eindeutigkeit.

!key Nachschlagefunktionen holen Werte über einen Schlüssel aus einer anderen Tabelle.
!key Bei SVERWEIS: FALSCH für exakte Übereinstimmung.
!key XVERWEIS ist bequemer: „wo suchen“ und „was zurückgeben“ sind getrennt.
!key Der Schlüssel in der Nachschlagetabelle muss eindeutig sein.

?q:e Wofür brauchst du SVERWEIS (VLOOKUP)?
- Um eine Spalte zu addieren
+ Um einen Wert über einen Schlüssel in einer anderen Tabelle zu finden
- Um ein Diagramm zu erstellen
- Um Duplikate zu entfernen
= SVERWEIS holt Daten aus einer Nachschlagetabelle.

?q:m Was bedeutet FALSCH als letztes Argument von SVERWEIS?
- Dass die Formel ausgeschaltet ist
+ Dass eine exakte Übereinstimmung des Schlüssels verlangt wird
- Dass das Ergebnis Text sein wird
- Dass von unten nach oben gesucht wird
= Ohne exakte Übereinstimmung kann SVERWEIS einen falschen Wert liefern.

?q:m Warum ist XVERWEIS bequemer als SVERWEIS?
+ Du gibst getrennt an, wo gesucht und was zurückgegeben wird, und es kann nach links suchen
- Es funktioniert nur mit Text
- Es ist schneller getippt
- Es braucht keinen Schlüssel
= Es braucht keine Spaltennummer, also macht das Einfügen von Spalten nichts kaputt.

?q:h SVERWEIS liefert Preise, aber einige sind falsch. In der Nachschlagetabelle haben manche Nummern zwei Zeilen mit unterschiedlichen Preisen. Was passiert?
- Die Funktion nimmt den Durchschnittspreis
+ Die Funktion nimmt den ersten Treffer, deshalb muss der Schlüssel eindeutig sein
- Die Funktion liefert für diese Nummern einen Fehler
- Die Funktion nimmt den letzten Treffer
= Nicht eindeutige Schlüssel führen zu stillen Fehlern.

?r:m Welches Funktionspaar ist die klassische Alternative zu SVERWEIS?
- SUMME + ANZAHL
+ INDEX + VERGLEICH (INDEX + MATCH)
- WENN + UND
- MIN + MAX
= VERGLEICH findet die Zeile, INDEX liefert den Wert.

?r:e Wie muss ein Schlüssel in einer Nachschlagetabelle sein?
+ Eindeutig
- Lang
- Immer eine Zahl
- In Großbuchstaben
= Sonst liefert die Suche den ersten von mehreren Treffern.

!open Du hast eine Bestelltabelle mit einer Mitarbeiternummer und eine eigene Tabelle „Nummer – Name – Abteilung“. Beschreib, wie du die Abteilung in die Bestellungen holst und was du prüfst.
!rubric Eine Nachschlagefunktion wird genannt
!rubric Exakte Übereinstimmung wird angegeben
!rubric Die Prüfung der Eindeutigkeit oder von Fehlern wird erwähnt
!model In der Bestelltabelle füge ich eine Spalte „Abteilung“ mit =XVERWEIS(B2;Mitarbeiter!A:A;Mitarbeiter!C:C) ein, wobei B die Mitarbeiternummer ist. Vorher prüfe ich, dass sich die Nummern in der Nachschlagetabelle nicht wiederholen, und danach suche ich nach #NV-Fehlern: Das sind Nummern, die in der Nachschlagetabelle fehlen.

# data-06 | Analyse | Sortieren, Filtern und Pivot-Tabellen
## Sortieren und Filtern
**Sortieren** bringt die Zeilen in eine Reihenfolge: nach Umsatz absteigend, nach Datum. Markier die ganze Tabelle, sonst sortierst du vielleicht nur eine Spalte und bringst die Daten zwischen den Zeilen durcheinander.

Ein **Filter** blendet Zeilen, die eine Bedingung nicht erfüllen, vorübergehend aus – zum Beispiel zeigt er nur eine Region. Gelöscht wird dabei nichts.

## Pivot-Tabellen
Eine **Pivot-Tabelle** macht aus Tausenden Zeilen in einer Minute einen kurzen Bericht. Du ziehst Felder in vier Bereiche:
- **Zeilen** – wonach gruppiert wird (zum Beispiel Mitarbeiter);
- **Spalten** – eine zweite Dimension (zum Beispiel Monat);
- **Werte** – was berechnet wird: Summe, Anzahl, Mittelwert;
- **Filter** – Eingrenzung des Berichts (zum Beispiel nur 2025).

Eine Pivot-Tabelle funktioniert nur mit aufgeräumten Daten: Überschriften in der ersten Zeile, keine verbundenen Zellen und keine leeren Zeilen dazwischen. Ändern sich die Ausgangsdaten, musst du sie **aktualisieren**.

!key Sortier die ganze Tabelle, nicht eine einzelne Spalte.
!key Ein Filter blendet Zeilen aus, löscht sie aber nicht.
!key Eine Pivot-Tabelle hat Zeilen, Spalten, Werte und Filter.
!key Ändern sich die Ausgangsdaten, aktualisier die Pivot-Tabelle.

?q:e Was macht ein Filter?
- Er löscht überflüssige Zeilen endgültig
+ Er blendet Zeilen, die eine Bedingung nicht erfüllen, vorübergehend aus
- Er sortiert alphabetisch
- Er verbindet Zellen
= Ausgeblendete Zeilen bleiben in der Tabelle.

?q:m Warum ist es gefährlich, nur eine markierte Spalte zu sortieren?
+ Ihre Werte geraten gegenüber den anderen Spalten durcheinander, und Datensätze werden „zerrissen“
- Die Sortierung funktioniert nicht
- Die Tabelle wird kleiner
- Nur bei Datumswerten ist es gefährlich
= Eine Zeile muss ein vollständiger Datensatz bleiben.

?q:m Du willst den Umsatz je Mitarbeiter und Monat sehen. Was kommt in den Bereich „Werte“ der Pivot-Tabelle?
- Mitarbeiter
- Monat
+ Die Summe des Umsatzes
- Region
= Werte sind das, was berechnet wird.

?q:h Du hast neue Verkäufe in die Ausgangstabelle eingetragen, aber die Pivot-Tabelle zeigt die alten Summen. Woran liegt das?
- Pivot-Tabellen können mit neuen Daten nicht umgehen
+ Die Pivot-Tabelle muss aktualisiert werden, und ihr Bereich muss die neuen Zeilen umfassen
- Man muss die Pivot-Tabelle löschen und den Bericht von Hand erstellen
- Die neuen Verkäufe wurden falsch eingetragen
= Eine Pivot-Tabelle rechnet nicht von selbst neu wie Formeln.

?r:m Welche vier Bereiche hat eine Pivot-Tabelle?
+ Zeilen, Spalten, Werte, Filter
- Titel, Text, Beschriftung, Summe
- Zellen, Blätter, Mappen, Dateien
- Summe, Mittelwert, Minimum, Maximum
= In diese Bereiche werden die Felder gezogen.

?r:e Welche Daten braucht eine Pivot-Tabelle?
- Beliebige, auch mit verbundenen Zellen
+ Aufgeräumte: Überschriften in der ersten Zeile, keine verbundenen Zellen
- Nur Text
- Nur eine einzige Spalte
= Aufgeräumte Daten sind die Grundlage jeder Analyse.

!open Beschreib einen Bericht, den du mit einer Pivot-Tabelle aus deinen Daten erstellen könntest: Was steht in Zeilen, Spalten, Werten und Filter, und welche Frage beantwortet er?
!rubric Alle Bereiche werden angegeben
!rubric Die Frage, die der Bericht beantwortet, wird genannt
!rubric Die Daten sind realistisch
!model Die Daten sind meine Ausgaben des Jahres. Zeilen: Kategorie, Spalten: Monat, Werte: Summe der Ausgaben, Filter: nur Karte. Der Bericht beantwortet, in welchen Monaten und wofür ich am meisten ausgebe.

# data-07 | Analyse | Mittelwert, Median und Prozente
## Mittelwert und Median
Der **Mittelwert** ist die Summe geteilt durch die Anzahl. Der **Median** ist der mittlere Wert, wenn alles sortiert ist. Gibt es **Ausreißer** (sehr große oder kleine Werte), verschiebt sich der Mittelwert stark, der Median nicht.

Beispiel: Fünf Mitarbeitende verdienen 50, 55, 60, 65 und 500 Tausend. Der Mittelwert liegt bei 146 Tausend, obwohl vier von ihnen 65 oder weniger verdienen. Der Median liegt bei 60 Tausend und beschreibt eine typische Person besser. In Tabellen: **MEDIAN**.

## Prozent und Prozentpunkte
- Ein Anstieg von 200 auf 250 sind **+25 %**: (250 − 200) / 200.
- Steigt die Konversionsrate von 2 % auf 3 %, ist das ein Plus von **1 Prozentpunkt**, aber relativ **50 %**. Beides zu verwechseln ist ein häufiger Fehler in Berichten.
- Ein Prozentsatz auf kleiner Basis täuscht: „100 % Wachstum“ kann 2 Bestellungen statt einer bedeuten.

!key Der Median ist robuster als der Mittelwert, wenn es Ausreißer gibt.
!key Prozentuale Veränderung = (neu − alt) / alt.
!key Prozentpunkte sind Differenzen von Prozentsätzen; verwechsle sie nicht mit Prozent.
!key Schau auf die Basis: Ein großer Prozentsatz einer kleinen Zahl sagt wenig.

?q:e Was ist der Median?
- Die Summe aller Werte
+ Der mittlere Wert einer sortierten Reihe
- Der häufigste Wert
- Die Differenz zwischen Maximum und Minimum
= Die Hälfte der Werte liegt unter dem Median, die Hälfte darüber.

?q:m Gehälter: 40, 45, 50, 55 und 400 Tausend. Welche Kennzahl beschreibt ein typisches Gehalt besser?
- Der Mittelwert – 118 Tausend
+ Der Median – 50 Tausend
- Das Maximum – 400 Tausend
- Die Summe – 590 Tausend
= Der Ausreißer von 400 Tausend zieht den Mittelwert stark nach oben.

?q:m Der Umsatz stieg von 160 auf 200 Tausend. Um wie viel Prozent?
- Um 20 %
+ Um 25 %
- Um 40 %
- Um 80 %
= (200 − 160) / 160 = 0,25.

?q:h Die Retourenquote sank von 8 % auf 6 %. Wie beschreibst du die Veränderung korrekt?
- Um 2 % relativ
+ Um 2 Prozentpunkte oder um 25 % gegenüber dem vorherigen Niveau
- Um 6 %
- Um 33 Prozentpunkte
= 8 − 6 = 2 Pp.; 2 / 8 = 25 %.

?r:m Warum kann der Mittelwert irreführen?
+ Ausreißer verschieben ihn stark
- Er ist immer kleiner als der Median
- Er lässt sich in Tabellen nicht berechnen
- Er eignet sich nur für Datumswerte
= In solchen Fällen schau auf den Median.

?r:e Wie berechnest du eine prozentuale Veränderung?
- Neu minus alt
+ (Neu − alt) / alt
- Neu / 100
- Alt / neu
= Die Veränderung wird durch den Ausgangswert geteilt.

!open Such in den Nachrichten oder einem Arbeitsbericht einen Satz mit Prozentangaben und prüf ihn: Sind Prozent und Prozentpunkte richtig verwendet, und ist die Basis zu klein?
!rubric Ein Satz oder Beispiel wird zitiert
!rubric Prozent bzw. Prozentpunkte werden geprüft
!rubric Die Basis wird bewertet
!model In einem Bericht steht: „Der Anteil der Online-Verkäufe stieg um 5 %“ – er lag bei 20 % und liegt jetzt bei 25 %. Korrekt sind 5 Prozentpunkte oder 25 % gegenüber dem vorherigen Anteil. Die Basis ist solide – Tausende Bestellungen pro Monat –, die Veränderung ist also aussagekräftig.

# data-08 | Analyse | Diagramme, die nicht lügen
## Das passende Diagramm
- **Linie** – Veränderungen über die Zeit: Umsatz pro Monat.
- **Balken/Säulen** – Kategorien vergleichen: Verkäufe nach Region. Lange Beschriftungen passen besser auf horizontale Balken.
- **Kreisdiagramm** – Anteile an einem Ganzen, und nur bei wenigen Teilen (bis 4–5). Winkel lassen sich schlecht vergleichen, deshalb sind Balken oft besser.
- **Punktdiagramm** (Streudiagramm) – Zusammenhang zweier Zahlenwerte: Preis und Anzahl der Verkäufe.

## Ehrlichkeit
- Balken müssen **bei null** beginnen: Eine abgeschnittene Achse macht aus 3 % Wachstum einen „Höhenflug“.
- Vergleich keine unterschiedlich langen Zeiträume, ohne es zu sagen.
- Beschrifte Achsen und Einheiten, nenne Quelle und Zeitraum.
- Ein Diagramm – eine Aussage. Heb das Wichtigste farbig hervor, den Rest in Grau.

## Zusammenfassung des Kurses
Aufgeräumte Tabelle → saubere Daten → Formeln und Nachschlagen → Pivot-Tabelle → korrekte Prozente → ehrliches Diagramm. Das ist der Grundzyklus der Datenarbeit in jedem Beruf.

!key Linie für Zeit, Balken für Vergleiche, Kreis für Anteile weniger Teile.
!key Balken beginnen bei null, sonst übertreibt das Diagramm den Unterschied.
!key Beschrifte Achsen, Einheiten, Quelle und Zeitraum.
!key Ein Diagramm – eine Aussage, das Wichtigste in Farbe.

?q:e Welches Diagramm zeigt den Umsatz pro Monat über ein Jahr am besten?
- Ein Kreisdiagramm
+ Ein Liniendiagramm
- Eine Tabelle mit einer einzigen Zahl
- Ein Punktdiagramm ohne Beschriftung
= Eine Linie zeigt Veränderungen über die Zeit gut.

?q:m Wann ist ein Kreisdiagramm angebracht?
- Zum Vergleich von 15 Regionen
+ Für Anteile an einem Ganzen, wenn es nur wenige Teile gibt
- Für tägliche Entwicklungen
- Für den Zusammenhang zweier Kennzahlen
= Viele Segmente lassen sich schwer vergleichen.

?q:m Was ist gefährlich an einem Balkendiagramm, dessen Achse nicht bei null beginnt?
+ Ein kleiner Unterschied wirkt riesig
- Das Diagramm wird zu breit
- Die Beschriftungen verschwinden
- Nichts, das ist üblich
= Die Höhe eines Balkens muss proportional zu seinem Wert sein.

?q:h Du willst prüfen, ob sich ein Produkt bei höherem Preis schlechter verkauft. Welches Diagramm wählst du?
- Ein Kreisdiagramm der Preisanteile
+ Ein Punktdiagramm „Preis gegen Anzahl der Verkäufe“
- Ein Liniendiagramm nur mit dem Preis
- Balken mit Produktnamen in alphabetischer Reihenfolge
= Ein Punktdiagramm zeigt den Zusammenhang zweier Zahlenwerte.

?r:m Was muss auf einem Diagramm immer beschriftet sein?
+ Achsen, Einheiten, Quelle und Zeitraum
- Nur der Titel
- Nichts, das ist selbsterklärend
- Nur die Hintergrundfarbe
= Ohne das wird ein Diagramm leicht falsch verstanden.

?r:e Welche Regel macht ein Diagramm verständlich?
- Möglichst viele Farben
+ Ein Diagramm – eine Aussage
- Immer ein 3D-Effekt
- Alle Beschriftungen in kleiner Schrift
= Heb das Wichtigste hervor, dämpf den Rest.

!open Beschreib ein Diagramm, das du aus deinen Daten für deine Führungskraft erstellen würdest: welcher Typ, was auf den Achsen, was du hervorhebst und welche eine Aussage es vermitteln soll.
!rubric Der Diagrammtyp passt zur Aufgabe
!rubric Achsen und Hervorhebung werden beschrieben
!rubric Eine Aussage wird formuliert
!model Ich zeige ein Liniendiagramm des Monatsumsatzes im Jahresverlauf: Monate auf der horizontalen Achse, Umsatz in Tausend Euro ab null auf der vertikalen. Die Linie dieses Jahres in Farbe, das Vorjahr in Grau. Die Aussage: Seit dem Start des Lieferdienstes im Mai liegt der Umsatz durchgehend über dem Vorjahr.
