# NoteService : la note en cours

## Le problème résolu

```
CaissePage (catalogue)          NotePanel (le ticket)         OrderService (payer)
       │                              │                              │
       └──────────────┬───────────────┴──────────────┬───────────────┘
                       │                              │
                       ▼                              ▼
                 même NoteService, une seule instance partagée
                 (providedIn: 'root', comme AuthService)
```

Sans service partagé : chaque composant aurait sa propre copie de la note,
jamais synchronisées entre elles. Avec le service : tous regardent/modifient
LE MÊME état.

## Pourquoi l'immutabilité n'est pas juste "une bonne pratique" ici

Angular détecte qu'un signal a changé en comparant l'ancienne et la nouvelle
valeur PAR RÉFÉRENCE (même objet en mémoire, ou pas), pas en inspectant le contenu.

```
❌ lines().push(nouvelleLigne)
       │
       ▼
   même tableau en mémoire, juste modifié sur place
       │
       ▼
   Angular : "c'est toujours le même objet" → AUCUNE mise à jour de l'écran


✅ lines.set([...lines(), nouvelleLigne])
       │
       ▼
   un TOUT NOUVEAU tableau créé
       │
       ▼
   Angular : "ce n'est plus le même objet" → écran mis à jour
```

## Le `kind` : distinguer les types de lignes

Bientôt, la note contiendra deux sortes de lignes très différentes :

```
type NoteLine = ProductLine | FormulaLine

ProductLine = { kind: 'product', product: Product, quantity: number }
FormulaLine = { kind: 'formula', formula: Formula, main: Product, drink: Product, dessert: Product }
                  │
                  └─ étiquette qui dit COMMENT afficher/calculer cette ligne précise
```

## Le flux : cliquer sur un produit deux fois

```
1er clic sur "Cheese Burger"
        │
        ▼
addProduct(cheeseBurger)
        │
        │  lines.update(currentLines => {
        │    existing = currentLines.find(l => l.product.id === cheeseBurger.id)
        │      → n'existe pas encore
        │    return [...currentLines, { kind: 'product', product: cheeseBurger, quantity: 1 }]
        │  })
        ▼
lines() = [ { product: CheeseBurger, quantity: 1 } ]


2ème clic sur "Cheese Burger"
        │
        ▼
addProduct(cheeseBurger)
        │
        │  existing = currentLines.find(...)
        │      → TROUVÉE, c'est la ligne du dessus
        │  return currentLines.map(l =>
        │    l === existing ? { ...l, quantity: l.quantity + 1 } : l
        │  )
        ▼
lines() = [ { product: CheeseBurger, quantity: 2 } ]   ← UNE seule ligne, quantité 2
```

## `total`, calculé automatiquement

```
total = computed(() =>
  lines().reduce((sum, line) => sum + line.product.price * line.quantity, 0)
)

lines() = [ { price: 950, quantity: 2 } ]
                │
                ▼
        reduce : sum commence à 0
                0 + (950 * 2) = 1900
                ▼
        total() = 1900   (19,00 €)
                │
                └─ recalculé tout seul à chaque changement de lines()
```

## Ce que le stock affiché doit prendre en compte (fin d'étape 4)

```
Cookie : stock = 2 (côté API)
Note en cours : 2 cookies déjà dedans
        │
        ▼
disponible = stock - quantité déjà dans la note = 2 - 2 = 0
        │
        ▼
ProductCard reçoit available = 0 → soldOut() = true → grisé, "Hors stock"
```
