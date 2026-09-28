import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Task, TodoList } from './todo';

/**
 * Le « magasin » (store) des listes : il garde les données et regroupe toutes les façons
 * de les modifier.
 *
 * À cette étape, on change de façon de dialoguer avec le serveur :
 * - étapes 08 et 09 : une requête par action (créer, cocher, supprimer…), et l'affichage
 *   attendait la réponse du serveur pour changer ;
 * - étape 10 : chaque action modifie d'abord les listes ICI, dans le navigateur, tout de suite
 *   (comme à l'étape 07) ; puis TOUTES les listes sont envoyées au serveur d'un seul coup.
 *   C'est la SYNCHRONISATION.
 *
 * Une seule adresse sert désormais : /api/sync. Sans compte (mode test), le serveur y répond
 * avec les « valeurs de départ » (GET) et accepte ce qu'on lui envoie sans le conserver (PUT).
 * L'étape 11 ajoutera des comptes, pour lesquels le serveur enregistrera vraiment les listes.
 */
@Injectable({ providedIn: 'root' })
export class TodoStore {
  /** Le service d'Angular qui envoie des requêtes HTTP (activé dans app.config.ts). */
  private readonly http = inject(HttpClient);

  /*
   * L'état du service : des signaux modifiables, privés, chacun accompagné de sa version en
   * lecture seule pour les composants.
   */

  /** Les listes. Au départ, le tableau est vide : elles arrivent quand le serveur a répondu. */
  private readonly writableLists = signal<TodoList[]>([]);
  readonly lists = this.writableLists.asReadonly();

  /** Vrai pendant le chargement des listes : App affiche alors « Chargement… ». */
  private readonly writableLoading = signal(false);
  readonly loading = this.writableLoading.asReadonly();

  /** Vrai pendant l'envoi des listes au serveur : App affiche alors « Envoi… ». */
  private readonly writableSaving = signal(false);
  readonly saving = this.writableSaving.asReadonly();

  /** Le message d'erreur à afficher, ou null quand tout va bien. */
  private readonly writableError = signal<string | null>(null);
  readonly error = this.writableError.asReadonly();

  /*
   * Trois simples variables, et non des signaux : elles servent au fonctionnement interne du
   * service et ne sont jamais affichées.
   */

  /** Vrai une fois les listes reçues du serveur. Avant, surtout ne rien envoyer (voir sync). */
  private loaded = false;

  /** Vrai pendant qu'une requête d'envoi est en route. */
  private sending = false;

  /** Vrai si les listes ont encore changé pendant cet envoi : il faudra les renvoyer. */
  private changedWhileSending = false;

  /** Le constructeur s'exécute à la création du service : on en profite pour charger les listes. */
  constructor() {
    this.load();
  }

  /** Demande au serveur toutes les listes : GET /api/sync. */
  load(): void {
    // Pendant le chargement, on n'envoie rien : les listes affichées vont être remplacées.
    this.loaded = false;
    this.changedWhileSending = false;
    this.writableLoading.set(true);
    this.writableError.set(null);
    this.http.get<TodoList[]>('/api/sync').subscribe({
      next: (lists) => {
        this.writableLists.set(lists);
        this.loaded = true;
        this.writableLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.showError(error);
        this.writableLoading.set(false);
      },
    });
  }

  /**
   * Réessaie ce qui a échoué (bouton du bandeau d'erreur) : le chargement si les listes n'ont
   * jamais été reçues, sinon l'envoi.
   */
  retry(): void {
    if (this.loaded) {
      this.sync();
    } else {
      this.load();
    }
  }

  /*
   * Les actions : chacune modifie les listes dans le navigateur, puis appelle sync() pour
   * envoyer le nouvel état au serveur. L'affichage change donc tout de suite, sans attendre.
   *
   * Règle d'or avec les signaux : on ne modifie jamais un objet déjà rangé dans le signal.
   * On fabrique une copie modifiée et on la range à la place.
   */

  /** Crée une liste vide portant ce nom. */
  createList(name: string): void {
    const list: TodoList = { id: this.newId(), name: name, tasks: [] };
    this.writableLists.update((lists) => [...lists, list]);
    this.sync();
  }

  /** Supprime une liste et toutes ses tâches. */
  deleteList(list: TodoList): void {
    this.writableLists.update((lists) => lists.filter((current) => current.id !== list.id));
    this.sync();
  }

