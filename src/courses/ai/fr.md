---
id: cb-ai-fr
version: 1
title: Culture de l’IA
description: Comment fonctionnent les chatbots comme ChatGPT, Claude ou Gemini, quand leur faire confiance, comment rédiger des requêtes et comment éviter de vous nuire ou de nuire aux autres. Huit courtes leçons sans jargon technique.
goal: Utiliser l’IA avec assurance et en toute sécurité pour étudier et travailler
language: French
minutes: 7
hue: 265
---

# ai-01 | Comment fonctionne l’IA | Ce qu’est un modèle de langage
## Un prédicteur du mot suivant
Les chatbots comme ChatGPT, Claude ou Gemini reposent sur de **grands modèles de langage**. Un tel modèle a été entraîné sur une immense quantité de textes et fait une chose très bien : à partir du début d’un texte, il prédit ce qui a le plus de chances de suivre. Quand il vous répond, il construit la réponse pas à pas à partir de petits morceaux, les **tokens** (des mots ou des parties de mots).

De ce mécanisme simple naissent des capacités remarquables : résumer, traduire, expliquer, écrire du code. Mais gardez en tête que le modèle ne « cherche pas la réponse dans une base de données » : il compose une suite plausible.

## Ce que le modèle ne sait pas
Un modèle a une **date limite de connaissances** : sur les événements postérieurs, il ne sait que ce qu’il trouve si on lui donne accès à la recherche web. Il ne se souvient pas de vos conversations passées, sauf si le service les conserve volontairement. Et il n’a aucune expérience propre, seulement des régularités tirées des textes.

!key Un modèle de langage prédit le prochain morceau de texte, le token.
!key La réponse est composée, pas tirée d’une base de données.
!key Un modèle a une date limite de connaissances ; il n’apprend les événements récents que par la recherche.
!key Les capacités du modèle viennent de régularités dans les textes, pas d’une expérience personnelle.

?q:e Que fait fondamentalement un grand modèle de langage ?
- Il cherche une réponse toute faite dans une base de données
+ Il prédit quel morceau de texte a le plus de chances de suivre
- Il copie des réponses de sites web en temps réel
- Il vous met en relation avec un expert humain
= Le modèle construit le texte pas à pas, token après token.

?q:e Qu’est-ce qu’un token ?
- Un mot de passe pour se connecter à un chatbot
+ Un morceau de texte — un mot ou une partie de mot — avec lequel le modèle travaille
- Une unité de paiement en cryptomonnaie
- Une réponse unique du modèle
= Le modèle lit et écrit le texte en tokens.

?q:m Pourquoi un modèle peut-il ignorer les nouvelles d’hier ?
+ Ses connaissances s’arrêtent à la date limite de ses données d’entraînement, sauf s’il a accès à la recherche web
- Il cache volontairement les nouvelles
- Il est interdit de parler d’actualité avec une IA
- Le modèle se met à jour chaque minute et n’a simplement pas suivi
= Sans recherche, le modèle ne connaît le monde que tel qu’il était lors de son entraînement.

?q:h Quelle affirmation sur un chatbot est la plus juste ?
- Il comprend le monde comme une personne qui a de l’expérience
- Il cite toujours ses sources mot pour mot
+ Il construit une réponse plausible à partir de régularités dans les textes
- Il se souvient de chaque conversation de chaque utilisateur
= Cela explique à la fois les forces et les erreurs des modèles.

?r:m D’où le modèle tire-t-il sa réponse à votre question ?
- De réponses enregistrées à l’avance
+ Il la compose en prédisant la suite du texte
- Il la télécharge depuis Wikipédia
- Les développeurs la fournissent à la main
= La réponse est générée, pas récupérée.

?r:e Qu’est-ce qui limite les connaissances d’un modèle sur les événements récents ?
+ La date limite de connaissances
- La taille de l’écran
- La langue de la requête
- L’heure de la journée
= Après cette date, le modèle ne sait que ce qu’il trouve par la recherche.

