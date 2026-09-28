import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';
import { CaissePage } from './caisse/caisse-page/caisse-page';
import { LoginPage } from './login/login-page/login-page';

export const routes: Routes = [
  // /login : accessible à tous, pas de guard.
  { path: 'login', component: LoginPage },
  // /caisse : canActivate = liste de guards à passer avant d'y accéder.
  // authGuard redirige vers /login si pas connecté.
  { path: 'caisse', component: CaissePage, canActivate: [authGuard] },
  // URL vide (site racine) : on renvoie vers /caisse (qui redirigera
  // elle-même vers /login si besoin, grâce au guard).
  { path: '', redirectTo: 'caisse', pathMatch: 'full' },
  // Toute URL inconnue : même redirection. Doit rester en dernier.
  { path: '**', redirectTo: 'caisse' },
];
