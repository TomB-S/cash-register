# Observable, pipe, tap, subscribe

Un Observable = une "recette de requête", inerte tant que personne ne s'y abonne.

```
this.http.post(url, body)              ← rien ne part, juste préparé
        │
        │  .pipe(tap(fn))              ← on ajoute une étape "au passage", inerte aussi
        ▼
   Observable prêt, mais toujours rien envoyé
        │
        │  .subscribe(callback)        ← ICI SEULEMENT, tout démarre pour de vrai
        ▼
1. la requête HTTP part réellement
2. le serveur répond
3. tap(fn) s'exécute avec la réponse (effet de bord, ne change pas la valeur)
4. callback (dans subscribe) s'exécute avec la même réponse
```

## Analogie

- Écrire `.post(...).pipe(tap(...))` = **rédiger une recette de cuisine**.
- Faire `.subscribe(...)` = **cuisiner réellement la recette**.

## Dans `AuthService.login()`

```
login(login, password)
   │
   └─ return this.http.post(...).pipe(tap(response => sauvegarder le jeton))
              (rien ne part encore : c'est un `return`, pas un `.subscribe()`)

Plus tard, dans LoginPage :
   authService.login(...).subscribe({
     next:  () => rediriger vers /caisse,
     error: (err) => afficher un message
   })
   → C'EST ICI que la requête part réellement.
```

## Promise vs Observable (si tu connais déjà `fetch`)

| Promise (`fetch`) | Observable (RxJS) |
|---|---|
| part tout de suite | part seulement au `.subscribe()` |
| `.then(fn)` | `.pipe(map(fn))` |
| `.then(fn)` qui ne change rien, juste un effet de bord | `.pipe(tap(fn))` |
| `.then(fn)` final, chez l'appelant | `.subscribe(fn)` |
