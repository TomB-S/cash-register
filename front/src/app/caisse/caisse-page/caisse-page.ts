import { Component, inject, signal } from '@angular/core';
import { CatalogService } from '../../services/catalog.service';
import { NoteService } from '../../services/note.service';
import { Product, CATEGORIES, Category } from '../../models';
import { ProductCard } from '../product-card/product-card';
import { NotePanel } from '../note-panel/note-panel';

@Component({
  imports: [ProductCard, NotePanel],
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
}
