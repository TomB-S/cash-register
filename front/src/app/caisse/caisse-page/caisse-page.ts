import { Component, inject, signal } from '@angular/core';
import { CatalogService } from '../../services/catalog.service';
import { NoteService } from '../../services/note.service';
import { Product, Formula, CATEGORIES, Category } from '../../models';
import { ProductCard } from '../product-card/product-card';
import { NotePanel } from '../note-panel/note-panel';
import { FormulaPicker, FormulaSelection } from '../formula-picker/formula-picker';
import { EurosPipe } from '../../shared/euros.pipe';

@Component({
  imports: [ProductCard, NotePanel, FormulaPicker, EurosPipe],
  selector: 'app-caisse-page',
  styleUrl: './caisse-page.css',
  templateUrl: './caisse-page.html',
})
export class CaissePage {
  // --- ETAPE 1 --- Injection et déclaration
  // Pour appeler l'API du catalogue.
  private readonly catalogService = inject(CatalogService);
  // Pour ajouter des produits à la note, et connaître ce qui y est déjà.
  private readonly noteService = inject(NoteService);
  // La liste des produits, vide au départ le temps que la requête réponde.
  readonly products = signal<Product[]>([]);
  // La liste des formules, vide au départ le temps que la requête réponde.
  readonly formulas = signal<Formula[]>([]);

  // --- ETAPE 2 --- Création du constructor
  constructor() {
    // subscribe() déclenche vraiment la requête. Quand la réponse arrive,
    // on remplace le tableau vide par les produits reçus.
    this.catalogService.getProducts().subscribe((products) => {
      this.products.set(products);
    });

    this.catalogService.getFormulas().subscribe((formulas) => {
      this.formulas.set(formulas);
    });
  }

  // --- ETAPE 3 ---
  // Les 4 catégories, dans l'ordre d'affichage (avec icône/libellé).
  readonly categories = CATEGORIES;

  // Filtre les produits pour une catégorie donnée, utilisé par le template.
  productsIn(category: Category): Product[] {
    return this.products().filter((p) => p.category === category);
  }

  // --- ETAPE 4 ---
  // Reçoit le produit émis par (clicked) sur <app-product-card> : on l'ajoute à la note.
  onProductClicked(product: Product): void {
    this.noteService.addProduct(product);
  }

  // Stock réellement disponible : le stock de l'API moins ce qui est déjà dans la note.
  // Utilisé par [available] sur <app-product-card>, pour griser un produit si stock=0
  availableStock(product: Product): number {
    return product.stock - this.noteService.quantityInNote(product.id);
  }

  // Fonction "pont" donnée à FormulaPicker (input availableStock), pour qu'il réutilise
  // le même calcul sans le dupliquer. Fléchée : this reste celui de CaissePage.
  readonly availableStockFn = (product: Product): number => this.availableStock(product);

  // --- ETAPE 5 (formules) ---
  // .some() = true s'il existe AU MOINS UN produit de cette catégorie encore disponible.
  formulaIsAvailable(formula: Formula): boolean {
    const hasMain = this.products().some(
      (p) => p.category === formula.mainCategory && this.availableStock(p) > 0,
    );
    const hasDrink = this.products().some(
      (p) => p.category === 'BOISSON' && this.availableStock(p) > 0,
    );
    const hasDessert = this.products().some(
      (p) => p.category === 'DESSERT' && this.availableStock(p) > 0,
    );
    return hasMain && hasDrink && hasDessert;
  }

  // Quelle formule est en train d'être choisie (fenêtre ouverte), ou null si aucune.
  readonly formulaBeingPicked = signal<Formula | null>(null);

  openFormulaPicker(formula: Formula): void {
    this.formulaBeingPicked.set(formula);
  }

  closeFormulaPicker(): void {
    this.formulaBeingPicked.set(null);
  }

  // Reçoit les 3 produits choisis via (confirm) sur <app-formula-picker>.
  onFormulaConfirmed(selection: FormulaSelection): void {
    const formula = this.formulaBeingPicked();

    // Sécurité : ne devrait jamais arriver (la fenêtre n'existe que si une formule est choisie).
    if (formula === null) {
      return;
    }

    this.noteService.addFormula(formula, selection.main, selection.drink, selection.dessert);
    this.closeFormulaPicker();
  }
}
