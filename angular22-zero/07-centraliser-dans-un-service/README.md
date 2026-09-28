# Étape 07 : centraliser dans un service

**Objectif** : déplacer les données et toutes leurs modifications du composant `App` vers un **service**, `TodoStore`. Les composants ne s'occupent plus que de l'affichage.

À l'écran, **rien ne change** par rapport à l'étape 06. Mais l'étape suivante, qui branche le serveur, ne touchera presque qu'à ce service : c'est tout le but de la manœuvre.

## Lancer cette étape

```sh
cd 07-centraliser-dans-un-service
npm install      # une seule fois
npm start
```

Puis ouvrez <http://localhost:4200>.

## Ce qui a changé depuis l'étape 06

| Fichier                 | Changement                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `src/app/todo-store.ts` | **Nouveau** : le service `TodoStore`, avec les listes et les méthodes déplacées depuis `App`.      |
| `src/app/app.ts`        | Récupère le service avec `inject(TodoStore)` ; ne garde que le champ de saisie et la confirmation. |
| `src/app/app.html`      | Lit `store.lists()` et transmet les actions des cartes à `store`.                                  |

Le fichier du service a d'abord été créé par la CLI, puis rempli à la main :

```sh
npx ng generate service todo-store
```

## Les notions de l'étape

### Qu'est-ce qu'un service ?

Un **service** est une classe qui n'affiche rien. Elle rend un service aux composants : garder des données, parler à un serveur, faire un calcul… Angular n'en crée **qu'un seul exemplaire**, que tous les composants se partagent.

```text
                 ┌───────────────────────────────────────────┐
                 │ TodoStore (service, un seul exemplaire)   │
                 │   lists : les données                     │
                 │   createList, addTask, toggleTask…        │
                 └───────────────────────────────────────────┘
                     ▲ inject(TodoStore)
                     │
   ┌─────────────────┴──────────────┐
   │ App                            │ affiche le formulaire et les cartes,
   │   store.lists()                │ transmet les actions au service
   │   store.addTask(list, $event)  │
   └────────────────────────────────┘
        [list] ▼      ▲ (addTask), (toggleTask)…
   ┌────────────────────────────────┐
   │ ListCard                       │ affiche une liste, signale les actions
   └────────────────────────────────┘
```

### Déclarer un service : `@Injectable`

```ts
@Injectable({ providedIn: 'root' })
export class TodoStore { … }
```

`providedIn: 'root'` rend le service disponible dans toute l'application, sans rien avoir à déclarer ailleurs.

### Obtenir le service : `inject`

```ts
protected readonly store = inject(TodoStore);
```

Le composant ne crée pas le service lui-même (pas de `new TodoStore()`) : il le **demande** à Angular, qui lui donne l'exemplaire partagé. On appelle ce mécanisme l'**injection de dépendances**.

### Protéger les données : `asReadonly`

```ts
private readonly writableLists = signal<TodoList[]>([…]);
readonly lists = this.writableLists.asReadonly();
```

Le signal modifiable est `private` : seul le service peut s'en servir. Les composants reçoivent une version en **lecture seule**, sans `set` ni `update`. Pour changer les données, ils doivent passer par les méthodes du service. Si une donnée change de façon inattendue, il n'y a donc qu'un seul fichier où chercher.

### Qui garde quoi ?

| Reste dans le composant                            | Part dans le service                         |
| -------------------------------------------------- | -------------------------------------------- |
| Le texte en cours de saisie (`newListName`)        | Les listes et leurs tâches                   |
| La question « Supprimer la liste ? » (`confirm`)   | La création, la modification, la suppression |
| Les calculs d'affichage (`completed`, `doneCount`) | L'attribution des numéros (`nextId`)         |

Bon critère pour trancher : si l'on remplaçait la page par une application mobile, le service resterait valable tel quel, alors que les composants seraient à refaire.

## À essayer

1. Dans `app.html`, remplacez `store.lists()` par `store.writableLists()` : la compilation échoue, car `writableLists` est `private`.
2. Dans `app.ts`, essayez `this.store.lists.set([])` : il n'existe pas de `set` sur un signal en lecture seule.
3. Ajoutez dans `TodoStore` une méthode `deleteAllLists()` qui vide le tableau, et un bouton dans `app.html` qui l'appelle.

## Étape suivante

[Étape 08 : dialoguer avec le serveur](../08-dialoguer-avec-le-serveur/README.md)
