import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { authInterceptor } from './auth-interceptor';

// Configuration globale de l'application. Chaque « provider » (fournisseur) ajoute une
// fonctionnalité à Angular.
export const appConfig: ApplicationConfig = {
  providers: [
    // Affiche dans la console du navigateur les erreurs que personne n'a traitées.
    provideBrowserGlobalErrorListeners(),
    // Rend disponible HttpClient, le service d'Angular qui envoie des requêtes HTTP.
    // withInterceptors : chaque requête passe par authInterceptor, qui y ajoute le jeton.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
