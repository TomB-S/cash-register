# Communication parent / enfant : ProductCard

## Le principe

```
input()  = le PARENT donne une donnée à l'ENFANT     ( [crochets] )
output() = l'ENFANT prévient le PARENT d'un événement ( (parenthèses) )
```

## Déclaration côté enfant (`product-card.ts`)

```
product   = input.required<Product>()   ← doit être fourni par le parent
available = input.required<number>()
clicked   = output<Product>()           ← "alarme" que l'enfant peut déclencher

Lire :   this.product()     (comme un signal, avec les parenthèses)
Émettre: this.clicked.emit(this.product())
```

## Utilisation côté parent (`caisse-page.html`)

```
<app-product-card
  [product]="product"              ← product (variable @for) → input product de l'enfant
  [available]="product.stock"      ← product.stock            → input available de l'enfant
  (clicked)="onProductClicked($event)"   ← écoute l'output clicked
/>
```

## Le flux complet, au clic

```
Utilisateur clique sur la carte
        │
        ▼
ProductCard.onClick()
        │
        │  si !soldOut() :
        │    this.clicked.emit(this.product())
        ▼
Angular voit (clicked)="..." dans caisse-page.html
        │
        ▼
CaissePage.onProductClicked($event)
        │
        $event = exactement la valeur donnée à .emit(...)
        └─ ici : le Product cliqué
```

## `computed` dans ProductCard

```
soldOut = computed(() => available() <= 0)
   └─ recalculé automatiquement si available() change

icon = computed(() => CATEGORIES.find(c => c.code === product().category)?.icon)
   └─ .find() = cherche le PREMIER élément qui correspond, dans un tableau
   └─ ?. = n'accède à .icon que si .find() a trouvé quelque chose
```
