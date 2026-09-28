import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

/** Ce que le serveur renvoie quand on se connecte : un jeton, et l'identifiant du compte. */
export interface Session {
  /** Le « badge » à présenter au serveur à chaque requête (voir auth-interceptor.ts). */
  token: string;
  username: string;
}

/** Nom sous lequel la session est rangée dans le navigateur (localStorage). */
const STORAGE_KEY = 'todolist-session';

/**
 * Le service du compte : connexion, déconnexion, création et suppression de compte.
 *
 * Quand on se connecte, le serveur renvoie un JETON : une longue suite de caractères
 * aléatoires, qui prouve qu'on s'est connecté. Le service le garde :
 * - dans un signal, pour l'application ;
 * - dans le localStorage du navigateur, pour rester connecté après un rechargement de la page.
 * L'intercepteur (auth-interceptor.ts) l'ajoute ensuite à chaque requête envoyée au serveur.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient);

  /** La session en cours, ou null si l'on n'est pas connecté. Relue au démarrage. */
  private readonly session = signal<Session | null>(readStoredSession());

  /** L'identifiant du compte connecté, ou null. */
  readonly username = computed(() => this.session()?.username ?? null);

  /** Le jeton de la session, ou null. ?? veut dire « sinon, si c'est absent ». */
  readonly token = computed(() => this.session()?.token ?? null);

  /*
   * login, register et deleteAccount ne s'abonnent pas eux-mêmes à la requête : ils la
   * RENVOIENT (un Observable). C'est le composant qui appelle subscribe, pour savoir quand
   * c'est fini et afficher une éventuelle erreur (mot de passe incorrect…).
   *
   * pipe(tap(…)) glisse une action sur le chemin de la réponse, avant qu'elle n'arrive au
   * composant : ici, garder la session reçue.
   */

  /** Se connecter : POST /api/sessions → réponse : {token, username}. */
  login(username: string, password: string): Observable<Session> {
    return this.http
      .post<Session>('/api/sessions', { username: username, password: password })
      .pipe(tap((session) => this.remember(session)));
  }

  /** Créer un compte : POST /api/accounts. Le serveur y connecte aussitôt, et renvoie une session. */
  register(username: string, password: string): Observable<Session> {
    return this.http
      .post<Session>('/api/accounts', { username: username, password: password })
      .pipe(tap((session) => this.remember(session)));
  }

  /** Supprimer son compte et ses listes : DELETE /api/accounts/me, puis oublier la session. */
  deleteAccount(): Observable<unknown> {
    return this.http.delete('/api/accounts/me').pipe(tap(() => this.forget()));
  }

  /**
   * Se déconnecter : on oublie la session tout de suite, puis on prévient le serveur
   * (DELETE /api/sessions/current) pour qu'il n'accepte plus ce jeton.
   */
  logout(): void {
    const token = this.token();
    this.forget();
    if (token !== null) {
      // La session étant oubliée, l'intercepteur n'ajoutera plus le jeton : on le met nous-mêmes.
      // Si le serveur ne répond pas, tant pis : le jeton expirera de lui-même au bout de 7 jours.
      this.http
        .delete('/api/sessions/current', { headers: { Authorization: `Bearer ${token}` } })
        .subscribe({ error: () => {} });
    }
  }

  /** Oublie la session, dans le signal comme dans le navigateur. */
  forget(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Garde la session, dans le signal et dans le navigateur (en texte JSON). */
  private remember(session: Session): void {
    this.session.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}

/** Relit la session rangée dans le navigateur, s'il y en a une (null sinon). */
function readStoredSession(): Session | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text === null ? null : JSON.parse(text);
  } catch {
    // Texte illisible (modifié à la main ?) : on fait comme s'il n'y avait pas de session.
    return null;
  }
}
