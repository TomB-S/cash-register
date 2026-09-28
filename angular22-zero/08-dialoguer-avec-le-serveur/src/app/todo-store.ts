import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Task, TodoList } from './todo';

/**
 * Le « magasin » (store) des listes : il garde les données et regroupe toutes les façons
 * de les modifier.
 *
 * C'est un SERVICE : une classe dont Angular crée un seul exemplaire, partagé par tous
 * les composants qui le demandent avec inject(TodoStore).
 *
 * Depuis cette étape, les données sont conservées par le serveur Java (dossier serveur/ à la
 * racine du cours), dans sa base de données. Chaque méthode :
 * 1. envoie une requête HTTP au serveur ;
 * 2. puis, quand la réponse arrive, met à jour le signal avec ce que le serveur a renvoyé.
 * Le signal n'est donc qu'une copie, dans le navigateur, de ce que contient le serveur.
 *
 * Les adresses commencent par /api : pendant le développement, le serveur d'Angular les
 * transmet au serveur Java (voir proxy.conf.json).
 */
@Injectable({ providedIn: 'root' })
export class TodoStore {
  /** Le service d'Angular qui envoie des requêtes HTTP (activé dans app.config.ts). */
  private readonly http = inject(HttpClient);

  /**
   * Les listes, dans un signal modifiable. « private » : seul ce service peut y toucher.
   * Au départ, le tableau est vide : les listes arrivent quand le serveur a répondu.
   */
  private readonly writableLists = signal<TodoList[]>([]);

  /**
   * Les mêmes listes, en lecture seule, pour les composants : ils peuvent les lire avec
   * lists(), mais n'ont ni set ni update. Toute modification passe par les méthodes
   * ci-dessous : il n'y a qu'un seul endroit où chercher qui change les données.
   */
  readonly lists = this.writableLists.asReadonly();

  /** Le constructeur s'exécute à la création du service : on en profite pour charger les listes. */
  constructor() {
    this.load();
  }

  /*
   * Comment lire une requête HTTP avec HttpClient :
   *
   *   this.http.get<TodoList[]>('/api/lists').subscribe((lists) => { … });
   *
   * - get, post, patch, delete : la méthode HTTP, c'est-à-dire ce qu'on demande au serveur ;
   * - '/api/lists' : l'adresse ;
   * - <TodoList[]> : ce que le serveur renverra (du JSON, converti en objets JavaScript) ;
   * - subscribe((lists) => { … }) : ce qu'il faudra faire QUAND la réponse arrivera.
   *
   * La requête met un peu de temps : le code ne l'attend pas et continue. La fonction passée
   * à subscribe sera appelée plus tard, à l'arrivée de la réponse. Sans subscribe, la
   * requête ne part même pas.
   *
   * Règle d'or avec les signaux : on ne modifie jamais un objet déjà rangé dans le signal.
   * On fabrique une copie modifiée et on la range à la place.
   */

  /** Demande au serveur toutes les listes, avec leurs tâches. */
  load(): void {
    // GET /api/lists → réponse : le tableau de toutes les listes.
    this.http.get<TodoList[]>('/api/lists').subscribe((lists) => {
      this.writableLists.set(lists);
    });
  }

  /** Crée une liste vide portant ce nom. */
  createList(name: string): void {
    // POST /api/lists, avec le corps {"name": "…"} → réponse : la liste créée, avec le
    // numéro que la base de données lui a attribué.
    this.http.post<TodoList>('/api/lists', { name: name }).subscribe((list) => {
      this.writableLists.update((lists) => [...lists, list]);
    });
  }

  /** Supprime une liste et toutes ses tâches. */
  deleteList(list: TodoList): void {
    // DELETE /api/lists/3 → réponse vide (code 204) : c'est fait, il n'y a rien à renvoyer.
    // `…${list.id}…` : une chaîne « gabarit » (entre accents graves), où ${…} insère une valeur.
    this.http.delete(`/api/lists/${list.id}`).subscribe(() => {
      this.writableLists.update((lists) => lists.filter((current) => current.id !== list.id));
    });
  }

  /** Ajoute à une liste une tâche, non réalisée. */
  addTask(list: TodoList, title: string): void {
    // POST /api/lists/3/tasks, avec {"title": "…"} → réponse : la tâche créée, avec son numéro.
    this.http.post<Task>(`/api/lists/${list.id}/tasks`, { title: title }).subscribe((task) => {
      this.updateTasks(list, (tasks) => [...tasks, task]);
    });
  }

  /** Coche la tâche si elle ne l'était pas, et inversement. */
  toggleTask(list: TodoList, task: Task): void {
    // PATCH /api/tasks/5, avec {"done": true} → réponse : la tâche modifiée.
    // PATCH veut dire « modifie seulement les champs envoyés ».
    this.http.patch<Task>(`/api/tasks/${task.id}`, { done: !task.done }).subscribe((changed) => {
      // On remplace l'ancienne tâche par celle renvoyée par le serveur.
      this.updateTasks(list, (tasks) =>
        tasks.map((current) => (current.id === changed.id ? changed : current)),
      );
    });
  }

  /** Supprime une tâche de sa liste. */
  deleteTask(list: TodoList, task: Task): void {
    // DELETE /api/tasks/5 → réponse vide (code 204).
    this.http.delete(`/api/tasks/${task.id}`).subscribe(() => {
      this.updateTasks(list, (tasks) => tasks.filter((current) => current.id !== task.id));
    });
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
