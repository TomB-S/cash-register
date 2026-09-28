import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TodoList } from '../todo';

/**
 * Affiche UNE liste de tâches, sous forme de carte, avec un formulaire pour lui ajouter
 * une tâche.
 *
 * Ce composant ne modifie pas les données lui-même :
 * - il les reçoit de son parent (App) par une « entrée » (input) ;
 * - il prévient son parent par des « sorties » (output) quand on agit.
 * C'est le parent qui décide quoi faire. ListCard ne s'occupe que de l'affichage.
 */
@Component({
  selector: 'app-list-card',
  // FormsModule : pour [(ngModel)] et (ngSubmit) dans le gabarit.
  imports: [FormsModule],
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

  /** Sortie : demande au parent d'ajouter une tâche ; elle envoie le titre saisi. */
  readonly addTask = output<string>();

  /**
   * Sortie : prévient le parent qu'il faut cocher ou décocher une tâche.
   * Le parent l'écoute avec (toggleTask)="…" ; la tâche envoyée s'appelle alors $event.
   */
  readonly toggleTask = output<Task>();

  /** Sortie : prévient le parent qu'il faut supprimer une tâche. */
  readonly deleteTask = output<Task>();

  /** Sortie : prévient le parent qu'il faut supprimer la liste. Elle n'envoie rien (void). */
  readonly deleteList = output<void>();

  /**
   * Le texte tapé dans le champ « Nouvelle tâche ». Chaque carte est un exemplaire distinct
   * du composant : chacune a donc son propre champ et son propre signal.
   */
  protected readonly newTaskTitle = signal('');

  /** Appelé à l'envoi du formulaire : transmet le titre au parent, puis vide le champ. */
  protected submitTask(): void {
    const title = this.newTaskTitle().trim();
    if (!title) {
      return;
    }
    this.addTask.emit(title);
    this.newTaskTitle.set('');
  }
}
