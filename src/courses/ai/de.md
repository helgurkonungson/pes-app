---
id: cb-ai-de
version: 1
title: KI-Kompetenz
description: Wie Chatbots wie ChatGPT, Claude oder Gemini funktionieren, wann du ihnen trauen kannst, wie du gute Prompts schreibst und wie du dir und anderen nicht schadest. Acht kurze Lektionen ohne Fachjargon.
goal: KI sicher und souverän in Lernen und Beruf nutzen
language: German
minutes: 7
hue: 265
---

# ai-01 | Wie KI funktioniert | Was ein Sprachmodell ist
## Ein Vorhersager für das nächste Wort
Chatbots wie ChatGPT, Claude oder Gemini laufen auf **großen Sprachmodellen**. So ein Modell wurde mit riesigen Textmengen trainiert und kann eine Sache sehr gut: Aus dem Anfang eines Textes vorhersagen, was am wahrscheinlichsten als Nächstes kommt. Wenn es dir antwortet, baut es die Antwort Schritt für Schritt aus kleinen Stücken zusammen – **Tokens** (Wörter oder Wortteile).

Aus diesem einfachen Mechanismus entstehen erstaunliche Fähigkeiten: zusammenfassen, übersetzen, erklären, programmieren. Aber denk daran: Das Modell „schlägt die Antwort nicht in einer Datenbank nach“, es formuliert eine plausible Fortsetzung.

## Was das Modell nicht weiß
Ein Modell hat einen **Wissensstichtag**: Über spätere Ereignisse weiß es nur, was es findet, wenn es eine Websuche nutzen darf. An frühere Gespräche mit dir erinnert es sich nicht, außer der Dienst speichert sie bewusst. Und es hat keine eigenen Erfahrungen – nur Muster aus Texten.

!key Ein Sprachmodell sagt das nächste Textstück voraus – ein Token.
!key Die Antwort wird formuliert, nicht aus einer Datenbank geholt.
!key Ein Modell hat einen Wissensstichtag; Neues erfährt es nur über eine Suche.
!key Seine Fähigkeiten stammen aus Mustern in Texten, nicht aus Erfahrung.

?q:e Was macht ein großes Sprachmodell im Kern?
- Es schlägt eine fertige Antwort in einer Datenbank nach
+ Es sagt voraus, welches Textstück am wahrscheinlichsten als Nächstes kommt
- Es kopiert Antworten in Echtzeit von Websites
- Es verbindet dich mit einem menschlichen Experten
= Das Modell baut den Text Schritt für Schritt, Token für Token.

?q:e Was ist ein Token?
- Ein Passwort für die Anmeldung beim Chatbot
+ Ein Textstück – ein Wort oder Wortteil –, mit dem das Modell arbeitet
- Eine Zahlungseinheit in Kryptowährung
- Eine einzelne Antwort des Modells
= Das Modell liest und schreibt Text in Tokens.

?q:m Warum kennt ein Modell die Nachrichten von gestern vielleicht nicht?
+ Sein Wissen endet am Stichtag der Trainingsdaten, sofern es keine Websuche hat
- Es verheimlicht Nachrichten absichtlich
- Über Nachrichten darf man mit KI nicht sprechen
- Das Modell aktualisiert sich jede Minute und war nur noch nicht so weit
= Ohne Suche kennt das Modell die Welt nur bis zu seinem Training.

?q:h Welche Aussage über einen Chatbot ist am treffendsten?
- Er versteht die Welt wie ein Mensch mit Erfahrung
- Er zitiert seine Quellen immer wörtlich
+ Er baut aus Mustern in Texten eine plausible Antwort
- Er erinnert sich an alle Gespräche aller Nutzer
= Das erklärt sowohl die Stärken als auch die Fehler der Modelle.

?r:m Woher hat das Modell die Antwort auf deine Frage?
- Aus vorab gespeicherten Antworten
+ Es formuliert sie, indem es die Fortsetzung des Textes vorhersagt
- Es lädt sie aus Wikipedia herunter
- Die Entwickler liefern sie von Hand
= Die Antwort wird erzeugt, nicht abgerufen.

?r:e Was begrenzt das Wissen eines Modells über aktuelle Ereignisse?
+ Der Wissensstichtag
- Die Bildschirmgröße
- Die Sprache der Frage
- Die Tageszeit
= Danach weiß das Modell nur, was es über eine Suche findet.

