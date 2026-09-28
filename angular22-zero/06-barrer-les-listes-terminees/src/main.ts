// Point d'entrée de l'application : c'est le premier fichier exécuté par le navigateur.
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Démarre Angular avec le composant racine (App) et la configuration (appConfig).
// En cas d'erreur au démarrage, elle s'affiche dans la console du navigateur (touche F12).
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
