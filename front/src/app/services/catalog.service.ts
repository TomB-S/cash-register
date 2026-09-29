import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_URL } from '../api';
import { Formula, Product } from '../models';

// Service = 1 seule instance pour toute l'app, injectable partout.
@Injectable({ providedIn: 'root' })
export class CatalogService {
  // Pour appeler l'API.
  private readonly http = inject(HttpClient);

  getProducts() {
    // GET, pas de body à envoyer, juste récupérer des données.
    // <Product[]> = la réponse sera un tableau de Product (voir models.ts).
    return this.http.get<Product[]>(`${API_URL}/products`);
  }

  getFormulas() {
    return this.http.get<Formula[]>(`${API_URL}/formulas`);
  }
}