!open Erklär einem Freund in 3–4 Sätzen, wie ein Chatbot funktioniert und warum man ihm nicht blind glauben sollte.
!rubric Die Vorhersage des nächsten Textes wird erwähnt
!rubric Es wird erklärt, dass die Antwort formuliert wird
!rubric Es gibt ein Fazit zum Überprüfen
!model Ein Chatbot ist ein Programm, das unglaublich viel Text gelesen hat und gelernt hat zu erraten, welche Wörter als Nächstes kommen. Wenn du ihn etwas fragst, schlägt er nicht in einem Lexikon nach, sondern schreibt einen plausiblen Text. Deshalb klingt er auch dann sicher, wenn er sich irrt, und wichtige Fakten muss man prüfen.

# ai-02 | Wie KI funktioniert | Halluzinationen und Faktencheck
## Überzeugt, aber falsch
Manchmal erfindet ein Modell Fakten: Zitate, Bücher, Gesetzesparagrafen, Links oder Zahlen, die es nicht gibt. Das nennt man **Halluzinationen**. Die Ursache liegt in der Funktionsweise: Das Modell baut einen plausiblen Text, und plausibel ist nicht immer wahr. Besonders oft passiert das bei seltenen Themen, genauen Zahlen, Daten und Quellenangaben.

Die Gefahr: Eine falsche Antwort klingt genauso überzeugt wie eine richtige.

## So prüfst du
- Prüf wichtige Fakten an der Originalquelle: einer offiziellen Website, einem Dokument, einem Nachschlagewerk.
- Lass dir Quellen nennen – und öffne sie. Ein Link, den es nicht gibt, ist ein Warnsignal.
- Hak nach: „Wie sicher bist du?“, „Welche Gegenargumente gibt es?“
- Je mehr auf dem Spiel steht (Gesundheit, Geld, Recht, Job), desto strenger die Prüfung. Die endgültige Entscheidung trifft ein Mensch.

!key Eine Halluzination ist erfundene Information, überzeugt vorgetragen.
!key Fehler häufen sich bei seltenen Themen, Zahlen, Daten und Links.
!key Prüf wichtige Fakten an der Originalquelle.
!key Je mehr auf dem Spiel steht, desto strenger die Prüfung; ein Mensch entscheidet.

?q:e Was ist eine Halluzination eines Modells?
- Ein Bildschirmfehler beim Antworten
+ Erfundene Information, überzeugt vorgetragen
- Eine Antwort in einer anderen Sprache
- Eine zu lange Antwort
= Zum Beispiel ein Zitat oder Link, den es nicht gibt.

?q:m Wo sind Halluzinationen am häufigsten?
- Beim Übersetzen einfacher Sätze
+ Bei genauen Zahlen, Daten, Zitaten und Quellenangaben
- Bei Antworten auf eine Begrüßung
- Beim Korrigieren von Tippfehlern
= Das sind Details, die das Modell plausibel „auffüllt“.

?q:m Das Modell nennt einen Link zu einer Studie. Was ist sinnvoll?
- Ihn sofort im Bericht zitieren
+ Den Link öffnen und prüfen, ob die Studie existiert und genau das sagt
- Dasselbe Modell fragen, ob es stimmt, und der Antwort glauben
- Den Link löschen und die Schlussfolgerung behalten
= Der Link muss an der Originalquelle geprüft werden.

?q:h Du fragst eine KI nach der Dosierung eines Medikaments für einen Angehörigen. Wie gehst du richtig vor?
- Der Antwort vertrauen, wenn sie überzeugt klingt
- Zwei weitere Chatbots fragen und den Durchschnitt nehmen
+ Die Antwort als Hinweis nutzen und bei Ärztin, Apotheker oder im offiziellen Beipackzettel prüfen
- Den Beipackzettel ignorieren, wenn die KI etwas anderes sagt
= Wenn viel auf dem Spiel steht, entscheidet ein Mensch auf Basis einer verlässlichen Quelle.

?r:m Warum halluzinieren Modelle?
+ Sie bauen plausiblen Text, und plausibel ist nicht immer wahr
- Sie werden absichtlich zum Täuschen trainiert
- Wegen einer langsamen Internetverbindung
- Weil die Frage höflich gestellt wurde
= Das folgt aus der Funktionsweise des Modells.

?r:e Was tust du mit wichtigen Fakten aus einer KI-Antwort?
- Sie auswendig lernen
+ Sie an der Originalquelle prüfen
- Sie an Freunde weiterleiten
- Nichts, KI irrt sich nicht
= Die Originalquelle ist der wichtigste Prüfweg.

!open Bitte einen beliebigen Chatbot um eine wenig bekannte Tatsache aus deinem Beruf oder deiner Stadt. Wie prüfst du die Antwort? Beschreib die Schritte.
!rubric Konkrete Prüfschritte werden genannt
!rubric Die Originalquelle wird erwähnt
!rubric Es wird erkannt, dass ein sicherer Ton keine Garantie ist
!model Ich frage, in welchem Jahr unser Stadtmuseum gegründet wurde. Dann suche ich die offizielle Website des Museums und seinen Eintrag im Stadtportal und vergleiche Jahr und Namen des Gründers. Wenn die Quellen vom Modell abweichen, vertraue ich den Quellen: Ein sicherer Ton garantiert nichts.

