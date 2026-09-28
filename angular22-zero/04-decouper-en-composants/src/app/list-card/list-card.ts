import { Component, input, output } from '@angular/core';
import { Task, TodoList } from '../todo';

/**
 * Affiche UNE liste de tâches, sous forme de carte.
 *
 * Ce composant ne modifie pas les données lui-même :
 * - il les reçoit de son parent (App) par une « entrée » (input) ;
 * - il prévient son parent par des « sorties » (output) quand on clique.
 * C'est le parent qui décide quoi faire. ListCard ne s'occupe que de l'affichage.
 */
@Component({
  // Le parent affiche ce composant avec la balise <app-list-card>.
  selector: 'app-list-card',
  templateUrl: './list-card.html',
  styleUrl: './list-card.css',
})
export class ListCard {
  /**
   * Entrée : la liste à afficher. Le parent la fournit avec [list]="…".
   * input.required : le parent est obligé de la fournir, sinon Angular affiche une erreur.
   * Comme un signal, une entrée se lit en l'appelant : list().
   */
  readonly list = input.required<TodoList>();

  /**
   * Sortie : prévient le parent qu'il faut cocher ou décocher une tâche.
   * Le parent l'écoute avec (toggleTask)="…" ; la tâche envoyée s'appelle alors $event.
   */
  readonly toggleTask = output<Task>();

  /** Sortie : prévient le parent qu'il faut supprimer une tâche. */
  readonly deleteTask = output<Task>();

  /** Sortie : prévient le parent qu'il faut supprimer la liste. Elle n'envoie rien (void). */
  readonly deleteList = output<void>();
}
