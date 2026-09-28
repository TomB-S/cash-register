import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ListCard } from './list-card/list-card';
import { Task, TodoList } from './todo';

/**
 * Le composant racine de l'application.
 *
 * Il garde les données (le signal lists) et les méthodes qui les modifient.
 * L'affichage de chaque liste est confié au composant ListCard.
 */
@Component({
  selector: 'app-root',
  // Ce que le gabarit utilise : FormsModule pour [(ngModel)] et (ngSubmit),
  // ListCard pour la balise <app-list-card>.
  imports: [FormsModule, ListCard],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = 'Mes listes de tâches';

  /**
   * Les listes à afficher. Pour l'instant, elles sont écrites directement dans le code ;
   * elles viendront du serveur à l'étape 08.
   *
   * signal(...) crée une « boîte » qui contient une valeur. On lit ce qu'elle contient en
   * l'appelant comme une fonction : lists(). Quand on change son contenu, Angular met
   * l'affichage à jour tout seul.
   */
  protected readonly lists = signal<TodoList[]>([
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
   * Le texte tapé dans le champ « Nom de la nouvelle liste ».
   * [(ngModel)] le tient à jour à chaque touche frappée (voir app.html).
   */
  protected readonly newListName = signal('');

  /**
   * Numéro à donner à la prochaine liste ou tâche créée. On part de 100 pour ne pas
   * retomber sur un numéro déjà utilisé ci-dessus. À l'étape 08, c'est le serveur (sa base
   * de données) qui attribuera les numéros.
   */
  private nextId = 100;

  /*
   * Les méthodes ci-dessous sont appelées par le gabarit : à l'envoi du formulaire, ou quand
   * une carte (ListCard) signale une action par l'une de ses sorties.
   *
   * Règle d'or avec les signaux : on ne modifie jamais un objet déjà rangé dans le signal.
   * On fabrique une copie modifiée et on la range à la place. Le signal voit alors une
   * nouvelle valeur et prévient Angular, qui redessine ce qui a changé.
   */

  /** Crée une liste vide portant le nom saisi, puis vide le champ. */
  protected createList(): void {
    // trim() retire les espaces au début et à la fin : « Courses » et « Courses  » sont pareils.
    const name = this.newListName().trim();
    if (!name) {
      return; // rien de saisi : on ne fait rien
    }
    // nextId++ : utilise la valeur de nextId, puis l'augmente de 1 pour la prochaine fois.
    const list: TodoList = { id: this.nextId++, name: name, tasks: [] };
    // [...lists, list] : un nouveau tableau avec toutes les listes, plus la nouvelle à la fin.
    this.lists.update((lists) => [...lists, list]);
    // On vide le champ : grâce à [(ngModel)], l'affichage suit.
    this.newListName.set('');
  }

  /** Supprime une liste et toutes ses tâches, après confirmation. */
  protected deleteList(list: TodoList): void {
    // confirm affiche une boîte de dialogue du navigateur ; il renvoie true si on clique sur OK.
    if (!confirm(`Supprimer la liste « ${list.name} » et toutes ses tâches ?`)) {
      return;
    }
    // update reçoit la valeur actuelle du signal (toutes les listes) et doit renvoyer
    // la nouvelle valeur : toutes les listes sauf celle-ci.
    this.lists.update((lists) => lists.filter((current) => current.id !== list.id));
  }

  /** Ajoute à une liste une tâche, non réalisée, avec le titre saisi dans la carte. */
  protected addTask(list: TodoList, title: string): void {
    const task: Task = { id: this.nextId++, title: title, done: false };
    // Toutes les tâches actuelles, plus la nouvelle à la fin.
    this.updateTasks(list, (tasks) => [...tasks, task]);
  }

  /** Coche la tâche si elle ne l'était pas, et inversement. */
  protected toggleTask(list: TodoList, task: Task): void {
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
  protected deleteTask(list: TodoList, task: Task): void {
    this.updateTasks(list, (tasks) =>
      // filter fabrique un nouveau tableau avec les seuls éléments qui vérifient la condition :
      // ici, toutes les tâches sauf celle à supprimer.
      tasks.filter((current) => current.id !== task.id),
    );
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
    this.lists.update((lists) =>
      lists.map((current) =>
        // La liste concernée est remplacée par une copie, avec ses nouvelles tâches ;
        // les autres listes sont gardées telles quelles.
        current.id === list.id ? { ...current, tasks: change(current.tasks) } : current,
      ),
    );
  }
}
