---
id: cb-data-fr
version: 1
title: Données et tableurs : les bases
description: Comment s’organisent les données en tableau, comment les garder propres, calculer avec des formules, rechercher des valeurs, synthétiser et montrer les résultats honnêtement dans des graphiques. Valable pour Excel, Google Sheets et les outils similaires.
goal: Travailler avec aisance dans un tableur et tirer des conclusions des données
language: French
minutes: 7
hue: 174
---

// Noms des fonctions : Excel en français. Séparateur d’arguments : point-virgule.

# data-01 | Comment s’organisent les données | Qu’est-ce qu’un tableau de données
## Lignes et colonnes
La plupart des données professionnelles se trouvent dans des **tableaux**. Dans un tableau bien organisé :
- chaque **ligne** est un enregistrement (une vente, un client, un jour) ;
- chaque **colonne** est un attribut de cet enregistrement (date, montant, ville) ;
- la première ligne contient les **en-têtes** de colonnes.

Cette organisation s’appelle des « données bien rangées » (tidy data). Les formules, les filtres, les tableaux croisés dynamiques et tous les outils d’analyse fonctionnent avec elle.

## Types de données
Chaque colonne a un type :
- **nombres** : on peut calculer avec (somme, nombre) ;
- **texte** : noms, libellés, catégories ;
- **dates et heures** : dans le logiciel, ce sont aussi des nombres, on peut donc les soustraire et les regrouper ;
- **valeurs logiques** : VRAI/FAUX.

Une erreur fréquente est un nombre enregistré comme texte (par exemple « 1 200 € »). Le logiciel ne peut pas l’additionner. Mettez plutôt l’unité dans l’en-tête : « Montant, € ».

!key Une ligne est un enregistrement, une colonne un attribut, la première ligne contient les en-têtes.
!key Un tableau bien rangé fonctionne avec les formules, les filtres et les tableaux croisés dynamiques.
!key Les types principaux : nombres, texte, dates, valeurs logiques.
!key Ne mélangez pas nombres et texte dans une cellule : l’unité va dans l’en-tête.

?q:e Dans un tableau bien rangé, que représente une ligne ?
- Un attribut, par exemple « ville »
+ Un enregistrement, par exemple une vente
- Le titre du tableau
- Le total de toutes les données
= Les lignes sont des enregistrements, les colonnes des attributs.

?q:m Pourquoi « 1 200 € » dans une cellule est-il une mauvaise idée ?
- C’est trop long
+ Le logiciel le traite comme du texte et ne peut pas l’additionner aux autres montants
- On ne peut pas stocker des euros dans un tableur
- La cellule deviendra rouge
= Mettez l’unité dans l’en-tête : « Montant, € ».

?q:m Quel est le type de la colonne « Date de commande » ?
- Texte
- Logique
- Juste un nombre sans signification
+ Date : dans le logiciel c’est un nombre, on peut donc soustraire et regrouper les dates
= Les dates sont stockées comme des nombres, ce qui permet de calculer des durées.

?q:h Un tableau a des colonnes « janvier », « février », « mars », avec les commerciaux en lignes. Pourquoi est-ce peu pratique pour l’analyse ?
+ Un seul attribut (le mois) est réparti sur plusieurs colonnes ; pour l’analyse, mieux vaut des colonnes « Commercial », « Mois », « Montant »
- Ce n’est pas un problème, c’est la disposition idéale
- Les mois ne doivent pas avoir de majuscule
- Il y a trop peu de lignes
= Dans des données bien rangées, chaque attribut forme une colonne.

?r:m Que doit contenir la première ligne d’un tableau ?
+ Les en-têtes de colonnes
- Les totaux
- Une ligne vide
- Le nom de l’entreprise
= Les formules, les filtres et les tableaux croisés dynamiques ont besoin d’en-têtes.

?r:e Qu’est-ce qu’une colonne dans un tableau bien rangé ?
- Un enregistrement
+ Un attribut des enregistrements
- Un ensemble de valeurs au hasard
- Un espace pour les commentaires
= Par exemple, « Ville » ou « Montant ».