# ai-03 | Gute Prompts | So schreibst du einen Prompt
## Vier Elemente
Das Modell kann keine Gedanken lesen: Die Qualität der Antwort hängt stark vom Prompt ab. Ein guter Prompt enthält meist:
1. **Kontext** – wer du bist, wofür es gedacht ist, was schon bekannt ist.
2. **Aufgabe** – was genau zu tun ist: erklären, kürzen, vergleichen, Ideen finden.
3. **Format** – Liste, Tabelle, E-Mail, 5 Punkte, höchstens 100 Wörter.
4. **Vorgaben und Kriterien** – Ton, Zielgruppe, was zu vermeiden ist.

## Vorher und nachher
Schwach: „Schreib was über Zeitmanagement.“

Besser: „Ich leite ein Team aus 5 Designern, und wir reißen ständig Deadlines. Schlag 5 konkrete Praktiken für die Wochenplanung vor, jede in 2–3 Sätzen, ohne allgemeine Tipps wie ‚seid organisierter‘.“

Auch **Beispiele** helfen: Zeig ein Muster der gewünschten Antwort, und das Modell passt Stil und Aufbau daran an.

!key Ein guter Prompt: Kontext, Aufgabe, Format, Vorgaben.
!key Je konkreter die Aufgabe, desto nützlicher die Antwort.
!key Nenn Format und Umfang ausdrücklich.
!key Ein Muster der gewünschten Antwort hilft dem Modell, den Stil zu treffen.

?q:e Welcher Prompt führt wahrscheinlich zu einer nützlicheren Antwort?
- „Erzähl mir was über Lebensläufe“
+ „Ich bin Junior-Analyst und bewerbe mich bei einer Bank. Schlag 3 starke Punkte für den Abschnitt ‚Berufserfahrung‘ vor, jeweils mit einem Ergebnis in Zahlen“
- „Lebenslauf“
- „Hilfe“
= Hier gibt es Kontext, Aufgabe und Format.

?q:m Was gehört zum Element „Format“?
- „Ich bin Mathelehrerin“
+ „Antworte als Tabelle mit drei Spalten“
- „Erklär, was Brüche sind“
- „Ich brauche das für die Stunde morgen“
= Das Format beschreibt, wie die Antwort aussehen soll.

?q:m Warum fügst du einem Prompt ein Beispiel der gewünschten Antwort hinzu?
- Damit das Modell es unverändert kopiert
+ Um Stil, Aufbau und Detailgrad zu zeigen, die du brauchst
- Ein Beispiel verwirrt das Modell nur
- Damit die Antwort kürzer wird
= Ein Muster setzt die Messlatte genauer als jede Beschreibung.

?q:h Du hast eine zu allgemeine Antwort zum Thema Marketing bekommen. Was änderst du am Prompt zuerst?
- Dasselbe in Großbuchstaben schreiben
+ Kontext ergänzen: Produkt, Zielgruppe, Budget und was du schon ausprobiert hast
- Um eine schnellere Antwort bitten
- Die Sprache des Prompts wechseln
= Eine allgemeine Antwort kommt meist von einem allgemeinen Prompt ohne Kontext.

?r:m Welche vier Elemente machen einen guten Prompt aus?
+ Kontext, Aufgabe, Format, Vorgaben
- Begrüßung, Frage, Danke, Unterschrift
- Thema, Schlagwörter, Hashtags, Emojis
- Länge, Schrift, Farbe, Sprache
= Diese Elemente machen die Antwort nützlich.

?r:e Was ist ein Prompt?
- Die Antwort des Modells
+ Die Anfrage, die du an das Modell schreibst
- Der Name des Modells
- Eine Bildschirmeinstellung
= Ein Prompt ist deine Anfrage.

!open Schreib den schwachen Prompt „Hilf mir mit einer Präsentation“ für eine echte Aufgabe von dir in einen starken um – mit allen vier Elementen.
!rubric Es gibt Kontext
!rubric Die Aufgabe ist konkret
!rubric Format und Vorgaben werden genannt
!model Ich bin Produktmanager und präsentiere am Freitag der Geschäftsleitung die Quartalsergebnisse: Der Umsatz ist um 12 % gestiegen, aber auch die Kundenabwanderung hat zugenommen. Erstelle eine Gliederung für 8 Folien mit Titel und 2–3 Kernaussagen pro Folie. Sachlicher Ton ohne Floskeln; eine eigene Folie dazu, was wir gegen die Abwanderung tun.

