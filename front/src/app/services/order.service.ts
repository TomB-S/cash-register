import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { API_URL } from '../api';
import { DailyTotal, Order, OrderRequest } from '../models';

// Service = 1 seule instance pour toute l'app, injectable partout.
@Injectable({ providedIn: 'root' })
export class OrderService {
  // Pour appeler l'API.
  private readonly http = inject(HttpClient);

  // POST /api/orders : paie une note. Pas de .pipe() ici, rien à faire de la
  // réponse avant qu'elle n'arrive à CaissePage (qui fera .subscribe()).
  pay(request: OrderRequest) {
    return this.http.post<Order>(`${API_URL}/orders`, request);
  }

  // GET /api/orders/daily-totals : le total encaissé pour chaque jour.
  getDailyTotals() {
    return this.http.get<DailyTotal[]>(`${API_URL}/orders/daily-totals`);
  }
}