!open Expliquez à un ami en 3 ou 4 phrases comment fonctionne un chatbot et pourquoi il ne faut pas le croire sur parole.
!rubric La prédiction du texte suivant est mentionnée
!rubric Il est expliqué que la réponse est composée
!rubric Il y a une conclusion sur la vérification
!model Un chatbot est un programme qui a lu une quantité énorme de textes et appris à deviner quels mots doivent venir ensuite. Quand vous posez une question, il ne cherche pas la réponse dans un ouvrage de référence : il écrit un texte plausible. C’est pourquoi il a l’air sûr de lui même quand il se trompe, et il faut vérifier les faits importants.

# ai-02 | Comment fonctionne l’IA | Hallucinations et vérification des faits
## Sûr de lui, mais faux
Il arrive qu’un modèle produise des faits qui n’existent pas : citations, livres, articles de loi, liens ou chiffres inventés. On parle d’**hallucinations**. La cause tient au fonctionnement même du modèle : il construit un texte plausible, et plausible ne veut pas toujours dire vrai. Cela arrive surtout sur les sujets rares, les chiffres exacts, les dates et les références à des sources.

Le danger, c’est qu’une mauvaise réponse sonne aussi assurée qu’une bonne.

## Comment vérifier
- Vérifiez les faits importants à la source primaire : un site officiel, un document, un ouvrage de référence.
- Demandez des sources au modèle, et ouvrez-les. Un lien qui n’existe pas est un signal d’alarme.
- Creusez : « à quel point en es-tu sûr ? », « quels sont les contre-arguments ? ».
- Plus l’enjeu est élevé (santé, argent, droit, travail), plus la vérification doit être stricte. La décision finale revient à un humain.

!key Une hallucination est une information inventée présentée avec assurance.
!key Les erreurs sont plus fréquentes sur les sujets rares, les chiffres, les dates et les liens.
!key Vérifiez les faits importants à la source primaire.
!key Plus l’enjeu est élevé, plus la vérification est stricte ; c’est un humain qui décide.

?q:e Qu’est-ce qu’une hallucination d’un modèle ?
- Un bug d’affichage pendant la réponse
+ Une information inventée présentée avec assurance
- Une réponse dans une autre langue
- Une réponse trop longue
= Par exemple, une citation ou un lien qui n’existe pas.

?q:m Où les hallucinations sont-elles les plus fréquentes ?
- Dans la traduction de phrases simples
+ Dans les chiffres exacts, les dates, les citations et les références à des sources
- Dans les réponses à un bonjour
- Dans la correction de fautes de frappe
= Ce sont des détails que le modèle « complète » de façon plausible.

?q:m Le modèle cite le lien d’une étude. Que faut-il faire ?
- La citer tout de suite dans votre rapport
+ Ouvrir le lien et vérifier que l’étude existe et dit bien cela
- Demander au même modèle si c’est vrai et croire sa réponse
- Supprimer le lien et garder la conclusion
= Le lien doit être vérifié à la source primaire.

?q:h Vous interrogez une IA sur le dosage d’un médicament pour un proche. Quelle est la bonne façon de faire ?
- Faire confiance à la réponse si elle paraît sûre
- Demander à deux autres chatbots et faire la moyenne
+ Utiliser la réponse comme piste et vérifier auprès d’un médecin, d’un pharmacien ou de la notice officielle
- Ignorer la notice si l’IA a dit autre chose
= Quand l’enjeu est élevé, c’est un humain qui décide en s’appuyant sur une source fiable.

?r:m Pourquoi les modèles hallucinent-ils ?
+ Ils construisent un texte plausible, et plausible ne veut pas toujours dire vrai
- Ils sont entraînés exprès pour tromper
- À cause d’une connexion internet lente
- Parce que la question a été posée poliment
= Cela découle du fonctionnement même du modèle.

?r:e Que faire des faits importants d’une réponse d’IA ?
- Les apprendre par cœur
+ Les vérifier à la source primaire
- Les transférer à des amis
- Rien, l’IA ne se trompe pas
= La source primaire est le principal moyen de vérification.

