import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

// Configuration globale de l'application. Chaque « provider » (fournisseur) ajoute une
// fonctionnalité à Angular ; on en ajoutera un à l'étape 08 pour parler au serveur.
export const appConfig: ApplicationConfig = {
  providers: [
    // Affiche dans la console du navigateur les erreurs que personne n'a traitées.
    provideBrowserGlobalErrorListeners(),
  ],
};
