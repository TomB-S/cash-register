import { Component, signal } from '@angular/core';
import { TodoList } from './todo';

/**
 * Le composant racine de l'application.
 *
 * Un composant, c'est :
 * - une classe TypeScript (ici App) : les données et le comportement ;
 * - un gabarit HTML (app.html) : ce qui s'affiche ;
 * - une feuille de style (app.css) : l'apparence.
 * Le décorateur @Component, juste au-dessus de la classe, relie les trois.
 */
@Component({
  selector: 'app-root',
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
   * l'appelant comme une fonction : lists(). Quand on changera son contenu (étape 03),
   * Angular mettra l'affichage à jour tout seul.
   *
   * <TodoList[]> précise ce que contient la boîte : un tableau de TodoList.
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
}