!open Interrogez un chatbot sur un fait peu connu de votre métier ou de votre ville. Comment vérifierez-vous la réponse ? Décrivez les étapes.
!rubric Des étapes de vérification concrètes sont nommées
!rubric La source primaire est mentionnée
!rubric Il est reconnu qu’un ton assuré n’est pas une garantie
!model Je vais demander en quelle année notre musée local a été fondé. Ensuite, je trouverai le site officiel du musée et sa page dans l’annuaire de la ville, et je comparerai l’année et le nom du fondateur. Si les sources contredisent le modèle, je fais confiance aux sources : un ton assuré ne garantit rien.

# ai-03 | De bonnes requêtes | Comment rédiger une requête
## Quatre éléments
Le modèle ne lit pas dans vos pensées : la qualité de la réponse dépend beaucoup de la requête (le « prompt »). Une bonne requête contient en général :
1. **Le contexte** : qui vous êtes, à quoi cela sert, ce qu’on sait déjà.
2. **La tâche** : ce qu’il faut faire exactement : expliquer, raccourcir, comparer, imaginer.
3. **Le format** : une liste, un tableau, une lettre, 5 points, 100 mots au maximum.
4. **Les contraintes et critères** : le ton, le public, ce qu’il faut éviter.

## Avant et après
Faible : « Écris sur la gestion du temps. »

Mieux : « Je dirige une équipe de 5 designers et nous ratons sans cesse nos échéances. Propose 5 pratiques concrètes de planification hebdomadaire, chacune en 2 ou 3 phrases, sans conseils génériques du type “soyez plus organisés”. »

Les **exemples** aident aussi : montrez un modèle de la réponse attendue et l’IA en reprendra le style et la structure.

!key Une bonne requête : contexte, tâche, format, contraintes.
!key Plus la tâche est précise, plus la réponse est utile.
!key Indiquez explicitement le format et la longueur.
!key Un exemple de la réponse souhaitée aide le modèle à trouver le bon style.

?q:e Quelle requête a le plus de chances de donner une réponse utile ?
- « Parle-moi des CV »
+ « Je suis analyste junior et je postule dans une banque. Propose 3 points forts pour la rubrique Expérience, chacun avec un résultat chiffré »
- « CV »
- « Aide »
= Elle contient un contexte, une tâche et un format.

?q:m Lequel de ces éléments est le « format » ?
- « Je suis professeur de mathématiques »
+ « Réponds sous forme de tableau à trois colonnes »
- « Explique ce que sont les fractions »
- « J’en ai besoin pour le cours de demain »
= Le format, c’est l’aspect que doit avoir la réponse.

?q:m Pourquoi ajouter un exemple de la réponse souhaitée à une requête ?
- Pour que le modèle le recopie tel quel
+ Pour montrer le style, la structure et le niveau de détail attendus
- Un exemple ne fait qu’embrouiller le modèle
- Pour que la réponse soit plus courte
= Un modèle fixe la barre plus précisément qu’une description.

?q:h Vous avez obtenu une réponse trop générale sur le marketing. Que changer d’abord dans la requête ?
- Écrire la même chose en majuscules
+ Ajouter du contexte : le produit, le public, le budget et ce que vous avez déjà essayé
- Lui demander de répondre plus vite
- Changer la langue de la requête
= Une réponse générale vient en général d’une requête générale sans contexte.

?r:m Quels quatre éléments composent une bonne requête ?
+ Contexte, tâche, format, contraintes
- Salutation, question, remerciement, signature
- Sujet, mots-clés, hashtags, émojis
- Longueur, police, couleur, langue
= Ces éléments rendent la réponse utile.

?r:e Qu’est-ce qu’une requête (prompt) ?
- La réponse du modèle
+ La demande que vous écrivez au modèle
- Le nom du modèle
- Un réglage de l’écran
= La requête, c’est votre demande.

!open Transformez la requête faible « Aide pour une présentation » en une requête solide pour une vraie tâche à vous, en utilisant les quatre éléments.
!rubric Il y a un contexte
!rubric La tâche est précise
!rubric Le format et les contraintes sont indiqués
!model Je suis chef de produit et je présente vendredi les résultats trimestriels à la direction : le chiffre d’affaires a augmenté de 12 %, mais l’attrition des clients aussi. Prépare le plan d’une présentation de 8 diapositives avec un titre et 2 ou 3 points clés par diapositive. Ton professionnel, sans jargon ; une diapositive à part sur ce que nous faisons contre l’attrition.