!open Prenez un tableau de votre travail ou de votre vie (un budget, des ventes, une liste de tâches). Décrivez ses lignes, ses colonnes et ses types de données, et ce qu’on pourrait améliorer.
!rubric Les lignes et les colonnes sont décrites
!rubric Les types de données sont nommés
!rubric Une amélioration est proposée
!model Mon tableau de dépenses : une ligne est un achat, les colonnes sont la date (date), la catégorie (texte), le montant (nombre), carte ou espèces (texte). Amélioration : les montants sont écrits « 35 € » ; je vais retirer le « € » et mettre l’unité dans l’en-tête « Montant, € » pour pouvoir les additionner.

# data-02 | Comment s’organisent les données | Des données propres
## Le désordre typique
Analyser des données sales mène à de mauvaises conclusions. Les problèmes les plus courants :
- les **doublons** : le même enregistrement deux fois ;
- les **espaces en trop** et les graphies différentes : « Lyon », « lyon », « Lyon » ;
- les **formats de date différents** : 03/04/2025 et 2025-04-03 dans une même colonne ;
- les **cellules fusionnées**, qui cassent le tri et les filtres ;
- les **valeurs manquantes** et les substituts comme « — », « n/d », ou 0 au lieu de « pas de données » ;
- **plusieurs tableaux sur une feuille** et des totaux au milieu des données.

## Comment nettoyer
- Supprimez les doublons avec la commande intégrée (Données → Supprimer les doublons).
- La fonction **SUPPRESPACE** retire les espaces en trop ; **MAJUSCULE/MINUSCULE/NOMPROPRE** uniformisent la casse.
- Utilisez des **listes déroulantes** (validation des données) pour les catégories, afin d’éviter de nouvelles graphies.
- Une valeur vide et zéro ne sont pas la même chose : 0 signifie « zéro », une cellule vide signifie « inconnu ».
- Conservez les données d’origine à part et nettoyez une copie.

!key Données sales : doublons, espaces, formats mélangés, cellules fusionnées.
!key Zéro et une valeur vide ne veulent pas dire la même chose.
!key Les listes déroulantes évitent des catégories incohérentes.
!key Conservez les données d’origine et nettoyez une copie.

?q:e Qu’est-ce qui casse le plus souvent le tri et les filtres ?
- Les en-têtes de colonnes
+ Les cellules fusionnées
- Les valeurs numériques
- Des dates dans un même format
= Les cellules fusionnées brisent la grille des lignes et des colonnes.

?q:m La colonne « Ville » contient « Lille », « lille » et « Lille ». Que se passe-t-il quand on compte par ville ?
- Tout est compté correctement
+ Le logiciel peut les compter comme des villes différentes
- Le tableau supprime les lignes en trop
- Une erreur de formule apparaît
= Il faut uniformiser la casse et retirer les espaces.

?q:m En quoi une cellule vide diffère-t-elle de zéro dans une colonne « Chiffre d’affaires » ?
+ Zéro signifie qu’il n’y a pas eu de chiffre d’affaires ; une cellule vide, que la donnée manque
- Aucune différence
- Une cellule vide signifie toujours zéro
- Zéro signifie une erreur
= Remplacer les valeurs manquantes par des zéros fausse les moyennes et les totaux.

?q:h Avant d’analyser les ventes, vous trouvez des commandes en double. Que faut-il faire ?
- Supprimer aussitôt les doublons dans le fichier d’origine sans garder l’original
+ Garder l’original, trouver et supprimer les doublons dans une copie, et vérifier combien de lignes ont été supprimées
- Laisser les doublons : ils ne comptent presque pas
- Supprimer toutes les lignes dont le montant se répète
= L’original est votre filet de sécurité ; un même montant ne signifie pas forcément un doublon.

?r:m Que fait la fonction SUPPRESPACE ?
- Elle supprime les lignes vides
+ Elle retire les espaces en trop dans un texte
- Elle convertit du texte en nombres
- Elle supprime les doublons
= Elle aide à uniformiser les valeurs.