  /** Ajoute à une liste une tâche, non réalisée. */
  addTask(list: TodoList, title: string): void {
    const task: Task = { id: this.newId(), title: title, done: false };
    this.updateTasks(list, (tasks) => [...tasks, task]);
    this.sync();
  }

  /** Coche la tâche si elle ne l'était pas, et inversement. */
  toggleTask(list: TodoList, task: Task): void {
    this.updateTasks(list, (tasks) =>
      tasks.map((current) =>
        current.id === task.id ? { ...current, done: !current.done } : current,
      ),
    );
    this.sync();
  }

  /** Supprime une tâche de sa liste. */
  deleteTask(list: TodoList, task: Task): void {
    this.updateTasks(list, (tasks) => tasks.filter((current) => current.id !== task.id));
    this.sync();
  }

  /** Fait disparaître le message d'erreur (bouton ✕ du bandeau). */
  clearError(): void {
    this.writableError.set(null);
  }

  /**
   * Envoie TOUTES les listes au serveur : PUT /api/sync, avec le tableau des listes en corps.
   *
   * Une seule requête d'envoi à la fois. Si les listes changent pendant un envoi, on ne lance
   * pas une deuxième requête tout de suite : on note qu'il faudra renvoyer, et on le fait à la
   * fin de l'envoi en cours, avec l'état le plus récent. Le serveur reçoit ainsi les envois
   * dans l'ordre, et le dernier arrivé est toujours le plus à jour.
   */
  private sync(): void {
    // Tant que les listes n'ont pas été reçues du serveur, on n'envoie rien : on risquerait
    // de remplacer, côté serveur, les vraies listes par un tableau vide ou incomplet.
    if (!this.loaded) {
      return;
    }
    if (this.sending) {
      this.changedWhileSending = true;
      return;
    }
    this.sending = true;
    this.writableSaving.set(true);
    this.http.put('/api/sync', this.writableLists()).subscribe({
      next: () => {
        // Le serveur a bien reçu nos listes : une éventuelle erreur précédente n'a plus lieu d'être.
        this.writableError.set(null);
        this.sendFinished();
      },
      error: (error: HttpErrorResponse) => {
        this.showError(error);
        this.sendFinished();
      },
    });
  }

  /** Appelé à la fin d'un envoi, réussi ou non : renvoie si les listes ont changé entre-temps. */
  private sendFinished(): void {
    this.sending = false;
    if (this.changedWhileSending) {
      this.changedWhileSending = false;
      this.sync();
    } else {
      this.writableSaving.set(false);
    }
  }

  /**
   * Un numéro pour une nouvelle liste ou tâche : le plus grand numéro déjà utilisé, plus 1.
   * Comme on crée maintenant les listes sans attendre le serveur, c'est au navigateur de
   * choisir les numéros.
   */
  private newId(): number {
    // flatMap fabrique un seul tableau avec, pour chaque liste, son numéro et ceux de ses tâches.
    const ids = this.writableLists().flatMap((list) => [
      list.id,
      ...list.tasks.map((task) => task.id),
    ]);
    // Math.max(0, ...ids) : le plus grand des nombres, ou 0 s'il n'y a encore aucune liste.
    return Math.max(0, ...ids) + 1;
  }

  /**
   * Transforme une erreur HTTP en message compréhensible, rangé dans le signal error.
   *
   * error.error contient le corps de la réponse. Quand le serveur Java refuse une requête, il
   * explique pourquoi en JSON : {"error": "…"}. On affiche alors son message. Sinon, c'est que
   * le serveur n'a pas pu répondre du tout (arrêté, par exemple) : on le dit.
   */
  private showError(error: HttpErrorResponse): void {
    const serverMessage = error.error?.error;
    if (typeof serverMessage === 'string') {
      this.writableError.set(serverMessage);
    } else {
      this.writableError.set('Impossible de joindre le serveur. Est-il bien lancé ?');
    }
    // Le détail technique reste disponible dans la console du navigateur (F12).
    console.error(error);
  }

  /**
   * Modifie les tâches d'une liste, un peu comme update, mais pour une seule liste.
   *
   * change est une fonction : elle reçoit les tâches actuelles de la liste et renvoie le
   * nouveau tableau de tâches. On part toujours des tâches actuelles du signal, et non de
   * list.tasks : l'objet list reçu du gabarit peut dater d'avant un autre changement.
   */
  private updateTasks(list: TodoList, change: (tasks: Task[]) => Task[]): void {
    this.writableLists.update((lists) =>
      lists.map((current) =>
        current.id === list.id ? { ...current, tasks: change(current.tasks) } : current,
      ),
    );
  }
}
