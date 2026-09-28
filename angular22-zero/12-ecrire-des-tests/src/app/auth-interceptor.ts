import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from './auth-store';

/**
 * Un INTERCEPTEUR voit passer toutes les requêtes envoyées avec HttpClient, juste avant leur
 * départ. Il peut les modifier, puis les laisse continuer leur chemin avec next(…).
 *
 * Celui-ci ajoute, quand on est connecté, l'en-tête « Authorization: Bearer <jeton> ». C'est
 * ainsi que le serveur sait à quel compte appartient chaque requête. Grâce à lui, TodoStore n'a
 * rien à changer : ses requêtes vers /api/sync partent avec le jeton sans qu'il s'en occupe.
 *
 * Il est déclaré dans app.config.ts : provideHttpClient(withInterceptors([authInterceptor])).
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthStore).token();
  if (token === null) {
    // Pas connecté : la requête part telle quelle (mode test).
    return next(request);
  }
  // Une requête ne se modifie pas : on en fabrique une copie avec l'en-tête en plus.
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
