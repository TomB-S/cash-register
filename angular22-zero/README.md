# TodoList : une application Angular, pas à pas

Ce dépôt montre la réalisation d'un petit projet complet, **étape par étape**, pour découvrir Angular en partant de zéro : une application de listes de tâches (TodoList) qui dialogue avec un petit serveur Java et sa base de données SQLite.

Ce que sait faire l'application finale :

- créer plusieurs listes, chacune avec un nom ;
- ajouter des tâches à une liste ;
- cocher une tâche réalisée : elle s'affiche cochée et barrée ;
- quand toutes les tâches d'une liste sont réalisées, barrer aussi le nom de la liste, jusqu'à ce qu'on y ajoute une nouvelle tâche ;
- supprimer une tâche ou une liste ;
- synchroniser les listes avec le serveur, et prévenir si celui-ci ne répond pas ;
- créer un compte, s'y connecter, s'en déconnecter, le supprimer. Connecté, les listes sont enregistrées dans le compte. Sans compte, on reçoit les listes de départ et le serveur ne conserve rien.

Le tout est vérifié par des tests automatiques.

![L'application à l'étape 11](11-ajouter-l-authentification/capture-connecte.png)

## Les étapes

Chaque dossier numéroté contient **l'état complet du projet** à la fin de l'étape : on peut lancer n'importe laquelle, indépendamment des autres. Son `README.md` explique ce qui a changé depuis l'étape précédente, les notions nouvelles, et propose des exercices.

| Étape                                                                                    | Ce qu'on y fait                          | Notions abordées                                               | Serveur                 |
| ---------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------- | ----------------------- |
| [01-creer-le-projet](01-creer-le-projet/README.md)                                       | Générer le projet et le lancer           | Angular CLI, composant, interpolation `{{ }}`                  | non                     |
| [02-afficher-les-listes](02-afficher-les-listes/README.md)                               | Afficher des listes écrites dans le code | interface, `signal`, `@for`, liaison `[propriété]`             | non                     |
| [03-reagir-aux-clics](03-reagir-aux-clics/README.md)                                     | Cocher une tâche, supprimer              | événement `(click)`, `update`, copies plutôt que modifications | non                     |
| [04-decouper-en-composants](04-decouper-en-composants/README.md)                         | Extraire une carte `ListCard`            | `input`, `output`, `imports`                                   | non                     |
| [05-ajouter-avec-un-formulaire](05-ajouter-avec-un-formulaire/README.md)                 | Créer une liste, ajouter une tâche       | `FormsModule`, `[(ngModel)]`, `(ngSubmit)`                     | non                     |
| [06-barrer-les-listes-terminees](06-barrer-les-listes-terminees/README.md)               | Barrer le nom d'une liste terminée       | `computed`, `@if`                                              | non                     |
| [07-centraliser-dans-un-service](07-centraliser-dans-un-service/README.md)               | Déplacer les données dans un service     | `@Injectable`, `inject`, `asReadonly`                          | non                     |
| [08-dialoguer-avec-le-serveur](08-dialoguer-avec-le-serveur/README.md)                   | Une requête au serveur par action        | `HttpClient`, proxy, asynchrone                                | routes de test          |
| [09-gerer-le-chargement-et-les-erreurs](09-gerer-le-chargement-et-les-erreurs/README.md) | Afficher le chargement et les erreurs    | `next` / `error`, états d'affichage                            | routes de test          |
| [10-synchroniser-avec-le-serveur](10-synchroniser-avec-le-serveur/README.md)             | Envoyer toutes les listes d'un coup      | synchronisation, un envoi à la fois                            | routes de test          |
| [11-ajouter-l-authentification](11-ajouter-l-authentification/README.md)                 | Comptes, connexion, listes enregistrées  | jeton, intercepteur, `Observable`, `localStorage`              | comptes                 |
| [12-ecrire-des-tests](12-ecrire-des-tests/README.md)                                     | Vérifier l'application automatiquement   | Vitest, `TestBed`, faux serveur `HttpTestingController`        | comptes (tests : aucun) |

Pour voir exactement ce qui change d'une étape à l'autre, comparez deux dossiers, par exemple dans VS Code : clic droit sur un fichier, **Sélectionner pour comparer**, puis clic droit sur son homologue de l'étape suivante, **Comparer avec la sélection**.

Le serveur Java, dans [serveur/](serveur/), n'est pas l'objet du pas-à-pas : il est livré terminé, pour les étapes 08 à 12. Son code est commenté pour qui veut le lire. Il offre :

- des **routes de test**, sans compte, utilisées par les étapes 08, 09 et 10 ;
- des **comptes** et une **synchronisation authentifiée**, utilisés par les étapes 11 et 12.

## Organisation du dépôt

```text
.
├── README.md                     ce fichier
├── 01-creer-le-projet/           une application Angular complète par étape…
│   ├── README.md                 … avec l'explication de l'étape
│   ├── package.json
│   └── src/
├── 02-afficher-les-listes/
├── …
├── 12-ecrire-des-tests/          la dernière étape, avec ses tests (fichiers *.spec.ts)
└── serveur/                      le serveur Java et sa base SQLite
    ├── README.md                 son API et ses réglages
    ├── .env.example              modèle du fichier de réglages .env
    ├── mvnw, mvnw.cmd            lanceurs de Maven (Maven Wrapper)
    ├── pom.xml
    └── src/
```

