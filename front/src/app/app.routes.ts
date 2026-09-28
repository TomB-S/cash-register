import { Routes } from '@angular/router';

import { CaissePage } from './caisse/caisse-page/caisse-page';
import { LoginPage } from './login/login-page/login-page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  // TODO étape 2 : protéger cette route avec un guard (canActivate)
  { path: 'caisse', component: CaissePage },
  { path: '', redirectTo: 'caisse', pathMatch: 'full' },
  { path: '**', redirectTo: 'caisse' },
];
