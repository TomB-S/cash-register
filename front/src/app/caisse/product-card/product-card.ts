import { Component, computed, input, output } from '@angular/core';

import { CATEGORIES, Product } from '../../models';
import { EurosPipe } from '../../shared/euros.pipe';

// Composant enfant de CaissePage, pour afficher un produit dans la grille.

@Component({
  imports: [EurosPipe],
  selector: 'app-product-card',
  styleUrl: './product-card.css',
  templateUrl: './product-card.html',
})
export class ProductCard {
  // input.required() = le parent (CaissePage) DOIT fournir cette valeur,
  // via [product]="..." sur la balise <app-product-card>.
  readonly product = input.required<Product>();

  // Stock RÉELLEMENT disponible, distinct de product().stock
  readonly available = input.required<number>();

  // output() = émetteur d'événements. clicked.emit(...) prévient le parent.
  readonly clicked = output<Product>();

  // computed : recalculé automatiquement si available() ou product() changent.
  readonly soldOut = computed(() => this.available() <= 0);

  // Cherche l'icône de la catégorie du produit dans CATEGORIES (models.ts).
  readonly icon = computed(() => CATEGORIES.find((c) => c.code === this.product().category)?.icon);

  onClick(): void {
    // On ne prévient le parent que si le produit est réellement disponible.
    if (!this.soldOut()) {
      this.clicked.emit(this.product());
    }
  }
}