# ai-04 | Gute Prompts | Dialog und Überarbeitung
## Die erste Antwort ist ein Entwurf
Das beste Ergebnis kommt selten beim ersten Versuch. Behandle die Antwort als **Entwurf** und überarbeite sie im Dialog: „kürzer“, „einfacher, für Einsteiger“, „ergänze ein Beispiel aus dem Einzelhandel“, „streich den dritten Punkt“.

Nützliche Techniken:
- Bitte um **mehrere Varianten**: „Gib mir 3 verschiedene Überschriften“ – dann wähl aus oder kombinier.
- Bitte das Modell, **dir Fragen zu stellen**: „Bevor du schreibst, frag, was fehlt.“
- Bitte um **Kritik**: „Finde die Schwachstellen in diesem Plan“ oder „Was würde ein Skeptiker einwenden?“

## Große Aufgaben aufteilen
Eine komplexe Aufgabe erledigst du besser in Schritten: erst die Struktur, dann jeder Abschnitt, dann eine Prüfung. So behältst du die Qualität im Griff und kannst rechtzeitig gegensteuern.

Wenn der Dialog festhängt und das Modell immer wieder dieselben Fehler macht, ist ein neuer Chat mit einem verbesserten Prompt manchmal schneller.

!key Die erste Antwort ist ein Entwurf; überarbeite sie im Dialog.
!key Bitte um Varianten, Rückfragen und Kritik.
!key Erledige große Aufgaben in Schritten: Struktur → Abschnitte → Prüfung.
!key Hängt der Dialog fest, fang mit einem besseren Prompt neu an.

?q:e Wie solltest du die erste Antwort des Modells behandeln?
+ Als Entwurf, den man verbessern kann
- Als Endergebnis
- Als Fehler, wenn sie nicht perfekt ist
- Als Antwort, die man nicht ändern kann
= Überarbeiten im Dialog gehört ganz normal dazu.

?q:m Welche Bitte hilft, die Schwachstellen eines Textes zu finden?
- „Mach es besser“
+ „Was würde ein Skeptiker gegen diesen Plan einwenden?“
- „Schreib dasselbe noch einmal“
- „Danke, alles super“
= Die Bitte um Kritik zeigt Schwachstellen.

?q:m Warum solltest du das Modell bitten, dir vor der Antwort Fragen zu stellen?
- Um Zeit zu schinden
+ Damit es den fehlenden Kontext klärt und genauer antwortet
- Das ist eine höfliche Formalität
- Damit die Antwort kürzer wird
= Das Modell zeigt dir, welche Informationen ihm fehlen.

?q:h Du brauchst einen Bericht von 10 Seiten. Welches Vorgehen ist zuverlässiger?
- Den ganzen Bericht in einer Nachricht anfordern und sofort verschicken
+ Erst die Struktur abstimmen, dann die Abschnitte einzeln schreiben und am Ende prüfen
- Zehn verschiedene Berichte anfordern und einen zufällig wählen
- Einen einzeiligen Prompt schreiben
= Schrittweises Arbeiten gibt dir Kontrolle über die Qualität.

?r:m Was tust du, wenn das Modell im Dialog immer wieder denselben Fehler macht?
- Dieselbe Bitte lauter wiederholen
+ Einen neuen Chat mit einem verbesserten Prompt beginnen
- Die App löschen
- Den Fehler hinnehmen
= Ein frischer Kontext löst das Problem oft.

?r:e Wie bekommst du mehrere Ideen zur Auswahl?
+ Indem du um mehrere verschiedene Varianten bittest
- Indem du um eine perfekte Variante bittest
- Indem du eine Frage ohne Kontext stellst
- Indem du um nichts bittest
= Varianten kann man vergleichen und kombinieren.

!open Beschreib, wie du mit einer KI eine Entschuldigungs-E-Mail an einen Kunden wegen einer verspäteten Bestellung vorbereiten würdest. Welche Schritte und Überarbeitungen machst du?
!rubric Es gibt einen ersten Prompt mit Kontext
!rubric Es gibt mindestens zwei Überarbeitungen
!rubric Am Ende prüft ein Mensch
!model Zuerst gebe ich Kontext: Die Bestellung ist wegen eines Lieferanten 5 Tage verspätet, der Kunde ist Stammkunde, ich will die Beziehung halten. Ich bitte um 2 Varianten der E-Mail. Dann: „Mach die zweite kürzer und herzlicher“, „Füge eine Entschädigung hinzu – 10 % Rabatt auf die nächste Bestellung“. Am Ende prüfe ich selbst Daten, Betrag und Namen des Kunden, bevor ich sie abschicke.

