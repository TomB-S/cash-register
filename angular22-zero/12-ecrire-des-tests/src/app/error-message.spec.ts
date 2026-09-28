import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage } from './error-message';

/*
 * Le test le plus simple possible : errorMessage est une fonction ordinaire. On l'appelle avec
 * une valeur choisie, et on vérifie ce qu'elle renvoie. Pas besoin d'Angular ni de serveur.
 *
 * - describe('…', () => { … }) regroupe les tests d'un même sujet ;
 * - it('…', () => { … }) est UN test, dont le nom dit ce qu'on vérifie ;
 * - expect(obtenu).toBe(attendu) fait échouer le test si les deux valeurs diffèrent.
 */
describe('errorMessage', () => {
  it("reprend l'explication envoyée par le serveur", () => {
    // Une fausse erreur, comme celle que HttpClient fabrique quand le serveur répond 404.
    const error = new HttpErrorResponse({ status: 404, error: { error: "La liste 3 n'existe pas." } });

    expect(errorMessage(error)).toBe("La liste 3 n'existe pas.");
  });

  it("dit que le serveur est injoignable quand il n'y a pas d'explication", () => {
    // Serveur arrêté : le proxy d'Angular répond 502, sans corps JSON.
    const error = new HttpErrorResponse({ status: 502, error: null });

    expect(errorMessage(error)).toBe('Impossible de joindre le serveur. Est-il bien lancé ?');
  });
});
