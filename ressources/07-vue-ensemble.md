# Vue d'ensemble de l'appli, à ce stade (fin Étape 3)

## Arborescence des fichiers créés

```
front/src/app/
├── app.config.ts          providers globaux : HttpClient + intercepteur, routeur
├── app.routes.ts           /login, /caisse (protégée par authGuard)
│
├── auth/
│   ├── auth.service.ts     signal token, isLoggedIn, login(), logout()
│   ├── auth.guard.ts        protège /caisse
│   └── auth.interceptor.ts  ajoute le jeton, gère les 401
│
├── services/
│   └── catalog.service.ts  getProducts(), getFormulas()
│
├── shared/
│   └── euros.pipe.ts       850 → "8,50 €"
│
├── login/login-page/       formulaire réactif
│
└── caisse/
    ├── caisse-page/        charge products (signal), affiche par catégorie
    └── product-card/       carte produit, input/output
```

## Le parcours d'un utilisateur, de bout en bout

```
1. Arrive sur /                        → redirigé vers /caisse
2. authGuard : pas connecté            → redirigé vers /login
3. LoginPage : saisit caisse/caisse
4. onSubmit() → AuthService.login().subscribe()
      │
      ├─ requête part réellement
      ├─ tap() sauvegarde le jeton (signal + sessionStorage)
      └─ next() → router.navigate(['/caisse'])
5. authGuard : isLoggedIn() = true     → accès autorisé
6. CaissePage créée
      │
      └─ constructor() → catalogService.getProducts().subscribe()
              │
              └─ products.set(lesProduits)
7. Template : @for sur categories, puis @for sur productsIn(cat.code)
      │
      └─ chaque produit → <app-product-card [product] [available] (clicked)>
8. Clic sur une carte (si pas hors stock)
      │
      └─ clicked.emit(product) → CaissePage.onProductClicked() (pour l'instant : log)
```

## Ce qui reste à construire (Étape 4 et suite)

```
NoteService (signals)  → la note en cours, remplace le simple console.log
NotePanel              → afficher le ticket
FormulaPicker          → choisir une formule
OrderService           → payer
DailyTotals            → recettes du jour
```