# ai-05 | Sicherheit und Verantwortung | Daten und Privatsphäre
## Was du sendest
Alles, was du in einen Chatbot eingibst, landet auf den Servern des Anbieters. Je nach Dienst und Tarif können Gespräche gespeichert, zur Qualitätskontrolle gelesen oder zum Training künftiger Modelle verwendet werden. Besonders häufig gilt das für **kostenlose Tarife** – die Bedingungen zu lesen lohnt sich.

## Was du nicht senden solltest
- Passwörter, SMS-Codes, Bankkartendaten;
- personenbezogene Daten anderer ohne deren Einwilligung: Ausweisnummern, Adressen, Gesundheitsdaten;
- vertrauliche Dokumente deines Arbeitgebers, wenn es im Unternehmen keinen freigegebenen KI-Dienst gibt.

## Sicherer arbeiten
- Anonymisieren: Ersetze Namen und Zahlen durch „Kunde A“, „Betrag X“.
- Kenne die Regeln deines Unternehmens: Viele erlauben nur Unternehmensversionen von KI-Diensten.
- Prüf die Einstellungen des Dienstes: Oft kannst du die Nutzung deiner Chats fürs Training abschalten.

!key Alles, was du in einen Chatbot schreibst, landet auf den Servern des Anbieters.
!key Kostenlose Tarife nutzen Gespräche öfter fürs Training – lies die Bedingungen.
!key Sende keine Passwörter, Zahlungsdaten oder personenbezogenen Daten anderer.
!key Anonymisiere Daten und halte dich an die Regeln deines Arbeitgebers.

?q:e Was davon darfst du nie an einen Chatbot schicken?
- Eine Grammatikfrage
+ Einen SMS-Code zur Bestätigung einer Zahlung
- Die Bitte, einen Namen für eine Katze zu finden
- Den Text deines eigenen öffentlichen Beitrags
= SMS-Codes und Passwörter gibt man niemandem.

?q:m Eine KI soll dir helfen, eine Kundenbeschwerde auszuwerten. Wie gehst du sicherer vor?
- Die ganze Beschwerde mit Telefonnummer und Adresse des Kunden einfügen
+ Name, Kontaktdaten und Vertragsnummer entfernen und durch Platzhalter ersetzen
- Ein Foto vom Ausweis des Kunden schicken
- Den Kunden bitten, selbst dem Chatbot zu schreiben
= Anonymisieren erhält den Inhalt und schützt die Person.

?q:m Warum solltest du die Bedingungen eines kostenlosen KI-Tarifs lesen?
+ Gespräche im kostenlosen Tarif können zum Training von Modellen verwendet werden
- Ein kostenloser Tarif ist in jeder Hinsicht gefährlicher als ein bezahlter
- Bedingungen sind nur etwas für Juristen
- Dort stehen die Antworten auf alle Fragen
= Die Bedingungen legen fest, was mit deinen Daten passiert.

?q:h Dein Unternehmen hat einen KI-Dienst für Mitarbeitende, aber dein privates kostenloses Konto ist bequemer. Du bereitest einen Bericht mit internen Zahlen vor. Was ist richtig?
- Das private nutzen, weil es bequemer ist
+ Den Unternehmensdienst nutzen, wie es die Regeln verlangen
- Die Zahlen ins private Konto schicken und den Chat danach löschen
- Eine Kollegin bitten, es für dich zu schicken
= Vertrauliche Unternehmensdaten gehören nur in freigegebene Dienste.

?r:m Was bedeutet es, Daten zu anonymisieren?
- Den ganzen Text löschen
+ Namen, Kontaktdaten und genaue Zahlen durch Platzhalter ersetzen
- Den Text in eine andere Sprache übersetzen
- Den Text halbieren
= Der Inhalt bleibt, persönliche Angaben nicht.

?r:e Wohin geht der Text, den du in einen Chatbot schreibst?
+ Auf die Server des Unternehmens, das den Dienst anbietet
- Nirgendwohin, er bleibt auf deinem Handy
- Direkt zur Polizei
- Öffentlich ins Internet
= Deshalb ist wichtig, was du sendest.

!open Nimm eine echte Aufgabe aus Arbeit oder Studium, bei der dir KI helfen würde. Welche Daten müsstest du vor dem Senden entfernen oder ersetzen?
!rubric Die Aufgabe wird beschrieben
!rubric Konkrete sensible Daten werden genannt
!rubric Ein Weg zum Anonymisieren wird vorgeschlagen
!model Die Aufgabe: eine Verkaufstabelle nach Vertriebsmitarbeitenden auswerten und Gründe für einen Rückgang finden. Vor dem Senden ersetze ich die Namen durch „Mitarbeiter 1–5“, entferne die Kundennamen und runde die Beträge. Struktur und Entwicklung lasse ich – das reicht für die Analyse.