?r:e Comment éviter des graphies incohérentes des catégories ?
+ Utiliser une liste déroulante
- Écrire en majuscules
- Fusionner les cellules
- Supprimer la colonne
= La liste limite ce qu’on peut saisir.

!open Décrivez trois problèmes de données que vous avez rencontrés (ou pourriez rencontrer) dans des tableaux professionnels et comment vous les corrigeriez.
!rubric Trois problèmes précis
!rubric Une correction pour chacun
!rubric Le travail sur une copie ou la vérification du résultat est mentionné
!model 1) Des dates dans des formats différents : les convertir en un seul format de date et vérifier que le tri suit bien la chronologie. 2) Des noms de produits avec des espaces en trop : appliquer SUPPRESPACE. 3) Des commandes en double après un export : les supprimer avec « Supprimer les doublons » dans une copie et comparer le nombre de lignes avant et après.

# data-03 | Formules | Formules et références
## Comment fonctionne une formule
Une formule commence par le signe **=**. Par exemple, `=B2*C2` multiplie les valeurs des cellules B2 et C2. Si les nombres de départ changent, le résultat se recalcule tout seul : c’est la force des tableurs.

Fonctions de base :
- **SOMME** : total, `=SOMME(D2:D100)` ;
- **MOYENNE** : la moyenne ;
- **NB** : combien de cellules contiennent des nombres ; **NBVAL** : combien ne sont pas vides ;
- **MIN / MAX**.

Dans Excel en français, les noms des fonctions sont traduits et les arguments sont séparés par un point-virgule : `=SI(A2>0;1;0)`. Dans les versions anglaises, ces fonctions s’appellent SUM, AVERAGE, COUNT, COUNTA, IF.

## Références relatives et absolues
Quand vous recopiez une formule vers le bas, les références **se décalent** : `=B2*C2` devient `=B3*C3` à la ligne suivante. Ce sont des références **relatives**.

Si une référence doit rester fixe (par exemple un taux de change dans la cellule F1), on la bloque avec des signes dollar : `=B2*$F$1`. C’est une référence **absolue**. Dans Excel, la touche F4 fait alterner le type de référence.

!key Une formule commence par « = » et se recalcule quand les données changent.
!key SOMME, MOYENNE, NB, MIN, MAX sont les fonctions de base.
!key Les références relatives se décalent quand on recopie une formule.
!key $F$1 est une référence absolue : elle ne se décale pas.

?q:e Par quel caractère commence une formule ?
- #
+ =
- $
- *
= Le signe égal indique au logiciel qu’une formule suit.

?q:m La formule =B2*C2 est recopiée une ligne plus bas. Qu’obtient-on ?
- =B2*C2
+ =B3*C3
- =C2*D2
- Une erreur
= Les références relatives se déplacent avec la formule.

?q:m Le taux du dollar est dans la cellule F1. Quelle formule de conversion du montant de B2 se recopie correctement vers le bas ?
- =B2*F1
+ =B2*$F$1
- =$B$2*F1
- =B2+F1
= La référence au taux doit être bloquée avec des signes dollar.

?q:h Quelle différence entre NB et NBVAL ?
+ NB compte les cellules contenant des nombres, NBVAL toutes les cellules non vides
- Elles sont identiques
- NBVAL ne compte que les cellules vides
- NB additionne les valeurs
= Si la plage contient du texte, les résultats diffèrent.

?r:m Que signifient les signes dollar dans $F$1 ?
- Que la cellule contient de l’argent
+ Que la référence est absolue et ne se décale pas quand on recopie
- Que la cellule est protégée par mot de passe
- Que la formule contient une erreur
= Le signe dollar bloque la colonne et la ligne.

?r:e Quelle fonction calcule la moyenne ?
- SOMME
+ MOYENNE
- NB
- MAX
= MOYENNE divise la somme par le nombre de valeurs.

!open Vous avez les colonnes « Prix » (B) et « Quantité » (C) et un taux de remise dans la cellule F1. Écrivez une formule pour le total remisé de la ligne 2, qu’on peut recopier vers le bas, et expliquez le choix des références.
!rubric La formule est correcte
!rubric La remise est bloquée par une référence absolue
!rubric Il est expliqué pourquoi B2 et C2 sont relatives
!model =B2*C2*(1-$F$1). B2 et C2 sont relatives : recopiées vers le bas, elles deviennent B3, C3 et ainsi de suite pour chaque ligne. Le taux de remise est le même pour tous, donc $F$1 est bloquée et ne se décale pas.

