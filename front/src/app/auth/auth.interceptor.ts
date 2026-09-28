import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

// HttpInterceptorFn : fonction appelée pour CHAQUE requête HTTP sortante.
// req = la requête d'origine, next(req) = la fait continuer (vers le serveur ou l'intercepteur suivant).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Une requête est immuable : on ne peut pas la modifier, on en clone une nouvelle
  // avec l'en-tête Authorization en plus (seulement si on a un jeton).
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    // catchError : intercepte une erreur qui remonte (ici, une réponse HTTP en échec).
    catchError((err: HttpErrorResponse) => {
      const isLoginRequest = req.url.endsWith('/auth/login');

      if (err.status === 401 && !isLoginRequest) {
        authService.clearToken();
        router.navigate(['/login']);
      }

      // On propage quand même l'erreur : LoginPage doit encore recevoir SON 401
      // pour afficher son propre message.
      return throwError(() => err);
    }),
  );
};