# ai-06 | Sicherheit und Verantwortung | Wo KI stark ist und wo schwach
## Stärken
KI ist gut bei Aufgaben, bei denen es um Text geht und deren Ergebnis leicht zu prüfen ist:
- Entwürfe von E-Mails, Beiträgen, Plänen;
- lange Texte zusammenfassen und kürzen;
- Komplexes einfach erklären, mit Beispielen;
- Brainstorming: Ideen, Namen, Varianten;
- Übersetzen und Stil verbessern;
- Hilfe bei Code und Formeln (mit Prüfung).

## Schwächen
- **Genaue Berechnungen**: Modelle können sich verrechnen, wenn sie keinen Rechner und keinen Code nutzen.
- **Aktuelle Ereignisse** ohne Zugriff auf eine Suche.
- **Sehr spezielle Fakten**: seltene Namen, Zitate, Aktenzeichen.
- **Entscheidungen mit hohem Einsatz**: Diagnosen, rechtliche und finanzielle Entscheidungen – nur mit Prüfung durch Fachleute.

Eine gute Regel: Nutz KI dort, wo **das Prüfen des Ergebnisses leichter ist, als die Arbeit selbst zu machen**.

!key KI ist stark bei Entwürfen, Zusammenfassungen, Erklärungen, Ideen und Übersetzungen.
!key Schwächen: genaue Berechnungen, aktuelle Ereignisse, seltene Fakten.
!key Entscheidungen mit hohem Einsatz trifft ein Mensch zusammen mit Fachleuten.
!key Nutz KI dort, wo Prüfen leichter ist als Selbermachen.

?q:e Für welche Aufgabe eignet sich KI besonders gut?
+ Einen Entwurf für eine E-Mail an Kollegen schreiben
- Eine medizinische Diagnose stellen
- Entscheiden, ob man einen Vertrag unterschreibt
- Ohne Suche den genauen heutigen Wechselkurs erfahren
= Einen Entwurf kann man leicht prüfen und korrigieren.

?q:m Warum solltest du Berechnungen eines Modells nachprüfen?
- Modelle rechnen immer falsch
+ Ein Modell kann sich verrechnen, wenn es keinen Rechner und keinen Code nutzt
- Berechnungen in Chatbots sind verboten
- Zahlen in Antworten sind immer gerundet
= Ein Sprachmodell sagt Text voraus, es rechnet nicht.

?q:m Welche Regel hilft dir zu entscheiden, ob du KI nutzt?
- Nutz KI für alles
- Nutz KI nie bei der Arbeit
+ Nutz sie dort, wo das Prüfen des Ergebnisses leichter ist als die Arbeit selbst
- Nutz sie nur am Wochenende
= So sparst du Zeit und behältst die Kontrolle.

?q:h Welche Aufgabe ist ein Beispiel für sinnvolle KI-Nutzung?
- Die KI fragen, welchen Kredit man nehmen soll, und sofort unterschreiben
+ Die KI einen langen Vertrag in einfachen Worten zusammenfassen lassen und strittige Klauseln mit einer Anwältin besprechen
- Eine KI-Antwort ungeprüft in einen wissenschaftlichen Artikel kopieren
- Die KI eine Behandlung auswählen lassen
= KI beschleunigt das Verstehen; die Entscheidung bleibt bei Mensch und Fachleuten.

?r:m Was davon ist eine Schwäche von Modellen?
- Texte umformulieren
+ Seltene Fakten: genaue Zitate, Aktenzeichen
- Brainstorming
- Einfach erklären
= Sehr spezielle Fakten kann das Modell erfinden.

?r:e Wer trifft Entscheidungen mit hohem Einsatz?
+ Ein Mensch, bei Bedarf zusammen mit Fachleuten
- Das Modell, wenn es sicher ist
- Wer am schnellsten antwortet
- Niemand
= KI ist eine Assistentin, keine verantwortliche Person.

!open Nenne drei Aufgaben aus deiner Woche: eine, die du gut an KI abgeben kannst, eine nur mit Vorsicht und eine gar nicht. Begründe.
!rubric Drei Aufgaben unterschiedlicher Art
!rubric Begründung über Prüfbarkeit oder Einsatz
!rubric Realistische Beispiele
!model An KI abgeben: den Entwurf meines Wochenberichts – den kann ich leicht mit meinen Daten prüfen. Mit Vorsicht: eine E-Mail an einen Partner übersetzen – Fachbegriffe und Ton prüfe ich. Gar nicht: entscheiden, welche Bewerberin wir einstellen – da steht viel auf dem Spiel, und ein Mensch muss entscheiden.