# data-04 | Formules | Conditions : SI et comptage conditionnel
## La fonction SI
**SI** choisit un résultat selon une condition : `=SI(condition;valeur_si_vrai;valeur_si_faux)`.

Exemple : `=SI(D2>=100000;"Grosse";"Normale")` marque comme grosses les commandes de 100 000 ou plus.

Les conditions se construisent avec des comparaisons : `>`, `<`, `>=`, `<=`, `=`, `<>` (différent de). Plusieurs conditions se combinent avec **ET** et **OU** : `=SI(ET(D2>0;E2="Paris");1;0)`.

## Compter et additionner selon une condition
- **NB.SI** : combien de cellules remplissent une condition, `=NB.SI(E2:E100;"Paris")`.
- **SOMME.SI** : une somme selon une condition, `=SOMME.SI(E2:E100;"Paris";D2:D100)`, le chiffre d’affaires de Paris uniquement.
- Pour plusieurs conditions, il existe **NB.SI.ENS** et **SOMME.SI.ENS**.

De longues chaînes de SI imbriqués sont difficiles à lire. S’il y a beaucoup de cas, mieux vaut créer un tableau de référence séparé et y faire une recherche : c’est la leçon suivante.

!key SI(condition;si_vrai;si_faux) choisit un résultat selon une condition.
!key ET / OU combinent plusieurs conditions.
!key NB.SI et SOMME.SI comptent et additionnent selon une condition.
!key Beaucoup de SI imbriqués signalent qu’il faut un tableau de référence.

?q:e Que renvoie =SI(5>3;"oui";"non") ?
+ « oui »
- « non »
- 5
- Une erreur
= La condition 5>3 est vraie, donc le deuxième argument est renvoyé.

?q:m Quelle formule compte les commandes de Lille dans la plage E2:E100 ?
- =SOMME(E2:E100;"Lille")
+ =NB.SI(E2:E100;"Lille")
- =SI(E2:E100="Lille")
- =MOYENNE(E2:E100)
= NB.SI compte les cellules qui remplissent la condition.

?q:m Comment écrire « différent de » dans une formule ?
- !=
- ><
+ <>
- =/
= Dans les tableurs, « différent de » s’écrit <>.

?q:h Il vous faut le chiffre d’affaires de Paris pour mars uniquement ; la ville est en E, le mois en F, le chiffre d’affaires en D. Quelle fonction convient le mieux ?
- SOMME.SI avec une condition
- SI sans somme
+ SOMME.SI.ENS avec deux conditions
- NB.SI
= SOMME.SI.ENS additionne selon plusieurs conditions à la fois.

?r:m Que fait SOMME.SI ?
- Elle compte des cellules
+ Elle additionne les valeurs qui remplissent une condition
- Elle trouve le maximum
- Elle supprime des lignes selon une condition
= Par exemple, le chiffre d’affaires d’une seule ville.

?r:e Comment combiner deux conditions qui doivent être vraies toutes les deux ?
+ Avec la fonction ET
- Avec la fonction OU
- Avec un signe dollar
- Avec la fonction SOMME
= ET ne renvoie VRAI que si toutes les conditions sont remplies.

!open Pensez à une tâche de votre travail ou de votre quotidien où SI ou SOMME.SI vous aiderait, et écrivez la formule.
!rubric La tâche est décrite
!rubric La formule est plausible
!rubric Il est expliqué ce que renvoie la formule
!model Dans mon tableau de dépenses, la catégorie est en B et le montant en C. Pour savoir combien est parti en courses, j’écris =SOMME.SI(B2:B200;"Courses";C2:C200). Elle additionne les montants uniquement dans les lignes dont la catégorie est « Courses ».

