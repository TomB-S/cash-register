# Étape 12 : écrire des tests

**Objectif** : écrire des **tests automatiques**, c'est-à-dire du code qui vérifie que l'application fait bien ce qu'elle doit faire. Une seule commande rejoue ensuite toutes ces vérifications en quelques secondes, à chaque modification : si l'on casse quelque chose sans le vouloir, un test le signale aussitôt.

L'application elle-même ne change pas : c'est celle de l'étape 11, accompagnée de ses tests.

## Lancer cette étape

```sh
cd 12-ecrire-des-tests
npm install      # si node_modules/ n'existe pas encore (cette étape a des dépendances en plus)
npm test         # lance les tests, puis les relance à chaque enregistrement d'un fichier
```

Résultat attendu :

```text
 Test Files  5 passed (5)
      Tests  23 passed (23)
```

`Ctrl+C` arrête les tests. Pour les lancer une seule fois, sans rester en attente : `npm test -- --no-watch`.

Les tests n'ont **pas** besoin du serveur Java : ils le remplacent par un faux serveur (voir plus bas). L'application, elle, se lance toujours avec `npm start` et le serveur, comme à l'étape 11.

## Ce qui a changé depuis l'étape 11

| Fichier                               | Changement                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `package.json`, `package-lock.json`   | Script `npm test` ; dépendances de développement `vitest` et `jsdom`.              |
| `angular.json`                        | Cible `test` (`@angular/build:unit-test`) ; les options `skipTests` sont retirées. |
| `tsconfig.spec.json`, `tsconfig.json` | Réglages TypeScript des fichiers de test.                                          |
| `src/app/*.spec.ts`                   | **Nouveaux** : les tests, un fichier `.spec.ts` à côté de chaque fichier testé.    |

Le projet avait été créé à l'étape 01 avec `--skip-tests`. Ces réglages sont ceux qu'aurait produits `ng new` sans cette option ; les dépendances s'installent avec :

```sh
npm install --save-dev vitest@^5 jsdom@^30
```

Depuis que les options `skipTests` sont retirées d'`angular.json`, `npx ng generate component …` crée aussi un fichier `.spec.ts` prêt à remplir.

## Les outils

- **Vitest** exécute les tests et affiche les résultats. `ng test` le lance avec la bonne configuration.
- **jsdom** simule un navigateur dans Node.js : Angular peut y afficher des composants sans ouvrir Chrome.
- **TestBed**, fourni par Angular, prépare un mini-environnement Angular pour chaque test : services, composants, `HttpClient`…

## Les tests écrits

Du plus simple au plus complet :

| Fichier                       | Ce qui est testé                             | Exemple de vérification                                            |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `error-message.spec.ts`       | une fonction ordinaire                       | un 502 sans explication donne « Impossible de joindre… »           |
| `list-card/list-card.spec.ts` | un composant seul, sans serveur              | le nom d'une liste terminée est barré, pas celui d'une liste vide  |
| `todo-store.spec.ts`          | un service qui parle au serveur              | trois modifications rapides donnent deux envois, le dernier à jour |
| `auth-store.spec.ts`          | le service du compte et l'intercepteur       | le jeton n'est ajouté aux requêtes qu'une fois connecté            |
| `app.spec.ts`                 | toute la page, composants et services réunis | créer une liste l'affiche et envoie toutes les listes au serveur   |

## Les notions de l'étape

### Anatomie d'un test

```ts
describe('errorMessage', () => {                                   // un groupe de tests
  it("reprend l'explication envoyée par le serveur", () => {       // UN test, nommé en clair
    const error = new HttpErrorResponse({ status: 404, error: { error: "La liste 3 n'existe pas." } });

    expect(errorMessage(error)).toBe("La liste 3 n'existe pas."); // la vérification
  });
});
```

Un test suit presque toujours le même plan en trois temps : **préparer** une situation, **agir**, **vérifier** le résultat avec `expect(…)`. Les lignes vides des fichiers `.spec.ts` séparent ces trois temps.

