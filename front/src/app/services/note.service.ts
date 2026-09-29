import { computed, Injectable, signal } from '@angular/core';

import { Product } from '../models';

// --- ETAPE 1 --- Structure d'une ligne de la note
// kind = étiquette qui dira, plus tard (étape 5), si une ligne est un produit
// ou une formule. Pour l'instant, un seul type de ligne existe.
export interface ProductLine {
  kind: 'product';
  product: Product;
  quantity: number;
}
// 1 seule instance pour toute l'app, partagée par CaissePage, NotePanel et OrderService.
@Injectable({ providedIn: 'root' })
export class NoteService {
  // --- ETAPE 2 --- L'état : la liste des lignes, vide au départ.
  private readonly lines = signal<ProductLine[]>([]);

  // Lecture en dehors du service (NotePanel doit pouvoir afficher les lignes).
  // .asReadonly() : les autres peuvent LIRE le signal, mais pas faire .set()/.update()
  readonly noteLines = this.lines.asReadonly();

  // --- ETAPE 3 --- Le total, recalculé automatiquement si lines() change.
  readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + line.product.price * line.quantity, 0),
  );

  // --- ETAPE 4 --- Ajouter un produit : une ligne par produit, quantité qui augmente.
  addProduct(product: Product): void {
    this.lines.update((currentLines) => {
      const existing = currentLines.find((l) => l.product.id === product.id);

      if (existing) {
        // Déjà dans la note : nouvelle ligne avec quantity + 1, à la place de l'ancienne.
        return currentLines.map((l) => (l === existing ? { ...l, quantity: l.quantity + 1 } : l));
      }

      // Nouveau produit : nouveau tableau = l'ancien + une ligne en plus.
      return [...currentLines, { kind: 'product', product, quantity: 1 }];
    });
  }

  // --- ETAPE 5 --- Diminuer la quantité ; à 0, la ligne disparaît.
  decreaseQuantity(productId: number): void {
    this.lines.update((currentLines) =>
      currentLines
        .map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  // --- ETAPE 6 --- Supprimer une ligne entièrement, quelle que soit sa quantité.
  removeLine(productId: number): void {
    this.lines.update((currentLines) => currentLines.filter((l) => l.product.id !== productId));
  }

  // --- ETAPE 7 --- Vider la note (après paiement, ou déconnexion).
  clear(): void {
    this.lines.set([]);
  }

  // --- ETAPE 8 --- Quantité déjà présente dans la note pour un produit donné.
  // Utile à CaissePage pour calculer le stock RÉELLEMENT disponible
  quantityInNote(productId: number): number {
    // récupère toutes les lignes de la note (signal)
    const allLines = this.lines();
    // cherche la ligne correspondant au produit donné
    const found = allLines.find((l) => l.product.id === productId);
    // si aucune ligne n'est trouvée, retourne 0
    if (found === undefined) {
      return 0;
    }
    // si une ligne est trouvée, retourne la quantité de ce produit dans la note
    return found.quantity;
  }
}
