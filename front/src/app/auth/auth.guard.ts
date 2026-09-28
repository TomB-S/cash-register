import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';
// Guard = function appeller avant d'activer une route pour vérifier si user a les droits

// CanActivateFn : fonction appelée par le routeur avant d'activer une route.
// true = accès autorisé. Un UrlTree (via createUrlTree) = redirection à la place.
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
