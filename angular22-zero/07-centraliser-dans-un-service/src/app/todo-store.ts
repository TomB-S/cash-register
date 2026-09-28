import { Injectable, signal } from '@angular/core';
import { Task, TodoList } from './todo';

/**
 * Le « magasin » (store) des listes : il garde les données et regroupe toutes les façons
 * de les modifier.
 *
 * C'est un SERVICE : une classe dont Angular crée un seul exemplaire, partagé par tous
 * les composants qui le demandent avec inject(TodoStore).
 *
 * Jusqu'à l'étape 06, ce travail était fait par le composant App. En le déplaçant ici :
 * - les composants ne s'occupent plus que de l'affichage ;
 * - à l'étape suivante, on branchera le serveur en ne modifiant (presque) que ce fichier.
 */
// providedIn: 'root' : le service est disponible dans toute l'application, sans rien déclarer.
@Injectable({ providedIn: 'root' })
export class TodoStore {
  /**
   * Les listes, dans un signal modifiable. « private » : seul ce service peut y toucher.
   * Pour l'instant, elles sont écrites directement dans le code ; elles viendront du
   * serveur à l'étape 08.
   */
  private readonly writableLists = signal<TodoList[]>([
    {
      id: 1,
      name: 'Courses',
      tasks: [
        { id: 1, title: 'Pain', done: true },
        { id: 2, title: 'Lait', done: false },
        { id: 3, title: 'Pommes', done: false },
      ],
    },
    {
      id: 2,
      name: 'Préparer les vacances',
      tasks: [
        { id: 4, title: 'Réserver le train', done: true },
        { id: 5, title: 'Faire la valise', done: false },
      ],
    },
    {
      id: 3,
      name: 'Découvrir Angular',
      tasks: [
        { id: 6, title: 'Installer Node.js', done: true },
        { id: 7, title: 'Créer le projet', done: true },
      ],
    },
    {
      id: 4,
      name: 'Idées de cadeaux',
      tasks: [],
    },
  ]);

  /**
   * Les mêmes listes, en lecture seule, pour les composants : ils peuvent les lire avec
   * lists(), mais n'ont ni set ni update. Toute modification passe par les méthodes
   * ci-dessous : il n'y a qu'un seul endroit où chercher qui change les données.
   */
  readonly lists = this.writableLists.asReadonly();

  /**
   * Numéro à donner à la prochaine liste ou tâche créée. On part de 100 pour ne pas
   * retomber sur un numéro déjà utilisé ci-dessus. À l'étape 08, c'est le serveur (sa base
   * de données) qui attribuera les numéros.
   */
  private nextId = 100;

  /*
   * Règle d'or avec les signaux : on ne modifie jamais un objet déjà rangé dans le signal.
   * On fabrique une copie modifiée et on la range à la place. Le signal voit alors une
   * nouvelle valeur et prévient Angular, qui redessine ce qui a changé.
   */

  /** Crée une liste vide portant ce nom. */
  createList(name: string): void {
    // nextId++ : utilise la valeur de nextId, puis l'augmente de 1 pour la prochaine fois.
    const list: TodoList = { id: this.nextId++, name: name, tasks: [] };
    // [...lists, list] : un nouveau tableau avec toutes les listes, plus la nouvelle à la fin.
    this.writableLists.update((lists) => [...lists, list]);
  }

  /** Supprime une liste et toutes ses tâches. */
  deleteList(list: TodoList): void {
    // Toutes les listes sauf celle-ci.
    this.writableLists.update((lists) => lists.filter((current) => current.id !== list.id));
  }

  /** Ajoute à une liste une tâche, non réalisée. */
  addTask(list: TodoList, title: string): void {
    const task: Task = { id: this.nextId++, title: title, done: false };
    // Toutes les tâches actuelles, plus la nouvelle à la fin.
    this.updateTasks(list, (tasks) => [...tasks, task]);
  }

  /** Coche la tâche si elle ne l'était pas, et inversement. */
  toggleTask(list: TodoList, task: Task): void {
    this.updateTasks(list, (tasks) =>
      // map fabrique un nouveau tableau, élément par élément :
      // - la tâche cliquée est remplacée par une copie ({ ...current } recopie toutes ses
      //   propriétés) dans laquelle done prend la valeur inverse (! veut dire « non ») ;
      // - les autres tâches sont gardées telles quelles.
      tasks.map((current) =>
        current.id === task.id ? { ...current, done: !current.done } : current,
      ),
    );
  }

  /** Supprime une tâche de sa liste. */
  deleteTask(list: TodoList, task: Task): void {
    // filter garde toutes les tâches sauf celle à supprimer.
    this.updateTasks(list, (tasks) => tasks.filter((current) => current.id !== task.id));
  }

  /**
   * Modifie les tâches d'une liste, un peu comme update, mais pour une seule liste.
   *
   * change est une fonction : elle reçoit les tâches actuelles de la liste et renvoie le
   * nouveau tableau de tâches. Son type, (tasks: Task[]) => Task[], se lit « une fonction qui
   * reçoit un tableau de Task et renvoie un tableau de Task ».
   *
   * On part toujours des tâches actuelles du signal, et non de list.tasks : l'objet list reçu
   * du gabarit peut dater d'avant un autre changement, qu'on effacerait sans le vouloir.
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
