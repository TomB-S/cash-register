import { Component, computed, input, output, signal } from '@angular/core';

import { Formula, Product } from '../../models';
import { EurosPipe } from '../../shared/euros.pipe';

// Ce que confirm() émet : les 3 produits choisis.
export interface FormulaSelection {
  main: Product;
  drink: Product;
  dessert: Product;
}

@Component({
  imports: [EurosPipe],
  selector: 'app-formula-picker',
  styleUrl: './formula-picker.css',
  templateUrl: './formula-picker.html',
})
export class FormulaPicker {
  // La formule pour laquelle on choisit les 3 produits.
  readonly formula = input.required<Formula>();

  // Tous les produits (pour filtrer par catégorie dans le template).
  readonly products = input.required<Product[]>();

  // Fonction fournie par CaissePage : le stock réellement disponible d'un produit
  // (tient compte de ce qui est déjà dans la note, comme pour les ProductCard).
  readonly availableStock = input.required<(product: Product) => number>();

  // confirm émet les 3 produits choisis ; cancel n'émet rien, juste "ferme-moi".
  readonly confirm = output<FormulaSelection>();
  readonly cancel = output<void>();

  // Les 3 choix, null tant qu'ils ne sont pas faits.
  readonly selectedMain = signal<Product | null>(null);
  readonly selectedDrink = signal<Product | null>(null);
  readonly selectedDessert = signal<Product | null>(null);

  // "Ajouter à la note" n'est actif que si les 3 choix sont faits.
  readonly canConfirm = computed(
    () => this.selectedMain() !== null && this.selectedDrink() !== null && this.selectedDessert() !== null,
  );

  // Produits du plat principal, filtrés par la catégorie de CETTE formule
  // (BURGER ou PANINI selon formula().mainCategory).
  mainProducts(): Product[] {
    return this.products().filter((p) => p.category === this.formula().mainCategory);
  }

  drinkProducts(): Product[] {
    return this.products().filter((p) => p.category === 'BOISSON');
  }

  dessertProducts(): Product[] {
    return this.products().filter((p) => p.category === 'DESSERT');
  }

  onConfirm(): void {
    const main = this.selectedMain();
    const drink = this.selectedDrink();
    const dessert = this.selectedDessert();

    // Sécurité en plus du [disabled] du bouton : si un choix manque, on n'émet rien.
    if (main === null || drink === null || dessert === null) {
      return;
    }

    this.confirm.emit({ main, drink, dessert });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
