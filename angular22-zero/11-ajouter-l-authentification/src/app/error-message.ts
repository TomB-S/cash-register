import { HttpErrorResponse } from '@angular/common/http';

/**
 * Transforme une erreur HTTP en message compréhensible pour l'utilisateur.
 *
 * error.error contient le corps de la réponse. Quand le serveur Java refuse une requête
 * (mot de passe incorrect, nom vide…), il explique pourquoi en JSON : {"error": "…"}. On renvoie
 * alors son message. Sinon, c'est que le serveur n'a pas pu répondre du tout (arrêté, par exemple).
 *
 * Jusqu'à l'étape 10, ce code était dans une méthode privée de TodoStore. Le panneau du compte
 * en a besoin lui aussi : on l'a sorti dans une fonction, dans son propre fichier, pour la partager.
 */
export function errorMessage(error: HttpErrorResponse): string {
  // ?. : si error.error est absent (null), on n'essaie pas de lire .error dedans.
  const serverMessage = error.error?.error;
  if (typeof serverMessage === 'string') {
    return serverMessage;
  }
  return 'Impossible de joindre le serveur. Est-il bien lancé ?';
}