# data-05 | Formules | Rechercher des valeurs : RECHERCHEV et RECHERCHEX
## Pourquoi rechercher
Les données sont souvent réparties dans plusieurs tableaux : l’un avec les commandes et les codes produits, l’autre une liste de référence avec les prix. Les fonctions de recherche ramènent la bonne valeur grâce à une clé.

## RECHERCHEV et RECHERCHEX
**RECHERCHEV** (VLOOKUP en anglais) cherche une valeur dans la première colonne d’une plage et renvoie la valeur d’une colonne donnée sur la même ligne :
`=RECHERCHEV(A2;Prix!A:C;3;FAUX)`

Le dernier argument **FAUX** signifie une correspondance exacte : vous en avez presque toujours besoin. Sans lui, RECHERCHEV peut renvoyer la valeur « la plus proche » et se tromper sans bruit.

Les limites de RECHERCHEV : elle ne cherche que dans la première colonne et seulement vers la droite, et le numéro de colonne devient faux si l’on insère une nouvelle colonne.

**RECHERCHEX** (XLOOKUP), dans les versions récentes d’Excel et dans Google Sheets, est plus pratique : `=RECHERCHEX(A2;Prix!A:A;Prix!C:C)`, on indique séparément où chercher et quoi renvoyer ; la correspondance exacte est la valeur par défaut. L’alternative classique est le duo **INDEX + EQUIV**.

## La clé doit être unique
Si le même code apparaît deux fois dans le tableau de référence, la fonction renvoie la première correspondance, et vous ne remarquerez pas l’erreur. Vérifiez que les clés sont uniques.

!key Les fonctions de recherche ramènent des valeurs d’un autre tableau grâce à une clé.
!key Dans RECHERCHEV, utilisez FAUX (correspondance exacte).
!key RECHERCHEX est plus pratique : « où chercher » et « quoi renvoyer » sont séparés.
!key La clé du tableau de référence doit être unique.

?q:e À quoi sert RECHERCHEV ?
- À additionner une colonne
+ À trouver une valeur grâce à une clé dans un autre tableau
- À construire un graphique
- À supprimer les doublons
= RECHERCHEV ramène des données d’un tableau de référence.

?q:m Que signifie FAUX comme dernier argument de RECHERCHEV ?
- Que la formule est désactivée
+ Qu’une correspondance exacte de la clé est exigée
- Que le résultat sera du texte
- Que la recherche va du bas vers le haut
= Sans correspondance exacte, RECHERCHEV peut renvoyer une valeur fausse.

?q:m En quoi RECHERCHEX est-elle plus pratique que RECHERCHEV ?
+ On indique séparément où chercher et quoi renvoyer, et elle peut chercher vers la gauche
- Elle ne fonctionne qu’avec du texte
- Elle est plus rapide à taper
- Elle n’a pas besoin de clé
= Pas de numéro de colonne, donc insérer des colonnes ne casse rien.

?q:h RECHERCHEV renvoie des prix, mais certains sont faux. Dans le tableau de référence, certains codes ont deux lignes avec des prix différents. Que se passe-t-il ?
- La fonction prend le prix moyen
+ La fonction prend la première correspondance trouvée, donc la clé doit être unique
- La fonction renvoie une erreur pour ces codes
- La fonction prend la dernière correspondance
= Des clés non uniques provoquent des erreurs silencieuses.

?r:m Quel duo de fonctions est l’alternative classique à RECHERCHEV ?
- SOMME + NB
+ INDEX + EQUIV
- SI + ET
- MIN + MAX
= EQUIV trouve la ligne, INDEX renvoie la valeur.

?r:e Comment doit être une clé dans un tableau de référence ?
+ Unique
- Longue
- Toujours un nombre
- Écrite en majuscules
= Sinon la recherche renvoie la première de plusieurs correspondances.

!open Vous avez un tableau de commandes avec un code employé et un tableau de référence séparé « code — nom — service ». Décrivez comment vous ajouteriez le service de chaque employé aux commandes et ce que vous vérifieriez.
!rubric Une fonction de recherche est nommée
!rubric Une correspondance exacte est indiquée
!rubric La vérification de l’unicité des clés ou des erreurs est mentionnée
!model Dans le tableau des commandes, j’ajoute une colonne « Service » avec =RECHERCHEX(B2;Personnel!A:A;Personnel!C:C), où B est le code employé. Avant cela, je vérifie que les codes ne se répètent pas dans le tableau de référence, et ensuite je cherche les erreurs #N/A : ce sont des codes absents du tableau de référence.