| Vérification               | Réussit si…                                              |
| -------------------------- | -------------------------------------------------------- |
| `expect(a).toBe(b)`        | `a` et `b` sont identiques (nombres, textes, booléens…). |
| `expect(a).toEqual(b)`     | `a` et `b` ont le même contenu (objets, tableaux).       |
| `expect(a).toContain(b)`   | le texte ou le tableau `a` contient `b`.                 |
| `expect(a).toBeNull()`     | `a` vaut `null`.                                         |
| `expect(a).not.toBeNull()` | `.not` inverse n'importe quelle vérification.            |

`beforeEach(…)` s'exécute avant **chaque** test, `afterEach(…)` après : chaque test repart d'une situation neuve et ne dépend pas des autres.

### Tester un composant

```ts
const fixture = TestBed.createComponent(ListCard);
fixture.componentRef.setInput('list', { id: 1, name: 'Courses', tasks: [] }); // comme [list]="…"
await fixture.whenStable();                                                   // attendre l'affichage
const element: HTMLElement = fixture.nativeElement;
expect(element.querySelector('h2')!.classList.contains('done')).toBe(false);
```

On interagit avec la page comme un utilisateur : `click()` sur un bouton ; pour un champ, on change `value` puis on déclenche l'événement `input` qu'écoute `[(ngModel)]`. Après chaque action, `await fixture.whenStable()` laisse Angular mettre l'affichage à jour.

`await` attend la fin d'une opération qui prend du temps ; il n'est permis que dans une fonction marquée `async`, d'où les `async () => { … }` de ces tests.

### Un faux serveur : `HttpTestingController`

```ts
TestBed.configureTestingModule({
  providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
});
const server = TestBed.inject(HttpTestingController);

store.createList('A');
const request = server.expectOne({ method: 'PUT', url: '/api/sync' }); // une requête est-elle partie ?
expect(request.request.body.length).toBe(2);                          // que contient-elle ?
request.flush(null);                                                  // le faux serveur répond
```

`provideHttpClientTesting()` débranche `HttpClient` du réseau : les requêtes arrivent dans `HttpTestingController`, qui ne répond que quand le test le décide (`flush`). On peut ainsi tester, sans serveur Java et en quelques millisecondes, des situations difficiles à provoquer à la main : un serveur qui répond 502, trois clics avant la première réponse…

`server.verify()`, dans `afterEach`, fait échouer le test si une requête inattendue est partie.

### Et le serveur ?

Le serveur Java a ses propres tests, écrits avec JUnit. Ils démarrent un vrai serveur, avec une base en mémoire :

```sh
cd serveur
./mvnw test          # ou .\mvnw.cmd test sous Windows
```

## À essayer

1. **Casser la règle** : dans `list-card/list-card.ts`, remplacez `return tasks.length > 0 && tasks.every(…)` par `return tasks.every(…)` et enregistrez (avec `npm test` lancé). Un test échoue et dit lequel, et pourquoi :

   ```text
   × ne barre pas le nom d'une liste vide
   AssertionError: expected true to be false
   ```

   Remettez le code d'origine : tout redevient vert.

2. **Casser l'ordre des envois** : dans `todo-store.ts`, supprimez le bloc `if (this.sending) { … }` de `sync()`. Deux tests échouent, dont « n'envoie qu'une requête à la fois ». Remettez le bloc.
3. **Écrire un test** : dans `todo-store.spec.ts`, ajoutez un test pour `deleteTask`, sur le modèle de celui de `toggleTask`. Vérifiez qu'il échoue si vous videz la méthode `deleteTask`.
4. Lisez les tests de `auth-store.spec.ts` : chacun décrit, dans son nom, une règle de fonctionnement de la connexion. Les noms des tests forment une documentation toujours à jour.

## Et après ?

L'application est complète. Quelques pistes pour continuer seul :

- renommer une liste, ou vider d'un coup les tâches réalisées, en ajoutant les tests correspondants ;
- découvrir le routeur d'Angular, pour afficher chaque liste sur sa propre page ;
- mesurer la couverture des tests (quelles lignes sont exécutées par au moins un test) avec `npm test -- --coverage`, après avoir installé `@vitest/coverage-v8` (`npm install --save-dev @vitest/coverage-v8`).

Retour au [README général](../README.md).
