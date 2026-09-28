import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

// Configuration globale de l'application. Chaque « provider » (fournisseur) ajoute une
// fonctionnalité à Angular.
export const appConfig: ApplicationConfig = {
  providers: [
    // Affiche dans la console du navigateur les erreurs que personne n'a traitées.
    provideBrowserGlobalErrorListeners(),
    // Rend disponible HttpClient, le service d'Angular qui envoie des requêtes HTTP.
    // Sans cette ligne, inject(HttpClient) provoquerait une erreur au démarrage.
    provideHttpClient(),
  ],
};