# data-06 | Analyse | Tri, filtres et tableaux croisés dynamiques
## Tri et filtres
Le **tri** ordonne les lignes : par chiffre d’affaires décroissant, par date. Sélectionnez tout le tableau, sinon vous risquez de trier une seule colonne et de mélanger les données entre les lignes.

Un **filtre** masque temporairement les lignes qui ne remplissent pas une condition, par exemple pour n’afficher qu’une région. Les données ne sont pas supprimées.

## Tableaux croisés dynamiques
Un **tableau croisé dynamique** transforme des milliers de lignes en un court rapport en une minute. On fait glisser des champs dans quatre zones :
- **Lignes** : selon quoi regrouper (par exemple le commercial) ;
- **Colonnes** : une deuxième dimension (par exemple le mois) ;
- **Valeurs** : ce qu’on calcule, somme, nombre, moyenne ;
- **Filtres** : pour restreindre le rapport (par exemple 2025 uniquement).

Un tableau croisé dynamique ne fonctionne que sur des données bien rangées : en-têtes en première ligne, pas de cellules fusionnées ni de lignes vides au milieu. Quand les données sources changent, il faut **actualiser** le tableau croisé dynamique.

!key Triez tout le tableau, pas une seule colonne.
!key Un filtre masque les lignes mais ne les supprime pas.
!key Un tableau croisé dynamique a des lignes, des colonnes, des valeurs et des filtres.
!key Quand les données sources changent, actualisez le tableau croisé dynamique.

?q:e Que fait un filtre ?
- Il supprime définitivement les lignes en trop
+ Il masque temporairement les lignes qui ne remplissent pas une condition
- Il trie par ordre alphabétique
- Il fusionne des cellules
= Les lignes masquées restent dans le tableau.

?q:m Pourquoi est-il dangereux de trier une seule colonne sélectionnée ?
+ Ses valeurs se mélangent par rapport aux autres colonnes et les enregistrements sont « déchirés »
- Le tri ne fonctionnera pas
- Le tableau devient plus petit
- Ce n’est dangereux que pour les dates
= Une ligne doit rester un enregistrement complet.

?q:m Vous voulez voir le chiffre d’affaires par commercial et par mois. Que mettez-vous dans les « Valeurs » du tableau croisé dynamique ?
- Commercial
- Mois
+ Somme du chiffre d’affaires
- Région
= Les valeurs sont ce qui est calculé.

?q:h Vous avez ajouté de nouvelles ventes au tableau source, mais le tableau croisé dynamique affiche les anciens totaux. Qu’est-ce qui ne va pas ?
- Les tableaux croisés dynamiques ne gèrent pas les nouvelles données
+ Il faut actualiser le tableau croisé dynamique, et sa plage doit inclure les nouvelles lignes
- Il faut supprimer le tableau croisé et faire le rapport à la main
- Les nouvelles ventes ont été mal saisies
= Un tableau croisé dynamique ne se recalcule pas tout seul comme les formules.

?r:m Quelles sont les quatre zones d’un tableau croisé dynamique ?
+ Lignes, colonnes, valeurs, filtres
- Titre, texte, légende, total
- Cellules, feuilles, classeurs, fichiers
- Somme, moyenne, minimum, maximum
= Les champs se répartissent dans ces zones.

?r:e De quelles données un tableau croisé dynamique a-t-il besoin ?
- De n’importe lesquelles, même avec des cellules fusionnées
+ De données bien rangées : en-têtes en première ligne, pas de cellules fusionnées
- De texte uniquement
- D’une seule colonne
= Des données bien rangées sont la base de toute analyse.

