# Étape 08 : dialoguer avec le serveur

**Objectif** : ne plus écrire les données dans le code, mais les demander au serveur Java et lui envoyer chaque modification. Les listes sont désormais enregistrées dans une base de données : elles survivent à un rechargement de la page.

Seul le service `TodoStore` change vraiment : les composants restent identiques à ceux de l'étape 07.

## Lancer cette étape

Il faut **deux terminaux**, un pour le serveur Java et un pour Angular.

**Terminal 1**, le serveur (voir le [README général](../README.md) pour son installation) :

```sh
cd serveur
./mvnw compile exec:java        # macOS, Linux, Git Bash
.\mvnw.cmd compile exec:java    # Windows (PowerShell ou invite de commandes)
```

Attendez le message `Serveur TodoList : http://localhost:8080/api/lists`.

**Terminal 2**, l'application :

```sh
cd 08-dialoguer-avec-le-serveur
npm install      # une seule fois
npm start
```

Puis ouvrez <http://localhost:4200>. Les listes affichées sont celles de la base de données. Au premier lancement, le serveur y crée trois listes d'exemple.

## Ce qui a changé depuis l'étape 07

| Fichier                 | Changement                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `proxy.conf.json`       | **Nouveau** : transmet les requêtes `/api/…` au serveur Java.                         |
| `angular.json`          | `"proxyConfig": "proxy.conf.json"` dans les options de `serve`.                       |
| `src/app/app.config.ts` | `provideHttpClient()` active le client HTTP d'Angular.                                |
| `src/app/todo-store.ts` | Plus de données en dur ni de `nextId` : chaque méthode envoie une requête au serveur. |

## Les notions de l'étape

### Qui parle à qui ?

```text
┌──────────────┐  GET /api/lists   ┌──────────────────┐  GET /api/lists   ┌──────────────┐        ┌───────────┐
│  Navigateur  │ ────────────────▶ │  npm start       │ ────────────────▶ │ Serveur Java │ ─────▶ │  SQLite   │
│  (Angular)   │ ◀──────────────── │  localhost:4200  │ ◀──────────────── │  port 8080   │ ◀───── │  todo.db  │
└──────────────┘    JSON           │  (proxy /api)    │    JSON           └──────────────┘        └───────────┘
                                   └──────────────────┘
```

1. Le navigateur charge l'application depuis le serveur de développement d'Angular (`npm start`, port 4200).
2. L'application envoie ses requêtes à `/api/…`, sur ce **même** serveur.
3. Grâce au proxy, celui-ci les transmet au serveur Java (port 8080), qui lit ou modifie la base SQLite et répond en JSON.

### Pourquoi un proxy ?

Pour des raisons de sécurité, un navigateur n'autorise une page à appeler un **autre** serveur que celui qui l'a fournie que si cet autre serveur l'accepte explicitement (c'est la règle CORS). Le proxy contourne la question : le navigateur croit parler au serveur d'Angular, qui fait l'intermédiaire.

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
```

Ce fichier se lit : « toute requête dont l'adresse commence par `/api` est transmise à `http://localhost:8080` ». Il n'est lu qu'au démarrage de `npm start` : après une modification, relancez-le. Si vous changez le port du serveur (réglage `PORT` de `serveur/.env`), changez aussi `target`.

### Ce que le serveur sait faire

Les étapes 08 et 09 utilisent les routes « de test » du serveur : elles ne demandent pas de compte, et les listes y sont communes à tous ceux qui s'y connectent. Les comptes n'arriveront qu'à l'étape 11.

| Requête                   | Corps envoyé          | Réponse du serveur                           |
| ------------------------- | --------------------- | -------------------------------------------- |
| `GET /api/lists`          |                       | `200` + toutes les listes, avec leurs tâches |
| `POST /api/lists`         | `{"name": "Courses"}` | `201` + la liste créée, avec son numéro      |
| `DELETE /api/lists/3`     |                       | `204` (réponse vide)                         |
| `POST /api/lists/3/tasks` | `{"title": "Pain"}`   | `201` + la tâche créée, avec son numéro      |
| `PATCH /api/tasks/5`      | `{"done": true}`      | `200` + la tâche modifiée                    |
| `DELETE /api/tasks/5`     |                       | `204` (réponse vide)                         |

