# Étape 06 : barrer les listes terminées

**Objectif** : quand toutes les tâches d'une liste sont réalisées, le nom de la liste est barré à son tour. Il redevient normal dès qu'on ajoute une nouvelle tâche (ou qu'on en décoche une). Un compteur « réalisées / total » accompagne le nom.

![Aperçu de l'étape 06](capture.png)

## Lancer cette étape

```sh
cd 06-barrer-les-listes-terminees
npm install      # une seule fois
npm start
```

Puis ouvrez <http://localhost:4200>. La liste « Découvrir Angular », dont les deux tâches sont faites, s'affiche déjà barrée.

## Ce qui a changé depuis l'étape 05

| Fichier                            | Changement                                                             |
| ---------------------------------- | ---------------------------------------------------------------------- |
| `src/app/list-card/list-card.ts`   | Deux signaux calculés : `completed` et `doneCount`.                    |
| `src/app/list-card/list-card.html` | `[class.done]="completed()"` sur le nom ; compteur affiché avec `@if`. |
| `src/app/list-card/list-card.css`  | Style du compteur ; le nom occupe la place libre de l'en-tête.         |

Aucun autre fichier ne change : c'est tout l'intérêt de l'étape 04.

## La règle

Une liste est **terminée** quand :

1. elle contient **au moins une** tâche ;
2. et **toutes** ses tâches sont réalisées.

| Situation                                 | Nom de la liste |
| ----------------------------------------- | --------------- |
| Aucune tâche                              | normal          |
| Au moins une tâche non réalisée           | normal          |
| Toutes les tâches réalisées               | ~~barré~~       |
| … puis on ajoute une tâche (non réalisée) | normal          |
| … puis on la coche                        | ~~barré~~       |

Pourquoi « au moins une » ? Sans cette condition, une liste qu'on vient de créer, encore vide, s'afficherait barrée : déroutant.

Rien à programmer pour « jusqu'à ce qu'on ajoute une nouvelle tâche » : une nouvelle tâche n'est pas réalisée, donc la condition 2 devient fausse toute seule.

## Les notions de l'étape

### Un signal calculé : `computed`

```ts
protected readonly completed = computed(() => {
  const tasks = this.list().tasks;
  return tasks.length > 0 && tasks.every((task) => task.done);
});
```

`computed` crée un signal dont la valeur est **calculée** à partir d'autres signaux, ici l'entrée `list`. On ne le modifie jamais soi-même : Angular refait le calcul quand `list` change, et **seulement** dans ce cas. Dans le gabarit, on le lit comme tout signal : `completed()`.

`tasks.every(condition)` renvoie `true` si la condition est vraie pour **tous** les éléments du tableau. Son cousin `tasks.some(condition)` renvoie `true` si elle est vraie pour **au moins un**.

On ne stocke pas « liste terminée » dans les données : on le **déduit** des tâches. Une information déduite ne peut pas se retrouver en contradiction avec les tâches, alors qu'une information stockée à part devrait être tenue à jour à chaque modification, avec le risque d'en oublier une.

### Afficher sous condition : `@if`

```html
@if (list().tasks.length > 0) {
  <span class="count">{{ doneCount() }} / {{ list().tasks.length }}</span>
}
```

Le bloc n'est affiché que si la condition est vraie. Un bloc `@else { … }` peut suivre, pour afficher autre chose dans le cas contraire.

### La règle d'or, vérifiée

À l'étape 03, on a décidé de toujours fabriquer des copies au lieu de modifier les objets. C'est grâce à cela que `completed` fonctionne : quand une tâche est cochée, `App` range dans son signal une **nouvelle** liste. `ListCard` reçoit donc une nouvelle valeur dans son entrée `list`, et `computed` sait qu'il doit refaire son calcul. L'exercice 4 ci-dessous montre ce qui se passe sans cette règle.

## À essayer

1. Dans « Découvrir Angular », ajoutez une tâche : le nom n'est plus barré. Cochez-la : il se barre à nouveau.
2. Dans « Préparer les vacances », supprimez la tâche non réalisée : la liste est terminée.
3. Créez une nouvelle liste : vide, elle n'est pas barrée.
4. L'expérience de la règle d'or : dans `app.ts`, remplacez le contenu de la méthode `toggleTask` par la seule ligne `task.done = !task.done;` puis cochez toutes les tâches de « Courses ». Les tâches se barrent, mais **ni le nom ni le compteur ne changent** : la liste n'étant pas un nouvel objet, `computed` n'a pas refait son calcul. Remettez le code d'origine.

## Étape suivante

[Étape 07 : centraliser dans un service](../07-centraliser-dans-un-service/README.md)
