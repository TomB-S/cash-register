# Étape 04 : découper en composants

**Objectif** : sortir l'affichage d'une liste dans son propre composant, `ListCard`, et le faire dialoguer avec `App` par des entrées (`input`) et des sorties (`output`).

À l'écran, **rien ne change** par rapport à l'étape 03 : c'est une réorganisation du code. On la fait maintenant parce que les prochaines étapes vont ajouter un formulaire à chaque liste, puis une règle d'affichage propre à chaque liste. Avec tout dans `App`, le code deviendrait vite illisible.

## Lancer cette étape

```sh
cd 04-decouper-en-composants
npm install      # une seule fois
npm start
```

Puis ouvrez <http://localhost:4200>.

## Ce qui a changé depuis l'étape 03

| Fichier                            | Changement                                                               |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `src/app/list-card/list-card.ts`   | **Nouveau** : le composant `ListCard`, avec une entrée et trois sorties. |
| `src/app/list-card/list-card.html` | **Nouveau** : le gabarit d'une carte, déplacé depuis `app.html`.         |
| `src/app/list-card/list-card.css`  | **Nouveau** : les styles d'une carte, déplacés depuis `app.css`.         |
| `src/app/app.ts`                   | `imports: [ListCard]` ; les méthodes ne changent pas.                    |
| `src/app/app.html`                 | Une balise `<app-list-card>` par liste.                                  |
| `src/app/app.css`                  | Ne garde que la mise en page générale.                                   |

Le dossier `list-card/` a d'abord été créé par la CLI, puis rempli à la main :

```sh
npx ng generate component list-card
```

## Les notions de l'étape

### Qui fait quoi ?

```text
┌──────────────────────────────────────────────────────────┐
│ App                                                      │
│   garde les données (signal lists)                       │
│   et les méthodes qui les modifient                      │
│                                                          │
│       [list]="list"              (toggleTask)="…"        │
│   les données DESCENDENT ▼    ▲ les événements REMONTENT │
│                                                          │
│   ┌──────────────────────────────────────────────────┐   │
│   │ ListCard : affiche UNE liste, signale les clics  │   │
│   └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

`ListCard` ne sait pas d'où viennent les données ni ce qu'on en fait : il affiche et il signale. Toutes les modifications restent au même endroit, dans `App`.

### Une entrée : `input`

```ts
readonly list = input.required<TodoList>();
```

Le parent fournit la valeur dans son gabarit : `<app-list-card [list]="list" />`. On retrouve les crochets de l'étape 02, cette fois appliqués à notre propre composant. Une entrée est un signal : dans `ListCard`, on la lit avec `list()`. `required` oblige le parent à la fournir.

### Une sortie : `output`

```ts
readonly toggleTask = output<Task>();
```

Dans le gabarit de `ListCard`, `toggleTask.emit(task)` envoie la tâche au parent. Le parent écoute avec les parenthèses de l'étape 03, et `$event` contient ce qui a été envoyé :

```html
<app-list-card [list]="list" (toggleTask)="toggleTask(list, $event)" />
```

`output<void>()` déclare une sortie qui n'envoie rien : `deleteList.emit()` signale seulement « on a cliqué ».

### Déclarer les composants utilisés : `imports`

Pour utiliser `<app-list-card>` dans son gabarit, `App` doit l'importer, en haut du fichier (`import { ListCard } from './list-card/list-card'`) **et** dans `@Component({ imports: [ListCard] })`. Oubliez l'un des deux et la compilation échoue.

### Des styles qui ne débordent pas

Les styles de `list-card.css` ne s'appliquent qu'au gabarit de `ListCard`, et ceux de `app.css` qu'à celui d'`App`. C'est pour cela que la classe `.empty` est définie dans les deux fichiers : chaque composant a la sienne.

## À essayer

1. Retirez `ListCard` du tableau `imports` d'`App` et lisez l'erreur dans le terminal. Remettez-le.
2. Retirez `[list]="list"` dans `app.html` : `input.required` provoque une erreur. Remettez-le.
3. Dans `list-card.css`, passez `h2` en `color: #3949ab;` : seuls les noms des listes changent de couleur, pas le titre de la page.

## Étape suivante

[Étape 05 : ajouter avec un formulaire](../05-ajouter-avec-un-formulaire/README.md)
