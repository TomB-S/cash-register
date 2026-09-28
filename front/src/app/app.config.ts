import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth/auth.interceptor';
import { routes } from './app.routes';

// Formats français pour les pipes date / currency ("28 septembre", "8,50 €")
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'fr' },
    // withInterceptors : liste des intercepteurs passés à CHAQUE requête HTTP.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