# ai-07 | Sicherheit und Verantwortung | Verzerrungen, Urheberschaft, Ehrlichkeit
## Verzerrungen
Modelle lernen aus menschlichen Texten – samt deren Stereotypen. Deshalb können Antworten verzerrt sein: zum Beispiel einem Beruf standardmäßig ein Geschlecht zuschreiben oder Länder mit Klischees beschreiben. Achte darauf und bitte um Alternativen: „Und wenn wir es aus einem anderen Blickwinkel betrachten?“

## Urheberschaft und Ehrlichkeit
- **Offenheit**. Wenn die Regeln in Studium oder Beruf es verlangen, gib an, dass du KI genutzt hast. Viele Hochschulen und Verlage haben solche Regeln schon.
- **Verantwortung**. Du bist für den Text verantwortlich, den du veröffentlichst – auch wenn ihn ein Modell geschrieben hat.
- **Rechte anderer**. Ein Modell kann Passagen aus fremden Texten wiedergeben; gib sie nicht als deine aus und prüf auf Übernahmen.
- **Deepfakes**. Erstelle keine gefälschten Fotos, Stimmen oder Videos echter Menschen ohne deren Einwilligung und nutz KI nicht zum Täuschen.

!key Modelle übernehmen Stereotype aus Texten – achte auf Verzerrungen.
!key Gib KI-Nutzung an, wenn die Regeln es verlangen.
!key Für veröffentlichte Texte bist du verantwortlich, nicht das Modell.
!key Nutz KI nicht zum Täuschen oder um echte Menschen zu fälschen.

?q:e Woher kommen Verzerrungen in Modellen?
- Sie werden absichtlich eingebaut
+ Modelle lernen aus menschlichen Texten, samt Stereotypen
- Von einer schlechten Internetverbindung
- Nur Menschen können verzerrt sein
= Die Daten spiegeln die Gesellschaft mit all ihren Verzerrungen.

?q:m Wer ist für einen mit KI geschriebenen und unter deinem Namen veröffentlichten Beitrag verantwortlich?
- Das Unternehmen, das das Modell entwickelt hat
+ Du als Autorin oder Autor des Beitrags
- Niemand
- Die Lesenden
= Wer veröffentlicht, trägt die Verantwortung.

?q:m Deine Hochschule verlangt, KI-Nutzung anzugeben. Du hast eine KI gebeten, die Einleitung deiner Hausarbeit zu kürzen. Was tust du?
+ Es so angeben, wie die Regeln es verlangen
- Nichts angeben, weil die Änderungen klein sind
- Den Chatverlauf löschen
- Den Text mit einer anderen KI umschreiben, um es zu verbergen
= Ehrlichkeit und Regeln gehen vor Bequemlichkeit.

?q:h Welche KI-Nutzung ist inakzeptabel?
- Um Ideen für einen Glückwunsch an eine Kollegin bitten
- Um die Erklärung eines schwierigen Themas bitten
+ Eine Sprachnachricht „im Namen“ eines Bekannten erzeugen, um dessen Freunde um Geld zu bitten
- Um eine Grammatikprüfung bitten
= Das ist Täuschung durch Fälschung eines echten Menschen.

?r:m Wie reagierst du auf ein Stereotyp in der Antwort eines Modells?
- Es als Tatsache hinnehmen
+ Es bemerken und um eine andere Sichtweise bitten
- Die App sofort löschen
- Die Antwort kommentarlos teilen
= Kritisch mit Antworten umzugehen gehört zur KI-Kompetenz.

?r:e Darfst du den Text eines Modells als ganz deinen ausgeben, wo die Regeln das verbieten?
- Ja, wenn es niemand merkt
+ Nein, du hältst dich an die Regeln und gibst die KI-Nutzung an
- Ja, wenn der Text kurz ist
- Ja, wenn du ihn übersetzt
= Regeln der Ehrlichkeit gelten auch für KI.

!open Formulier 3 persönliche Regeln für den ehrlichen Umgang mit KI in Studium oder Beruf.
!rubric Drei konkrete Regeln
!rubric Verantwortung und Offenheit werden berücksichtigt
!rubric Die Regeln sind praxistauglich
!model 1) Alles, was die KI schreibt, prüfe und überarbeite ich – ich stehe nur hinter dem, dem ich zustimme. 2) Wenn Kurs- oder Kundenregeln es verlangen, schreibe ich, dass und wofür ich KI genutzt habe. 3) Ich lade keine personenbezogenen Daten anderer hoch und erstelle nichts im Namen echter Menschen.

