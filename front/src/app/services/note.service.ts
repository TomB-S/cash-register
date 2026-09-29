import { computed, Injectable, signal } from '@angular/core';

import { Formula, OrderRequest, Product } from '../models';

// --- ETAPE 1 --- Structure d'une ligne de la note
// kind = étiquette qui dit si une ligne est un produit seul ou une formule.
export interface ProductLine {
  kind: 'product';
  id: number;
  product: Product;
  quantity: number;
}

// --- ETAPE 9 (étape 5 du TP) --- Une formule : les 3 produits choisis, prix fixe.
// Pas de quantity : cliquer 2 fois sur une formule crée 2 lignes séparées.
export interface FormulaLine {
  kind: 'formula';
  id: number;
  formula: Formula;
  main: Product;
  drink: Product;
  dessert: Product;
}

// Union : une ligne de la note est SOIT un produit, SOIT une formule.
export type NoteLine = ProductLine | FormulaLine;

// 1 seule instance pour toute l'app, partagée par CaissePage, NotePanel et OrderService.
@Injectable({ providedIn: 'root' })
export class NoteService {
  // --- ETAPE 2 --- L'état : la liste des lignes, vide au départ.
  private readonly lines = signal<NoteLine[]>([]);

  // Compteur pour donner un id unique à chaque ligne (utile pour track dans le
  // template, et pour supprimer une formule précise parmi plusieurs identiques).
  private nextId = 1;

  // Lecture en dehors du service (NotePanel doit pouvoir afficher les lignes).
  // .asReadonly() : les autres peuvent LIRE le signal, mais pas faire .set()/.update()
  readonly noteLines = this.lines.asReadonly();

  // --- ETAPE 3 --- Le total : gère les DEUX types de ligne, chacun a un prix.
  readonly total = computed(() => {
    let sum = 0;
    for (const line of this.lines()) {
      if (line.kind === 'product') {
        sum += line.product.price * line.quantity;
      } else {
        sum += line.formula.price;
      }
    }
    return sum;
  });

  // --- ETAPE 4 --- Ajouter un produit : une ligne par produit, quantité qui augmente.
  addProduct(product: Product): void {
    this.lines.update((currentLines) => {
      const existing = currentLines.find((l) => l.kind === 'product' && l.product.id === product.id);

      if (existing) {
        // Déjà dans la note : nouvelle ligne avec quantity + 1, à la place de l'ancienne.
        return currentLines.map((l) =>
          l === existing && l.kind === 'product' ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }

      // Nouveau produit : nouveau tableau = l'ancien + une ligne en plus.
      return [...currentLines, { kind: 'product', id: this.nextId++, product, quantity: 1 }];
    });
  }

  // --- ETAPE 5 --- Diminuer la quantité d'un PRODUIT ; à 0, la ligne disparaît.
  // Ne concerne que les ProductLine : une formule n'a pas de quantity.
  decreaseQuantity(productId: number): void {
    this.lines.update((currentLines) => {
      const updated = currentLines.map((l) => {
        if (l.kind === 'product' && l.product.id === productId) {
          return { ...l, quantity: l.quantity - 1 };
        }
        return l;
      });

      return updated.filter((l) => {
        if (l.kind === 'product') {
          return l.quantity > 0;
        }
        return true;
      });
    });
  }

  // --- ETAPE 6 --- Supprimer une ligne PRODUIT entièrement.
  removeLine(productId: number): void {
    this.lines.update((currentLines) => currentLines.filter((l) => !(l.kind === 'product' && l.product.id === productId)));
  }

  // --- ETAPE 7 --- Vider la note (après paiement, ou déconnexion).
  clear(): void {
    this.lines.set([]);
  }

  // --- ETAPE 8 --- Quantité déjà réservée pour un produit donné, PRODUIT SEUL
  // OU utilisé dans une formule (les 3 produits d'une formule comptent aussi).
  quantityInNote(productId: number): number {
    let quantity = 0;

    for (const line of this.lines()) {
      if (line.kind === 'product') {
        if (line.product.id === productId) {
          quantity += line.quantity;
        }
      } else {
        if (line.main.id === productId) quantity += 1;
        if (line.drink.id === productId) quantity += 1;
        if (line.dessert.id === productId) quantity += 1;
      }
    }

    return quantity;
  }

  // --- ETAPE 10 (étape 5 du TP) --- Ajoute une formule : toujours une NOUVELLE ligne.
  addFormula(formula: Formula, main: Product, drink: Product, dessert: Product): void {
    this.lines.update((currentLines) => [
      ...currentLines,
      { kind: 'formula', id: this.nextId++, formula, main, drink, dessert },
    ]);
  }

  // --- ETAPE 11 (étape 5 du TP) --- Supprime UNE formule précise (par son id unique,
  // car plusieurs formules identiques peuvent coexister, sans quantity pour les fusionner).
  removeFormulaLine(lineId: number): void {
    this.lines.update((currentLines) => currentLines.filter((l) => l.id !== lineId));
  }

  // --- ETAPE 12 (étape 6 du TP) --- Convertit la note en OrderRequest : le serveur ne
  // veut que des identifiants et des quantités, jamais les objets Product/Formula entiers.
  toOrderRequest(): OrderRequest {
    const products: OrderRequest['products'] = [];
    const formulas: OrderRequest['formulas'] = [];

    for (const line of this.lines()) {
      if (line.kind === 'product') {
        products.push({ productId: line.product.id, quantity: line.quantity });
      } else {
        formulas.push({
          formulaId: line.formula.id,
          mainId: line.main.id,
          drinkId: line.drink.id,
          dessertId: line.dessert.id,
        });
      }
    }

    return { products, formulas };
  }
}