# ai-04 | De bonnes requêtes | Dialogue et itération
## La première réponse est un brouillon
Le meilleur résultat arrive rarement du premier coup. Considérez la réponse comme un **brouillon** et affinez-la en dialoguant : « plus court », « plus simple, pour un débutant », « ajoute un exemple du commerce de détail », « enlève le troisième point ».

Des techniques utiles :
- Demandez **plusieurs options** : « donne-moi 3 titres différents », puis choisissez ou combinez.
- Demandez au modèle de **vous poser des questions** : « avant d’écrire, demande-moi ce qui manque ».
- Demandez une **critique** : « trouve les points faibles de ce plan » ou « qu’objecterait un sceptique ? ».

## Découper les grandes tâches
Une tâche complexe se fait mieux par étapes : d’abord la structure, puis chaque partie, puis une vérification. Il est ainsi plus facile de contrôler la qualité et de corriger le tir à temps.

Si la conversation s’enlise et que le modèle répète les mêmes erreurs, il est parfois plus rapide d’ouvrir une nouvelle discussion avec une requête améliorée.

!key La première réponse est un brouillon ; affinez-la en dialoguant.
!key Demandez des options, des questions de clarification et une critique.
!key Faites les grandes tâches par étapes : structure → parties → vérification.
!key Si la conversation est bloquée, recommencez avec une meilleure requête.

?q:e Comment considérer la première réponse du modèle ?
+ Comme un brouillon qu’on peut améliorer
- Comme le résultat final
- Comme une erreur si elle n’est pas parfaite
- Comme une réponse qu’on ne peut pas modifier
= Affiner en dialoguant fait normalement partie du travail.

?q:m Quelle demande aide à trouver les points faibles d’un texte ?
- « Rends-le meilleur »
+ « Qu’objecterait un sceptique à ce plan ? »
- « Réécris la même chose »
- « Merci, tout va bien »
= Demander une critique révèle les faiblesses.

?q:m Pourquoi demander au modèle de vous poser des questions avant de répondre ?
- Pour gagner du temps
+ Pour qu’il découvre le contexte manquant et réponde plus précisément
- C’est une formule de politesse
- Pour que la réponse soit plus courte
= Le modèle montrera quelles informations lui manquent.

?q:h Vous avez besoin d’un rapport de 10 pages. Quelle approche est la plus fiable ?
- Demander tout le rapport en un message et l’envoyer aussitôt
+ Se mettre d’accord sur la structure, puis écrire les parties une à une et vérifier à la fin
- Demander dix rapports différents et en choisir un au hasard
- Écrire une requête d’une ligne
= Travailler par étapes permet de contrôler la qualité.

?r:m Que faire si le modèle répète sans cesse la même erreur dans une conversation ?
- Répéter la même demande plus fort
+ Ouvrir une nouvelle discussion avec une requête améliorée
- Supprimer l’application
- Accepter l’erreur
= Un contexte neuf résout souvent le problème.

?r:e Comment obtenir plusieurs idées parmi lesquelles choisir ?
+ Demander plusieurs options différentes
- Demander une seule option parfaite
- Poser une question sans contexte
- Ne rien demander
= Les options se comparent et se combinent.

!open Décrivez comment vous mèneriez une conversation avec une IA pour préparer un e-mail d’excuses à un client pour une commande en retard. Quelles étapes et quels ajustements feriez-vous ?
!rubric Il y a une requête initiale avec contexte
!rubric Il y a au moins deux ajustements
!rubric Il y a une vérification humaine finale
!model D’abord, je donne le contexte : la commande a 5 jours de retard à cause d’un fournisseur, le client est un habitué, je veux préserver la relation. Je demande 2 versions de l’e-mail. Ensuite : « rends la deuxième plus courte et plus chaleureuse », « ajoute un geste commercial : 10 % sur la prochaine commande ». À la fin, je vérifie moi-même les dates, le montant et le nom du client avant d’envoyer.

