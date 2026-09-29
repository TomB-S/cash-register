# Guard et intercepteur

## Le guard : protéger une route

```
Utilisateur va sur /caisse
        │
        ▼
Angular appelle authGuard() AVANT d'afficher la page
        │
        ├─ isLoggedIn() === true  → return true           → page affichée
        │
        └─ isLoggedIn() === false → return createUrlTree(['/login'])
                                                            → redirigé vers /login
```

Branché dans `app.routes.ts` avec `canActivate: [authGuard]` sur la route `caisse` uniquement.

## L'intercepteur : passage obligé de CHAQUE requête HTTP

```
                    ┌─────────────────────────────┐
CatalogService  ──▶ │      authInterceptor         │ ──▶ serveur
OrderService    ──▶ │  (ajoute le jeton au passage) │ ──▶ Java
AuthService     ──▶ │                               │ ──▶
                    └─────────────────────────────┘
```

### Phase 1 : avant l'envoi

```
req  (requête d'origine, sans en-tête)
  │
  │  token = authService.getToken()
  │  authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  ▼
next(authReq)   ← envoie la requête MODIFIÉE, pas l'originale
```

### Phase 2 : au retour, si erreur

```
next(authReq).pipe(
  catchError(err => {
    si err.status === 401 ET ce n'est pas la requête de login :
        authService.clearToken()
        router.navigate(['/login'])
    return throwError(() => err)   ← on propage quand même l'erreur
  })
)
```

**Pourquoi exclure la requête de login du 401 ?** Parce que `LoginPage` doit pouvoir
afficher SON PROPRE message ("identifiant incorrect") sans que l'intercepteur
n'interfère en redirigeant en plus.
