import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Task, TodoList } from './todo';

/**
 * Le « magasin » (store) des listes : il garde les données et regroupe toutes les façons
 * de les modifier.
 *
 * C'est un SERVICE : une classe dont Angular crée un seul exemplaire, partagé par tous
 * les composants qui le demandent avec inject(TodoStore).
 *
 * Les données sont conservées par le serveur Java (dossier serveur/ à la racine du cours),
 * dans sa base de données. Chaque méthode :
 * 1. envoie une requête HTTP au serveur ;
 * 2. puis, quand la réponse arrive, met à jour le signal avec ce que le serveur a renvoyé ;
 * 3. ou, si la requête échoue, range un message dans le signal error.
 *
 * Les adresses commencent par /api : pendant le développement, le serveur d'Angular les
 * transmet au serveur Java (voir proxy.conf.json).
 */
@Injectable({ providedIn: 'root' })
export class TodoStore {
  /** Le service d'Angular qui envoie des requêtes HTTP (activé dans app.config.ts). */
  private readonly http = inject(HttpClient);

  /*
   * L'état du service : trois signaux modifiables, privés, chacun accompagné de sa version
   * en lecture seule pour les composants.
   */

  /** Les listes. Au départ, le tableau est vide : elles arrivent quand le serveur a répondu. */
  private readonly writableLists = signal<TodoList[]>([]);
  readonly lists = this.writableLists.asReadonly();

  /** Vrai pendant le chargement des listes : App affiche alors « Chargement… ». */
  private readonly writableLoading = signal(false);
  readonly loading = this.writableLoading.asReadonly();

  /**
   * Le message d'erreur à afficher, ou null quand tout va bien.
   * string | null se lit « une chaîne de caractères, ou bien null ».
   */
  private readonly writableError = signal<string | null>(null);
  readonly error = this.writableError.asReadonly();

  /** Le constructeur s'exécute à la création du service : on en profite pour charger les listes. */
  constructor() {
    this.load();
  }

  /*
   * Comment lire une requête HTTP avec HttpClient :
   *
   *   this.http.get<TodoList[]>('/api/lists').subscribe({
   *     next: (lists) => { … },   // si tout va bien, avec la réponse du serveur
   *     error: (error) => { … },  // si la requête échoue, à la place de next
   *   });
   *
   * La requête met un peu de temps : le code ne l'attend pas et continue. L'une des deux
   * fonctions, next ou error, sera appelée plus tard, à l'arrivée de la réponse.
   *
   * Règle d'or avec les signaux : on ne modifie jamais un objet déjà rangé dans le signal.
   * On fabrique une copie modifiée et on la range à la place.
   */

  /** Demande au serveur toutes les listes, avec leurs tâches. */
  load(): void {
    this.writableLoading.set(true);
    this.writableError.set(null);
    // GET /api/lists → réponse : le tableau de toutes les listes.
    this.http.get<TodoList[]>('/api/lists').subscribe({
      next: (lists) => {
        this.writableLists.set(lists);
        this.writableLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.showError(error);
        this.writableLoading.set(false);
      },
    });
  }

  /** Crée une liste vide portant ce nom. */
  createList(name: string): void {
    // POST /api/lists, avec le corps {"name": "…"} → réponse : la liste créée, avec le
    // numéro que la base de données lui a attribué.
    this.http.post<TodoList>('/api/lists', { name: name }).subscribe({
      next: (list) => this.writableLists.update((lists) => [...lists, list]),
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  /** Supprime une liste et toutes ses tâches. */
  deleteList(list: TodoList): void {
    // DELETE /api/lists/3 → réponse vide (code 204) : c'est fait, il n'y a rien à renvoyer.
    this.http.delete(`/api/lists/${list.id}`).subscribe({
      next: () =>
        this.writableLists.update((lists) => lists.filter((current) => current.id !== list.id)),
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  /** Ajoute à une liste une tâche, non réalisée. */
  addTask(list: TodoList, title: string): void {
    // POST /api/lists/3/tasks, avec {"title": "…"} → réponse : la tâche créée, avec son numéro.
    this.http.post<Task>(`/api/lists/${list.id}/tasks`, { title: title }).subscribe({
      next: (task) => this.updateTasks(list, (tasks) => [...tasks, task]),
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  /** Coche la tâche si elle ne l'était pas, et inversement. */
  toggleTask(list: TodoList, task: Task): void {
    // PATCH /api/tasks/5, avec {"done": true} → réponse : la tâche modifiée.
    this.http.patch<Task>(`/api/tasks/${task.id}`, { done: !task.done }).subscribe({
      // On remplace l'ancienne tâche par celle renvoyée par le serveur.
      next: (changed) =>
        this.updateTasks(list, (tasks) =>
          tasks.map((current) => (current.id === changed.id ? changed : current)),
        ),
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  /** Supprime une tâche de sa liste. */
  deleteTask(list: TodoList, task: Task): void {
    // DELETE /api/tasks/5 → réponse vide (code 204).
    this.http.delete(`/api/tasks/${task.id}`).subscribe({
      next: () =>
        this.updateTasks(list, (tasks) => tasks.filter((current) => current.id !== task.id)),
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  /** Fait disparaître le message d'erreur (bouton ✕ du bandeau). */
  clearError(): void {
    this.writableError.set(null);
  }

  /**
   * Transforme une erreur HTTP en message compréhensible, rangé dans le signal error.
   *
   * error.error contient le corps de la réponse. Quand le serveur Java refuse une requête
   * (liste introuvable, nom vide…), il explique pourquoi en JSON : {"error": "…"}. On affiche
   * alors son message. Sinon, c'est que le serveur n'a pas pu répondre du tout (arrêté, par
   * exemple) : on le dit.
   */
  private showError(error: HttpErrorResponse): void {
    // ?. : si error.error est absent (null), on n'essaie pas de lire .error dedans.
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
   * nouveau tableau de tâches. Son type, (tasks: Task[]) => Task[], se lit « une fonction qui
   * reçoit un tableau de Task et renvoie un tableau de Task ».
   *
   * On part toujours des tâches actuelles du signal, et non de list.tasks. C'est encore plus
   * important avec un serveur : entre l'envoi de la requête et l'arrivée de la réponse,
   * d'autres changements ont pu avoir lieu, qu'on effacerait sans le vouloir.
   */
  private updateTasks(list: TodoList, change: (tasks: Task[]) => Task[]): void {
    this.writableLists.update((lists) =>
      lists.map((current) =>
        // La liste concernée est remplacée par une copie, avec ses nouvelles tâches ;
        // les autres listes sont gardées telles quelles.
        current.id === list.id ? { ...current, tasks: change(current.tasks) } : current,
      ),
    );
  }
}
