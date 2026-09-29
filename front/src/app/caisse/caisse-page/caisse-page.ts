import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { CatalogService } from '../../services/catalog.service';
import { NoteService } from '../../services/note.service';
import { OrderService } from '../../services/order.service';
import { Product, Formula, Order, DailyTotal, CATEGORIES, Category } from '../../models';
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
  // Pour payer, et connaître les totaux par jour.
  private readonly orderService = inject(OrderService);
  // La liste des produits, vide au départ le temps que la requête réponde.
  readonly products = signal<Product[]>([]);
  // La liste des formules, vide au départ le temps que la requête réponde.
  readonly formulas = signal<Formula[]>([]);
  // Les totaux par jour (étape 7), déjà chargés ici pour être rechargés après paiement.
  readonly dailyTotals = signal<DailyTotal[]>([]);

  // --- ETAPE 2 --- Création du constructor
  constructor() {
    this.loadProducts();
    this.loadFormulas();
    this.loadDailyTotals();
  }

  // Extraites du constructor pour pouvoir les rappeler après un paiement (stocks
  // et totaux changés côté serveur).
  private loadProducts(): void {
    this.catalogService.getProducts().subscribe((products) => {
      this.products.set(products);
    });
  }

  private loadFormulas(): void {
    this.catalogService.getFormulas().subscribe((formulas) => {
      this.formulas.set(formulas);
    });
  }

  private loadDailyTotals(): void {
    this.orderService.getDailyTotals().subscribe((totals) => {
      this.dailyTotals.set(totals);
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

  // --- ETAPE 6 (paiement) ---
  // Référence directe au total de la note, pour l'afficher sur le bouton "Payer".
  readonly noteTotal = this.noteService.total;

  // true pendant que la requête de paiement est en cours (désactive le bouton).
  readonly isPaying = signal(false);

  // Dernière commande payée avec succès (pour le message de confirmation), ou null.
  readonly paidOrder = signal<Order | null>(null);

  // Message d'erreur du dernier paiement raté (ex: 409 stock insuffisant), ou null.
  readonly paymentError = signal<string | null>(null);

  // Le bouton "Payer" est désactivé si la note est vide ou si un paiement est en cours.
  canPay(): boolean {
    return this.noteService.noteLines().length > 0 && !this.isPaying();
  }

  pay(): void {
    // On efface les messages précédents, et on désactive le bouton pendant la requête.
    this.paidOrder.set(null);
    this.paymentError.set(null);
    this.isPaying.set(true);

    const request = this.noteService.toOrderRequest();

    this.orderService.pay(request).subscribe({
      next: (order) => {
        this.isPaying.set(false);
        this.paidOrder.set(order);
        this.noteService.clear();
        // Les stocks et les totaux ont changé côté serveur : on recharge tout.
        this.loadProducts();
        this.loadDailyTotals();
      },
      error: (err: HttpErrorResponse) => {
        this.isPaying.set(false);
        // err.error.message = le message renvoyé par le serveur (ex: "Stock insuffisant...").
        this.paymentError.set(err.error?.message ?? 'Erreur lors du paiement');
        // Un 409 signifie que les stocks affichés sont périmés : on les recharge aussi.
        this.loadProducts();
      },
    });
  }
}
