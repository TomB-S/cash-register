import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';

import { API_URL } from '../api';
import { LoginResponse } from '../models';

// Service = 1 seule instance pour toute l'app, injectable partout.
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Pour appeler l'API.
  private readonly http = inject(HttpClient);

  // Le jeton, ou null si déconnecté. Lu depuis sessionStorage pour survivre à un F5.
  private readonly token = signal<string | null>(sessionStorage.getItem('token'));

  // true si un jeton existe. Se recalcule seul quand token change.
  readonly isLoggedIn = computed(() => this.token() !== null);

  login(login: string, password: string) {
    // POST login. Ne part que quand LoginPage fera .subscribe().
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, { login, password }).pipe(
      // Au retour, on sauvegarde le jeton avant de laisser passer la réponse.
      tap((response) => {
        this.token.set(response.token);
        sessionStorage.setItem('token', response.token);
      }),
    );
  }

  logout(): void {
    // On prévient le serveur, sans attendre ni traiter sa réponse.
    // subscribe() = déclenche vraiment l'envoi de la requête.
    this.http.post(`${API_URL}/auth/logout`, {}).subscribe();

    this.clearToken();
  }

  // Lecture du jeton brut : utile à l'intercepteur, qui doit l'ajouter aux requêtes.
  getToken(): string | null {
    return this.token();
  }

  // Oublie le jeton localement, SANS appeler le serveur.
  clearToken(): void {
    this.token.set(null);
    sessionStorage.removeItem('token');
  }
}