# ai-08 | Sicherheit und Verantwortung | Gemeinsam mit KI lernen
## Helferin, kein Ersatz
KI kann das Lernen beschleunigen – oder es unbemerkt ersetzen. Wenn das Modell Aufgaben für dich löst, bekommst du die Antwort, aber nicht die Fähigkeit: Gedächtnis und Verständnis wachsen nur durch eigene Anstrengung. Denk an den ersten Kurs: **Abrufen und Erklären** machen Wissen dauerhaft.

## So nutzt du KI zum Lernen
- Lass dir ein Thema auf verschiedene Weise **erklären**, mit Beispielen aus deinem Leben.
- Lass dir **Fragen** zum Thema **stellen** und deine Antworten prüfen – das ist Abrufübung.
- Bitte um einen **Hinweis**, nicht um die fertige Lösung: „Gib mir eine Leitfrage.“
- Erklär dem Modell das Thema selbst und lass es Fehler finden – das ist die Feynman-Technik.
- Prüf Fakten: Auch eine KI-Erklärung kann Fehler enthalten.

## KI in Chompbook
Wenn du eine KI verbindest, schreibt Chompbook Lektionen aus deinen eigenen Materialien und bewertet deine freien Antworten. KI-Lektionen sind gekennzeichnet, und mit der Fahne oben in der Lektion kannst du einen Fehler melden. Ohne KI funktioniert die App ebenfalls – mit fertigen Kursen und deinen eigenen Quellen.

!key Wenn die KI die Arbeit für dich macht, wächst die Fähigkeit nicht.
!key Bitte um Erklärungen, Fragen und Hinweise, nicht um fertige Lösungen.
!key Erklär dem Modell das Thema selbst und lass es Fehler finden.
!key Auch KI-Erklärungen muss man prüfen.

?q:e Warum ist es riskant, die KI alle Lernaufgaben lösen zu lassen?
+ Du bekommst Antworten, aber nicht die Fähigkeit: Verständnis wächst durch eigene Anstrengung
- Die KI löst sie immer falsch
- Es ist gesetzlich verboten
- Es ist zu teuer
= Wissen wird durch eigenes Abrufen und Erklären gestärkt.

?q:m Welche Bitte an die KI trainiert dein Gedächtnis am besten?
- „Lös die Aufgabe für mich“
+ „Stell mir 5 Fragen zu diesem Thema und prüf meine Antworten“
- „Schreib eine Zusammenfassung, ich lese sie später“
- „Sag mir gleich die Antwort“
= Das ist Abrufübung mit Rückmeldung.

?q:m Du kommst bei einer Aufgabe nicht weiter. Wie bittest du um Hilfe, um zu lernen statt abzuschreiben?
- „Gib mir die komplette Lösung“
+ „Gib mir eine Leitfrage, ohne die Antwort zu verraten“
- „Lös alle ähnlichen Aufgaben“
- „Sag mir nur die Zahl“
= Ein Hinweis lässt dir die Hauptarbeit.

?q:h Wie nutzt du die Feynman-Technik zusammen mit KI?
- Die KI das Thema erklären lassen und ihren Text auswendig lernen
+ Dem Modell das Thema in eigenen Worten erklären und es bitten, Fehler und Lücken zu finden
- Die KI den Aufsatz für dich schreiben lassen
- Zwei Antworten verschiedener Modelle vergleichen
= Du erklärst – das Modell hilft dir, die Lücken zu sehen.

?r:m Was tust du mit einer Erklärung, die dir eine KI gegeben hat?
- Sie ungeprüft übernehmen
+ Die wichtigsten Fakten mit einer verlässlichen Quelle abgleichen
- Sie wörtlich auswendig lernen
- Sie als eigene Arbeit ausgeben
= Auch Erklärungen können Fehler enthalten.

?r:e Welche Art von KI-Hilfe bewahrt dein Lernen?
+ Erklärungen, Fragen und Hinweise
- Fertige Antworten auf alle Aufgaben
- Arbeiten, die sie für dich schreibt
- Tests, die sie für dich löst
= Die Hauptanstrengung sollte bei dir bleiben.

!open Schreib einen Prompt für eine KI, der dir hilft, dich auf eine Prüfung oder ein Vorstellungsgespräch vorzubereiten, ohne die Arbeit für dich zu machen.
!rubric Kontext und Thema werden genannt
!rubric Der Prompt erfordert deine aktive Beteiligung
!rubric Es gibt Rückmeldung
!model Ich bereite mich auf ein Vorstellungsgespräch als Datenanalyst vor. Stell mir jeweils eine Frage zu SQL und Statistik, von leicht bis schwer. Sag mir nach jeder Antwort, was richtig war und was gefehlt hat, und stell erst dann die nächste Frage. Zeig mir keine Musterantworten, bis ich darum bitte.
