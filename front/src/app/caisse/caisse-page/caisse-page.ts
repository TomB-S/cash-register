import { Component, inject, signal } from '@angular/core';
import { CatalogService } from '../../services/catalog.service';
import { Product, CATEGORIES, Category } from '../../models';
import { ProductCard } from '../product-card/product-card';

@Component({
  imports: [ProductCard],
  selector: 'app-caisse-page',
  styleUrl: './caisse-page.css',
  templateUrl: './caisse-page.html',
})
export class CaissePage {
  // --- ETAPE 1 --- Injection et déclaration
  // Pour appeler l'API du catalogue.
  private readonly catalogService = inject(CatalogService);
  // La liste des produits, vide au départ le temps que la requête réponde.
  readonly products = signal<Product[]>([]);

  // --- ETAPE 2 --- Création du constructor
  constructor() {
    // subscribe() déclenche vraiment la requête. Quand la réponse arrive,
    // on remplace le tableau vide par les produits reçus.
    this.catalogService.getProducts().subscribe((products) => {
      this.products.set(products);
    });
  }

  // --- ETAPE 3 ---
  // Les 4 catégories, dans l'ordre d'affichage (avec icône/libellé).
  readonly categories = CATEGORIES;

  // Filtre les produits pour une catégorie donnée, utilisé par le template.
  productsIn(category: Category): Product[] {
    return this.products().filter((p) => p.category === category);
  }

  // --- ETAPE 4 (à venir) ---
  // Reçoit le produit émis par (clicked) sur <app-product-card>.
  // Provisoire : juste un log, ce sera remplacé par "ajouter à la note".
  onProductClicked(product: Product): void {
    console.log('Produit cliqué :', product);
  }
}
