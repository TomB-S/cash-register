# AuthService : login, logout, jeton

## État interne

```
token = signal<string | null>(sessionStorage.getItem('token'))
isLoggedIn = computed(() => token() !== null)
```

## `login(login, password)`

```
1. this.http.post('/auth/login', { login, password })
2.   .pipe(tap(response => {
3.       token.set(response.token)              ← isLoggedIn() devient true
4.       sessionStorage.setItem('token', ...)    ← survit à un F5
5.   }))
6. return (rien ne part encore, c'est LoginPage qui fera .subscribe())
```

## `logout()`

```
1. this.http.post('/auth/logout', {}).subscribe()   ← part tout de suite, réponse ignorée
2. clearToken()
      token.set(null)
      sessionStorage.removeItem('token')
```

## Pourquoi `clearToken()` est séparée de `logout()`

```
Intercepteur reçoit un 401
        │
        ▼
Si l'intercepteur appelait logout() :
   logout() fait un POST /auth/logout
        │
        ▼ (si le serveur répond encore 401, jeton déjà mort)
   l'intercepteur intercepte CE 401 aussi
        │
        ▼
   rappelle logout() → boucle infinie !

Donc l'intercepteur appelle clearToken() : AUCUNE requête, pas de boucle.
```