!open Décrivez un rapport que vous pourriez construire avec un tableau croisé dynamique à partir de vos propres données : ce qui va dans les lignes, les colonnes, les valeurs et le filtre, et à quelle question il répond.
!rubric Toutes les zones sont indiquées
!rubric La question à laquelle répond le rapport est nommée
!rubric Les données sont réalistes
!model Les données sont mes dépenses de l’année. Lignes : catégorie ; colonnes : mois ; valeurs : somme des dépenses ; filtre : carte uniquement. Le rapport répond à la question : quels mois et quelles catégories me coûtent le plus.

# data-07 | Analyse | Moyenne, médiane et pourcentages
## Moyenne et médiane
La **moyenne** est la somme divisée par le nombre de valeurs. La **médiane** est la valeur du milieu quand tout est trié. Quand les données contiennent des **valeurs aberrantes** (très grandes ou très petites), la moyenne bouge beaucoup, la médiane non.

Exemple : cinq employés gagnent 50, 55, 60, 65 et 500 mille. La moyenne est de 146 mille, alors que quatre d’entre eux gagnent 65 ou moins. La médiane est de 60 mille et décrit mieux un employé typique. Dans un tableur : **MEDIANE**.

## Pourcentages et points de pourcentage
- Passer de 200 à 250 est une hausse de **+25 %** : (250 − 200) / 200.
- Si le taux de conversion passe de 2 % à 3 %, c’est une hausse de **1 point de pourcentage**, mais de **50 %** en relatif. Confondre les deux est une erreur fréquente dans les rapports.
- Un pourcentage calculé sur une petite base est trompeur : « +100 % » peut vouloir dire 2 commandes au lieu d’une.

!key La médiane résiste mieux que la moyenne aux valeurs aberrantes.
!key Variation en pourcentage = (nouveau − ancien) / ancien.
!key Les points de pourcentage sont une différence de pourcentages ; ne les confondez pas avec des pourcentages.
!key Regardez la base : un gros pourcentage d’un petit nombre ne dit pas grand-chose.

?q:e Qu’est-ce que la médiane ?
- La somme de toutes les valeurs
+ La valeur du milieu d’une liste triée
- La valeur la plus fréquente
- L’écart entre le maximum et le minimum
= La moitié des valeurs est sous la médiane, l’autre moitié au-dessus.

?q:m Salaires : 40, 45, 50, 55 et 400 mille. Quelle mesure décrit le mieux un salaire typique ?
- La moyenne : 118 mille
+ La médiane : 50 mille
- Le maximum : 400 mille
- La somme : 590 mille
= La valeur aberrante de 400 mille tire fortement la moyenne vers le haut.

?q:m Le chiffre d’affaires est passé de 160 à 200 mille. De combien de pour cent ?
- 20 %
+ 25 %
- 40 %
- 80 %
= (200 − 160) / 160 = 0,25.

?q:h Le taux de retours est passé de 8 % à 6 %. Comment décrire correctement la variation ?
- Une baisse de 2 % en relatif
+ Une baisse de 2 points de pourcentage, soit de 25 % par rapport au niveau précédent
- Une baisse de 6 %
- Une baisse de 33 points de pourcentage
= 8 − 6 = 2 points ; 2 / 8 = 25 %.

?r:m Pourquoi la moyenne peut-elle être trompeuse ?
+ Les valeurs aberrantes la déplacent fortement
- Elle est toujours inférieure à la médiane
- Elle ne se calcule pas dans un tableur
- Elle ne fonctionne que pour les dates
= Dans ces cas, regardez la médiane.

?r:e Comment calcule-t-on une variation en pourcentage ?
- Nouveau moins ancien
+ (Nouveau − ancien) / ancien
- Nouveau / 100
- Ancien / nouveau
= On divise la variation par la valeur de départ.

!open Trouvez une phrase avec des pourcentages dans l’actualité ou un rapport professionnel et vérifiez-la : pourcentages et points de pourcentage sont-ils bien employés, et la base n’est-elle pas trop petite ?
!rubric Une phrase ou un exemple est donné
!rubric Pourcentages ou points sont vérifiés
!rubric La base est évaluée
!model Un rapport dit : « la part des ventes en ligne a augmenté de 5 % » ; elle était de 20 %, elle est de 25 %. Correctement, c’est 5 points de pourcentage, soit 25 % par rapport à la part précédente. La base est correcte, des milliers de commandes par mois, donc la variation a du sens.