# ai-05 | Sécurité et responsabilité | Données et vie privée
## Ce que vous envoyez
Tout ce que vous tapez dans un chatbot part sur les serveurs de l’entreprise. Selon le service et la formule, les conversations peuvent être conservées, relues pour le contrôle qualité ou utilisées pour entraîner de futurs modèles. C’est particulièrement fréquent avec les **formules gratuites** : les conditions valent la peine d’être lues.

## Ce qu’il ne faut pas envoyer
- mots de passe, codes reçus par SMS, données de carte bancaire ;
- données personnelles d’autrui sans consentement : numéros d’identité, adresses, informations médicales ;
- documents confidentiels de votre employeur, sauf si l’entreprise dispose d’un service d’IA approuvé.

## Travailler plus sûrement
- Anonymisez : remplacez les noms et les numéros par « Client A », « montant X ».
- Renseignez-vous sur les règles de votre entreprise : beaucoup n’autorisent que les versions professionnelles des services d’IA.
- Vérifiez les réglages du service : on peut souvent désactiver l’utilisation de ses conversations pour l’entraînement.

!key Tout ce que vous tapez dans un chatbot part sur les serveurs de l’entreprise.
!key Les formules gratuites utilisent plus souvent les conversations pour l’entraînement : lisez les conditions.
!key N’envoyez ni mots de passe, ni données de paiement, ni données personnelles d’autrui.
!key Anonymisez les données et suivez les règles de votre employeur.

?q:e Laquelle de ces choses ne doit jamais être envoyée à un chatbot ?
- Une question de grammaire
+ Un code SMS de confirmation de paiement
- Une demande de nom pour un chat
- Le texte de votre propre publication publique
= Les codes SMS et les mots de passe ne se partagent avec personne.

?q:m Vous voulez qu’une IA vous aide à analyser la réclamation d’un client. Quelle est la façon la plus sûre ?
- Coller toute la réclamation avec le téléphone et l’adresse du client
+ Retirer le nom, les coordonnées et le numéro de contrat en les remplaçant par des étiquettes
- Envoyer une capture d’écran de la pièce d’identité du client
- Demander au client d’écrire lui-même au chatbot
= L’anonymisation garde le sens et protège la personne.

?q:m Pourquoi lire les conditions de la formule gratuite d’un service d’IA ?
+ Les conversations d’une formule gratuite peuvent servir à entraîner des modèles
- Une formule gratuite est toujours plus dangereuse qu’une payante à tous égards
- Les conditions ne concernent que les juristes
- Elles contiennent les réponses à toutes les questions
= Les conditions déterminent ce que deviennent vos données.

?q:h Votre entreprise dispose d’un service d’IA professionnel, mais votre service gratuit personnel est plus pratique. Vous préparez un rapport avec des chiffres internes. Que faire ?
- Utiliser le service personnel, puisqu’il est plus pratique
+ Utiliser le service professionnel, comme l’exigent les règles
- Envoyer les chiffres au service personnel, puis supprimer la conversation
- Demander à un collègue de l’envoyer à votre place
= Les données confidentielles de l’entreprise ne vont que dans des services approuvés.

?r:m Que signifie anonymiser des données ?
- Supprimer tout le texte
+ Remplacer les noms, les coordonnées et les chiffres exacts par des étiquettes
- Traduire le texte dans une autre langue
- Couper le texte en deux
= Le sens reste, les détails personnels non.

?r:e Où va le texte que vous tapez dans un chatbot ?
+ Sur les serveurs de l’entreprise qui fournit le service
- Nulle part, il reste sur votre téléphone
- Directement à la police
- Publiquement sur internet
= C’est pourquoi ce que vous envoyez compte.

!open Prenez une vraie tâche de travail ou d’études pour laquelle une IA vous aiderait. Quelles données faudrait-il retirer ou remplacer avant de l’envoyer ?
!rubric La tâche est décrite
!rubric Des données sensibles précises sont nommées
!rubric Une façon d’anonymiser est proposée
!model La tâche : analyser un tableau des ventes par commercial et trouver les causes d’une baisse. Avant l’envoi, je remplace les noms des commerciaux par « Commercial 1 à 5 », je retire les noms des clients et j’arrondis les montants. Je garde la structure et les tendances : cela suffit pour l’analyse.

