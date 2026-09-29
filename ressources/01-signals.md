# Signals : `signal` et `computed`

Un signal = une boîte réactive. Tout ce qui en dépend se met à jour tout seul.

```
signal(0)  →  compteur
                 │
                 │ .set(5) / .update(v => v+1)
                 ▼
            compteur() = 5
                 │
                 │  computed(() => compteur() * 2)
                 ▼
             double() = 10   ← recalculé AUTOMATIQUEMENT, sans y toucher
```

## Les 3 opérations

| Code | Effet |
|---|---|
| `signal(valeurDeDepart)` | crée la boîte |
| `maBoite()` | LIT la valeur actuelle (s'appelle comme une fonction) |
| `maBoite.set(x)` | REMPLACE la valeur par `x` |
| `maBoite.update(v => ...)` | calcule la nouvelle valeur à partir de l'ancienne (`v`) |
| `computed(() => ...)` | une valeur DÉRIVÉE, jamais modifiée à la main, recalculée seule |

## Dans notre code (`AuthService`)

```
token = signal<string | null>(null)
                 │
                 │ .set(jeton reçu au login)
                 ▼
        token() = "abc-123"
                 │
                 │  isLoggedIn = computed(() => token() !== null)
                 ▼
        isLoggedIn() = true   ← se met à jour tout seul
```

**Règle d'or** : jamais `this.token = ...` (ça casserait tout). Toujours `.set()` ou `.update()`.
