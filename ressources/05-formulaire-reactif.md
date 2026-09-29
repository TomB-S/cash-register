# Formulaire réactif : LoginPage

## Construction du formulaire (dans la classe)

```
fb = inject(NonNullableFormBuilder)

form = fb.group({
  login:    ['', Validators.required],
  password: ['', Validators.required],
})
```

## Branchement dans le template

```
<form [formGroup]="form" (ngSubmit)="onSubmit()">
     │                        │
     │                        └─ appelée à la soumission (clic ou Entrée)
     └─ relie CE <form> à l'objet `form` de la classe

  <input formControlName="login" />
     └─ relie CET input au champ "login" du form
```

## Flux au clic sur "Se connecter"

```
onSubmit()
  │
  │  const { login, password } = form.getRawValue()
  │
  ▼
authService.login(login, password).subscribe({

  next:  () → jeton déjà sauvegardé par AuthService (via tap)
             → router.navigate(['/caisse'])

  error: (err) → err.status === 401 ? "identifiant/mdp incorrect"
                                     : "le serveur ne répond pas"
                 errorMessage.set(...)
})
```

## Dans le template, l'affichage conditionnel

```
@if (errorMessage()) {
  <p class="alert-error">{{ errorMessage() }}</p>
}

<button [disabled]="form.invalid">Se connecter</button>
   └─ désactivé tant qu'un champ required est vide
```