# ai-06 | Sécurité et responsabilité | Où l’IA est forte, où elle est faible
## Points forts
L’IA réussit bien les tâches qui consistent à travailler du texte et dont le résultat est facile à vérifier :
- brouillons d’e-mails, de publications, de plans ;
- résumé et raccourcissement de longs textes ;
- explication de choses complexes avec des mots simples et des exemples ;
- remue-méninges : idées, noms, options ;
- traduction et révision du style ;
- aide pour le code et les formules (avec vérification).

## Points faibles
- **Calculs exacts** : les modèles peuvent se tromper en arithmétique s’ils n’utilisent pas une calculatrice ou du code.
- **Événements récents** sans accès à la recherche.
- **Faits pointus** : noms rares, citations, numéros de documents.
- **Décisions à fort enjeu** : diagnostics, décisions juridiques et financières, seulement avec la vérification d’un spécialiste.

Une bonne règle : utilisez l’IA là où **vérifier le résultat est plus facile que faire le travail de zéro**.

!key L’IA est forte pour les brouillons, résumés, explications, idées et traductions.
!key Points faibles : calculs exacts, événements récents, faits rares.
!key Les décisions à fort enjeu sont prises par une personne avec un spécialiste.
!key Utilisez l’IA là où vérifier est plus facile que tout faire de zéro.

?q:e Pour quelle tâche l’IA est-elle particulièrement adaptée ?
+ Rédiger le brouillon d’un e-mail à des collègues
- Poser un diagnostic médical
- Décider s’il faut signer un contrat
- Obtenir le taux de change exact du jour sans recherche
= Un brouillon est facile à vérifier et à corriger.

?q:m Pourquoi revérifier les calculs d’un modèle ?
- Les modèles calculent toujours faux
+ Un modèle peut se tromper en arithmétique s’il n’utilise pas une calculatrice ou du code
- Les calculs sont interdits dans les chatbots
- Les nombres des réponses sont toujours arrondis
= Un modèle de langage prédit du texte ; il ne calcule pas.

?q:m Quelle règle aide à décider s’il faut utiliser l’IA ?
- Utiliser l’IA pour tout
- Ne jamais utiliser l’IA au travail
+ L’utiliser là où vérifier le résultat est plus facile que faire le travail de zéro
- Ne l’utiliser que le week-end
= On gagne du temps tout en gardant le contrôle.

?q:h Quelle tâche est un exemple d’utilisation raisonnable de l’IA ?
- Demander à l’IA quel crédit prendre et signer aussitôt
+ Demander à l’IA de résumer un long contrat en termes simples, et discuter des clauses litigieuses avec un juriste
- Copier une réponse d’IA dans un article scientifique sans vérifier
- Laisser l’IA choisir un traitement médical
= L’IA accélère la compréhension ; la décision reste à une personne et à un spécialiste.

?r:m Lequel de ces éléments est un point faible des modèles ?
- Reformuler un texte
+ Les faits rares : citations exactes, numéros de documents
- Le remue-méninges
- Expliquer avec des mots simples
= Le modèle peut inventer des faits pointus.

?r:e Qui prend les décisions à fort enjeu ?
+ Une personne, avec un spécialiste si nécessaire
- Le modèle, s’il est sûr de lui
- Celui qui répond le plus vite
- Personne
= L’IA est un assistant, pas le responsable.

!open Citez trois tâches de votre semaine : une à confier à l’IA, une pour laquelle l’utiliser avec prudence et une pour laquelle ne pas l’utiliser. Expliquez pourquoi.
!rubric Trois tâches de types différents
!rubric Une explication fondée sur la vérifiabilité ou l’enjeu
!rubric Des exemples réalistes
!model À confier à l’IA : le brouillon de mon rapport hebdomadaire, que je peux facilement vérifier avec mes données. Avec prudence : la traduction d’un e-mail à un partenaire, dont je vérifierai les termes et le ton. Pas du tout : décider quel candidat recruter, car l’enjeu est élevé et c’est à une personne de décider.