# data-08 | Analyse | Des graphiques qui ne mentent pas
## Choisir un graphique
- **Courbe** : évolution dans le temps, chiffre d’affaires par mois.
- **Barres / histogramme** : comparaison de catégories, ventes par région. Les libellés longs tiennent mieux sur des barres horizontales.
- **Secteurs (camembert)** : les parties d’un tout, et seulement s’il y a peu de parties (4 ou 5 au plus). Les angles sont difficiles à comparer, donc les barres sont souvent préférables.
- **Nuage de points** : la relation entre deux mesures numériques, le prix et le nombre de ventes.

## Honnêteté
- Les barres doivent partir **de zéro** : un axe tronqué transforme une hausse de 3 % en « envolée ».
- Ne comparez pas des périodes de longueur différente sans le dire.
- Indiquez les axes et les unités, la source et la période.
- Un graphique, un message. Mettez l’essentiel en couleur, le reste en gris.

## Bilan du cours
Tableau bien rangé → données propres → formules et recherches → tableau croisé dynamique → pourcentages corrects → graphique honnête. C’est le cycle de base du travail avec les données, dans n’importe quel métier.

!key Courbe pour le temps, barres pour comparer, secteurs pour les parts de quelques éléments.
!key Les barres partent de zéro, sinon le graphique exagère l’écart.
!key Indiquez les axes, les unités, la source et la période.
!key Un graphique, un message, avec l’essentiel en couleur.

?q:e Quel graphique montre le mieux le chiffre d’affaires par mois sur un an ?
- Un graphique en secteurs
+ Une courbe
- Un tableau avec un seul nombre
- Un nuage de points sans légende
= Une courbe montre bien l’évolution dans le temps.

?q:m Quand un graphique en secteurs est-il approprié ?
- Pour comparer 15 régions
+ Pour les parties d’un tout, quand il y en a peu
- Pour des tendances quotidiennes
- Pour la relation entre deux mesures
= Beaucoup de parts sont difficiles à comparer.

?q:m Quel est le danger d’un graphique en barres dont l’axe ne part pas de zéro ?
+ Un petit écart paraît énorme
- Le graphique devient trop large
- Les libellés disparaissent
- Aucun, c’est la norme
= La hauteur d’une barre doit être proportionnelle à sa valeur.

?q:h Vous voulez vérifier si un produit se vend moins bien quand son prix est plus élevé. Quel graphique choisissez-vous ?
- Un graphique en secteurs des parts de prix
+ Un nuage de points prix / nombre de ventes
- Une courbe du prix seul
- Des barres des noms de produits par ordre alphabétique
= Un nuage de points montre la relation entre deux mesures numériques.

?r:m Que faut-il toujours indiquer sur un graphique ?
+ Les axes, les unités, la source et la période
- Seulement le titre
- Rien, tout est évident
- Seulement la couleur de fond
= Sans cela, un graphique est facile à mal lire.

?r:e Quelle règle aide à rendre un graphique clair ?
- Le plus de couleurs possible
+ Un graphique, un message
- Toujours ajouter un effet 3D
- Tous les libellés en petits caractères
= Mettez l’essentiel en avant et estompez le reste.

!open Décrivez un graphique que vous construiriez pour votre responsable à partir de vos données : quel type, ce qu’il y a sur les axes, ce que vous mettriez en avant et le message unique qu’il doit faire passer.
!rubric Le type de graphique convient à la tâche
!rubric Les axes et la mise en avant sont décrits
!rubric Un message unique est formulé
!model Je montrerai une courbe du chiffre d’affaires par mois sur l’année : les mois sur l’axe horizontal, le chiffre d’affaires en milliers à partir de zéro sur l’axe vertical. La courbe de cette année en couleur, celle de l’an dernier en gris. Le message : depuis le lancement de la livraison en mai, le chiffre d’affaires est durablement supérieur à celui de l’an dernier.
