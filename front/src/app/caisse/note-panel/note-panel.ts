import { Component, inject } from '@angular/core';

import { Product } from '../../models';
import { NoteService } from '../../services/note.service';
import { EurosPipe } from '../../shared/euros.pipe';

@Component({
  imports: [EurosPipe],
  selector: 'app-note-panel',
  styleUrl: './note-panel.css',
  templateUrl: './note-panel.html',
})
export class NotePanel {
  // Pas besoin d'input : NoteService est partagé (providedIn: 'root'),
  // on l'injecte directement comme CatalogService dans CaissePage.
  private readonly noteService = inject(NoteService);

  // Lecture directe des signaux du service (déjà en lecture seule côté service).
  readonly lines = this.noteService.noteLines;
  readonly total = this.noteService.total;

  // Bouton "+" : réutilise addProduct(), comme un clic sur la carte produit.
  increase(product: Product): void {
    this.noteService.addProduct(product);
  }

  // Bouton "−".
  decrease(productId: number): void {
    this.noteService.decreaseQuantity(productId);
  }

  // Bouton suppression.
  remove(productId: number): void {
    this.noteService.removeLine(productId);
  }
}