# ai-07 | Sécurité et responsabilité | Biais, paternité, honnêteté
## Les biais
Les modèles apprennent sur des textes humains, avec leurs stéréotypes. Les réponses peuvent donc être biaisées : par exemple attribuer par défaut un genre à une profession ou décrire des pays par des clichés. Repérez-le et demandez d’autres points de vue : « et si on regardait sous un autre angle ? ».

## Paternité et honnêteté
- **Transparence**. Si les règles de votre établissement ou de votre employeur l’exigent, dites que vous avez utilisé une IA. Beaucoup d’universités et d’éditeurs ont déjà de telles règles.
- **Responsabilité**. Vous êtes responsable du texte que vous publiez, même si un modèle l’a écrit.
- **Droits d’autrui**. Un modèle peut reproduire des fragments de textes d’autres personnes ; ne les faites pas passer pour les vôtres et vérifiez les emprunts.
- **Hypertrucages (deepfakes)**. Ne créez pas de fausses photos, voix ou vidéos de personnes réelles sans leur consentement, et n’utilisez pas l’IA pour tromper.

!key Les modèles héritent des stéréotypes des textes : surveillez les biais.
!key Signalez l’usage de l’IA quand les règles l’exigent.
!key C’est vous, pas le modèle, qui êtes responsable du texte publié.
!key N’utilisez pas l’IA pour tromper ou pour imiter de vraies personnes.

?q:e D’où viennent les biais des modèles ?
- Ils sont ajoutés exprès
+ Les modèles apprennent sur des textes humains, stéréotypes compris
- D’une mauvaise connexion internet
- Seules les personnes peuvent être biaisées
= Les données reflètent la société avec toutes ses distorsions.

?q:m Qui est responsable d’une publication écrite avec l’IA et publiée sous votre nom ?
- L’entreprise qui a développé le modèle
+ Vous, en tant qu’auteur de la publication
- Personne
- Les lecteurs
= Celui qui publie est responsable de la publication.

?q:m Votre université exige de signaler l’usage de l’IA. Vous avez demandé à une IA de raccourcir l’introduction de votre dissertation. Que faire ?
+ Le signaler comme l’exigent les règles
- Ne pas le mentionner, les changements étant minimes
- Supprimer l’historique de la conversation
- Réécrire le texte avec une autre IA pour le cacher
= L’honnêteté et les règles passent avant le confort.

?q:h Quel usage de l’IA est inacceptable ?
- Demander des idées de message d’anniversaire pour un collègue
- Demander l’explication d’un sujet difficile
+ Générer un message vocal « de la part » d’une connaissance pour demander de l’argent à ses amis
- Demander une vérification grammaticale
= C’est une tromperie par imitation d’une personne réelle.

?r:m Comment réagir à un stéréotype dans la réponse d’un modèle ?
- L’accepter comme un fait
+ Le repérer et demander un autre point de vue
- Supprimer l’application immédiatement
- Partager la réponse sans commentaire
= L’esprit critique envers les réponses fait partie de la culture de l’IA.

?r:e Peut-on faire passer le texte d’un modèle pour entièrement le sien là où les règles l’interdisent ?
- Oui, si personne ne s’en aperçoit
+ Non, il faut suivre les règles et signaler l’usage de l’IA
- Oui, si le texte est court
- Oui, si on le traduit
= Les règles d’honnêteté s’appliquent aussi à l’IA.

!open Écrivez 3 règles personnelles pour utiliser l’IA honnêtement dans vos études ou votre travail.
!rubric Trois règles concrètes
!rubric La responsabilité et la transparence sont abordées
!rubric Les règles sont pratiques
!model 1) Je vérifie et corrige tout ce que l’IA écrit : je ne valide que ce avec quoi je suis d’accord. 2) Si les règles du cours ou du client l’exigent, je dis que j’ai utilisé une IA et pour quoi faire. 3) Je n’envoie pas de données personnelles d’autrui et ne crée rien au nom de personnes réelles.