La méthode (`GET`, `POST`, `PATCH`, `DELETE`) dit ce qu'on veut faire, l'adresse dit sur quoi. Le code de réponse dit comment ça s'est passé : `2xx` pour une réussite, `4xx` pour une requête incorrecte (`404` : introuvable), `5xx` pour une panne du serveur. Le détail de l'API est dans [serveur/README.md](../serveur/README.md).

Le JSON renvoyé a exactement la forme des interfaces `TodoList` et `Task` de l'étape 02 : il n'y a rien à convertir.

### Envoyer une requête : `HttpClient`

```ts
private readonly http = inject(HttpClient);

load(): void {
  this.http.get<TodoList[]>('/api/lists').subscribe((lists) => {
    this.writableLists.set(lists);
  });
}
```

- `HttpClient` est un service d'Angular, activé par `provideHttpClient()` dans `app.config.ts` et obtenu avec `inject`, comme notre `TodoStore`.
- `get`, `post`, `patch`, `delete` : la méthode HTTP. Pour `post` et `patch`, le deuxième paramètre est le corps de la requête, un objet que `HttpClient` convertit en JSON.
- `<TodoList[]>` annonce ce que la réponse contiendra.
- `subscribe(…)` reçoit la fonction à exécuter **quand la réponse arrivera**. Sans `subscribe`, la requête ne part pas du tout.

### Une réponse, ça prend du temps

```text
clic sur une case ──▶ toggleTask() envoie PATCH ──▶ … le code continue, l'écran ne bouge pas …
                                                            │
                                         la réponse arrive ◀┘ ──▶ la fonction de subscribe
                                                                  met à jour le signal ──▶ la tâche se barre
```

Le code n'attend pas la réponse : c'est ce qu'on appelle un traitement **asynchrone**. Le signal n'est modifié qu'une fois que le serveur a confirmé, et **avec ce que le serveur a renvoyé**. L'affichage reflète donc toujours ce qui est réellement enregistré. Sur son propre poste la réponse est quasi immédiate, mais l'exercice 4 ci-dessous permet de la ralentir pour bien voir ce décalage.

### Les numéros viennent du serveur

Le compteur `nextId` a disparu : c'est la base de données qui attribue un numéro unique à chaque liste et à chaque tâche, et le serveur le renvoie dans sa réponse.

### Observer le dialogue

- Dans le navigateur, ouvrez les outils de développement (**F12**), onglet **Réseau** (_Network_), filtre **Fetch/XHR** : chaque action y apparaît, avec sa requête et sa réponse.
- Dans le terminal du serveur, chaque requête s'affiche avec son code de réponse :

```text
14:34:29  GET    /api/lists               -> 200
14:34:34  POST   /api/lists               -> 201
14:34:35  POST   /api/lists/4/tasks       -> 201
14:34:37  PATCH  /api/tasks/8             -> 200
14:34:38  DELETE /api/tasks/9             -> 204
```

## À essayer

1. Créez une liste, cochez des tâches, puis rechargez la page (F5) : tout est conservé.
2. Ouvrez l'application dans deux onglets. Modifiez une liste dans le premier : le second ne change qu'une fois rechargé. Il ne reçoit rien tant qu'il ne demande pas.
3. Pendant que l'application tourne, créez une liste depuis un troisième terminal, puis rechargez la page :

   ```sh
   curl -X POST localhost:8080/api/lists -H "Content-Type: application/json" -d '{"name": "Depuis curl"}'
   ```

   ```powershell
   Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/lists -ContentType 'application/json' -Body '{"name": "Depuis PowerShell"}'
   ```

4. Ralentissez le serveur : créez le fichier `serveur/.env` contenant la ligne `DELAY_MS=1500`, puis relancez le serveur. Cochez une tâche : la case se coche aussitôt, mais le texte ne se barre qu'à l'arrivée de la réponse. Supprimez ensuite la ligne (ou le fichier) et relancez le serveur.
5. Arrêtez le serveur (`Ctrl+C` dans son terminal) et rechargez la page : l'application affiche « Aucune liste », sans aucune explication. Les erreurs n'apparaissent que dans la console (F12). C'est le sujet de l'étape suivante.

## Étape suivante

[Étape 09 : gérer le chargement et les erreurs](../09-gerer-le-chargement-et-les-erreurs/README.md)