## Mise en place

### Prérequis

| Outil                                                             | Pour                                     | Version                                                          | Vérifier avec   |
| ----------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- | --------------- |
| [Node.js](https://nodejs.org/) (fournit `npm`)                    | l'application Angular, toutes les étapes | 22.22 ou plus récente (Angular 22 accepte 22.22+, 24.15+ et 26+) | `node -v`       |
| Un JDK, par exemple [Eclipse Temurin](https://adoptium.net/)      | le serveur, étapes 08 à 12               | 21 ou plus récent                                                | `java -version` |
| Un éditeur, par exemple [VS Code](https://code.visualstudio.com/) | écrire le code                           |                                                                  |                 |

Inutile d'installer l'Angular CLI ou Maven : chaque étape embarque sa CLI dans ses dépendances, et le serveur télécharge Maven tout seul au premier lancement. Une connexion Internet est nécessaire la première fois.

Sous Windows, `java` doit être dans le `PATH`, ou la variable `JAVA_HOME` doit pointer vers le JDK ; l'installeur Temurin propose de s'en charger.

À l'ouverture du dossier, VS Code propose d'installer les extensions conseillées (voir [.vscode/extensions.json](.vscode/extensions.json)), dont **Angular Language Service**, qui aide à écrire les gabarits.

### Récupérer le projet

```sh
git clone <adresse-du-dépôt> todolist-angular
cd todolist-angular
```

### Installer une étape

Chaque étape est un projet indépendant, avec ses propres dépendances. Avant de lancer une étape pour la première fois :

```sh
cd 01-creer-le-projet
npm install
```

`npm install` télécharge les dépendances dans le dossier `node_modules/` de l'étape. Il faut le refaire pour chaque étape (quelques centaines de Mo à chaque fois) ; les suivantes vont plus vite grâce au cache de npm. Les étapes 01 à 11 ont exactement les mêmes dépendances ; l'étape 12 y ajoute les outils de test.

## Lancer le serveur

Le serveur est nécessaire aux étapes 08 à 12. Dans un terminal, depuis la racine du dépôt :

```sh
cd serveur
./mvnw compile exec:java        # macOS, Linux, Git Bash
```

```powershell
cd serveur
.\mvnw.cmd compile exec:java    # Windows (PowerShell ou invite de commandes)
```

Le premier lancement prend une ou deux minutes : Maven et les bibliothèques se téléchargent. Le serveur est prêt quand il affiche :

```text
Serveur TodoList : http://localhost:8080/api/lists
Base de données  : …/serveur/todo.db
Ctrl+C pour arrêter. Requêtes reçues :
```

Laissez ce terminal ouvert : chaque requête reçue s'y affiche, avec son code de réponse. `Ctrl+C` arrête le serveur.

Pour vérifier qu'il répond, ouvrez <http://localhost:8080/api/lists> dans le navigateur : la liste des listes s'affiche en JSON.

**La base de données** est le fichier `serveur/todo.db`, créé au premier lancement. Elle contient les listes des routes de test (trois listes d'exemple au départ) et les comptes avec leurs listes. Pour repartir de zéro, arrêtez le serveur, supprimez ce fichier et relancez.

Si `./mvnw` répond `Permission denied` (macOS, Linux), rendez-le exécutable avec `chmod +x mvnw`, ou lancez `sh mvnw compile exec:java`.

### Les réglages : le fichier `.env`

Les réglages du serveur ont des valeurs par défaut que l'on peut **surcharger** dans un fichier `serveur/.env`. Pour le créer, copiez le modèle fourni :

```sh
cd serveur
cp .env.example .env            # macOS, Linux, Git Bash
Copy-Item .env.example .env     # Windows PowerShell
```

Modifiez ensuite les lignes voulues, au format `NOM=valeur`, puis relancez le serveur : le fichier n'est lu qu'au démarrage.

| Réglage     | Rôle                                                                                      | Par défaut |
| ----------- | ----------------------------------------------------------------------------------------- | ---------- |
| `PORT`      | Port d'écoute du serveur                                                                  | `8080`     |
| `DB_PATH`   | Fichier de la base SQLite (relatif au dossier `serveur`)                                  | `todo.db`  |
| `DEMO_DATA` | `true` : listes d'exemple dans une base neuve et comme valeurs de départ ; `false` : rien | `true`     |
| `DELAY_MS`  | Pause avant chaque réponse, en millisecondes, pour simuler un réseau lent                 | `0`        |

Une variable d'environnement du même nom l'emporte sur le fichier `.env`, pratique pour un essai ponctuel : `PORT=9090 ./mvnw compile exec:java`. Le fichier `.env` est ignoré par Git : chacun garde ses réglages.

Si vous changez `PORT`, changez aussi `target` dans le `proxy.conf.json` de l'étape lancée (08 à 12), puis relancez `npm start`.

L'API complète, les tests et l'organisation du code du serveur sont décrits dans [serveur/README.md](serveur/README.md).

## Lancer une étape de l'application

Dans un terminal, depuis le dossier de l'étape :

```sh
npm start
```

`npm start` lance `ng serve`, le serveur de développement d'Angular. Une fois le message `Local: http://localhost:4200/` affiché, ouvrez <http://localhost:4200>. La page se recharge toute seule à chaque modification d'un fichier source ; `Ctrl+C` arrête le serveur de développement.

Autres commandes utiles, depuis le dossier d'une étape :

| Commande                        | Effet                                                       |
| ------------------------------- | ----------------------------------------------------------- |
| `npm start -- --port 4300`      | Lance le serveur de développement sur un autre port.        |
| `npm run build`                 | Compile l'application pour la production, dans `dist/`.     |
| `npx ng generate component nom` | Crée un composant (`npx ng generate --help` pour le reste). |
| `npm test` (étape 12)           | Lance les tests de l'application.                           |

## Tout lancer ensemble (étapes 08 à 12)

1. **Terminal 1**, le serveur : `cd serveur` puis `./mvnw compile exec:java` (ou `.\mvnw.cmd compile exec:java` sous Windows).
2. **Terminal 2**, l'application : `cd 12-ecrire-des-tests` (ou toute autre étape à partir de la 08), `npm install` la première fois, puis `npm start`.
3. Ouvrez <http://localhost:4200>.

```text
navigateur ──▶ npm start (port 4200) ──/api──▶ serveur Java (port 8080) ──▶ serveur/todo.db
```

Pendant le développement, le serveur d'Angular transmet au serveur Java toutes les requêtes dont l'adresse commence par `/api` : c'est le rôle du fichier `proxy.conf.json` des étapes 08 à 12 (voir le [README de l'étape 08](08-dialoguer-avec-le-serveur/README.md)).

## Lancer les tests

```sh
cd 12-ecrire-des-tests
npm test                        # tests de l'application Angular (pas besoin du serveur)
```

```sh
cd serveur
./mvnw test                     # tests du serveur (ou .\mvnw.cmd test sous Windows)
```

Voir le [README de l'étape 12](12-ecrire-des-tests/README.md).

## En cas de problème

| Symptôme                                                                                  | Cause probable et solution                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'ng' n'est pas reconnu…` ou `ng: command not found`                                      | Si vous avez tapé `ng …` : la CLI n'est pas installée globalement, et ce n'est pas nécessaire ; utilisez `npm start`, ou préfixez par `npx` (`npx ng build`). Si c'est `npm start` qui échoue : lancez d'abord `npm install` dans **ce** dossier d'étape. |
| `Port 4200 is already in use`                                                             | Une autre étape tourne déjà : arrêtez-la (`Ctrl+C`), ou `npm start -- --port 4300`.                                                                                                                                                                       |
| « Le port 8080 est déjà utilisé » au lancement du serveur                                 | Le serveur tourne déjà dans un autre terminal ; sinon, changez `PORT` dans `serveur/.env` (et dans `proxy.conf.json`).                                                                                                                                    |
| Bandeau « Impossible de joindre le serveur » (étapes 09 à 12), ou aucune liste (étape 08) | Le serveur n'est pas lancé, ou pas sur le port indiqué dans `proxy.conf.json`.                                                                                                                                                                            |
| « Session inconnue ou expirée : reconnectez-vous. » (étapes 11 et 12)                     | La session a expiré (7 jours), le compte a été supprimé, ou la base `todo.db` a été effacée : reconnectez-vous, ou recréez le compte.                                                                                                                     |
| `java` : commande introuvable, ou `JAVA_HOME` incorrect                                   | Installez un JDK 21 ou plus récent et vérifiez `java -version` dans un **nouveau** terminal.                                                                                                                                                              |
| `./mvnw: Permission denied`                                                               | `chmod +x serveur/mvnw`, ou `sh mvnw compile exec:java`.                                                                                                                                                                                                  |
| `npm warn install-scripts …` pendant `npm install`                                        | Simple avertissement des versions récentes de npm, qui n'exécutent plus les scripts d'installation sans accord : le projet fonctionne sans eux.                                                                                                           |

## Conventions du dépôt

- **Un seul dépôt Git**, à la racine. Les dossiers d'étape n'en sont pas : ils ont été générés avec `--skip-git`.
- **Fins de ligne Unix (LF)** pour tous les fichiers, imposées par [.gitattributes](.gitattributes) et [.editorconfig](.editorconfig). Seule exception : `serveur/mvnw.cmd`, en CRLF, car l'interpréteur de commandes de Windows l'exige.
- **Fichiers non versionnés** (voir [.gitignore](.gitignore)) : dépendances (`node_modules/`), fichiers compilés (`dist/`, `.angular/`, `serveur/target/`), base de données (`*.db`) et réglages locaux (`.env`).
- Le code est en anglais (noms de variables, de classes…), les commentaires et les textes affichés en français.