# ai-08 | Sécurité et responsabilité | Apprendre avec l’IA
## Un assistant, pas un remplaçant
L’IA peut accélérer l’apprentissage, ou le remplacer discrètement. Si le modèle résout les problèmes à votre place, vous obtenez la réponse mais pas la compétence : la mémoire et la compréhension ne grandissent que par votre propre effort. Souvenez-vous du premier cours : **se rappeler et expliquer** rendent le savoir durable.

## Utiliser l’IA pour apprendre
- Demandez-lui d’**expliquer** un sujet de différentes façons, avec des exemples tirés de votre vie.
- Demandez-lui de **vous interroger** sur le sujet et de vérifier vos réponses : c’est de la pratique de récupération.
- Demandez un **indice**, pas une solution toute faite : « pose-moi une question qui m’oriente ».
- Expliquez vous-même le sujet au modèle et demandez-lui de trouver les erreurs : c’est la technique Feynman.
- Vérifiez les faits : une explication d’IA peut, elle aussi, contenir des erreurs.

## L’IA dans Chompbook
Si vous connectez une IA, Chompbook rédige des leçons à partir de vos propres documents et vérifie vos réponses écrites. Les leçons créées par l’IA sont signalées, et le drapeau en haut d’une leçon permet de signaler une erreur. Sans IA, l’application fonctionne quand même, avec des cours prêts à l’emploi et vos propres sources.

!key Si l’IA fait le travail à votre place, la compétence ne progresse pas.
!key Demandez des explications, des questions et des indices, pas des solutions toutes faites.
!key Expliquez vous-même le sujet au modèle et demandez-lui de trouver les erreurs.
!key Les explications de l’IA doivent aussi être vérifiées.

?q:e Pourquoi est-il risqué de faire résoudre tous vos exercices par une IA ?
+ Vous obtenez des réponses mais pas la compétence : la compréhension vient de votre propre effort
- L’IA les résout toujours mal
- C’est interdit par la loi
- C’est trop cher
= Le savoir se consolide en se rappelant et en expliquant soi-même.

?q:m Quelle demande à l’IA entraîne le mieux votre mémoire ?
- « Résous le problème à ma place »
+ « Pose-moi 5 questions sur ce sujet et vérifie mes réponses »
- « Écris un résumé, je le lirai plus tard »
- « Dis-moi juste la réponse »
= C’est de la pratique de récupération avec retour.

?q:m Vous bloquez sur un problème. Comment demander de l’aide pour apprendre plutôt que copier ?
- « Donne-moi la solution complète »
+ « Pose-moi une question qui m’oriente, sans révéler la réponse »
- « Résous tous les problèmes similaires »
- « Dis-moi juste le nombre »
= Un indice vous laisse l’essentiel du travail.

?q:h Comment utiliser la technique Feynman avec une IA ?
- Demander à l’IA d’expliquer le sujet et apprendre son texte par cœur
+ Expliquer le sujet au modèle avec vos mots et lui demander de trouver les erreurs et les lacunes
- Demander à l’IA d’écrire la dissertation pour vous
- Comparer deux réponses de modèles différents
= Vous expliquez ; le modèle vous aide à voir les lacunes.

?r:m Que faire d’une explication donnée par une IA ?
- L’accepter sans vérifier
+ Vérifier les faits clés dans une source fiable
- L’apprendre mot pour mot
- La présenter comme votre propre travail
= Les explications peuvent aussi contenir des erreurs.

?r:e Quel type d’aide de l’IA préserve votre apprentissage ?
+ Explications, questions et indices
- Des réponses toutes faites à tous les devoirs
- Écrire vos travaux à votre place
- Passer les tests à votre place
= L’effort principal doit rester le vôtre.

!open Rédigez une requête pour une IA qui vous aidera à préparer un examen ou un entretien d’embauche sans faire le travail à votre place.
!rubric Le contexte et le sujet sont donnés
!rubric La requête exige votre participation active
!rubric Il y a un retour
!model Je prépare un entretien pour un poste d’analyste de données. Pose-moi une question à la fois sur le SQL et les statistiques, des plus faciles aux plus difficiles. Après chaque réponse, dis-moi ce qui était juste et ce qui manquait, et seulement ensuite pose la question suivante. Ne montre pas de réponses types tant que je ne le demande pas.
