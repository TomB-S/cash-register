import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountPanel } from './account-panel/account-panel';
import { AuthStore } from './auth-store';
import { ListCard } from './list-card/list-card';
import { TodoList } from './todo';
import { TodoStore } from './todo-store';

/**
 * Le composant racine de l'application.
 *
 * Il affiche le panneau du compte (AccountPanel), le formulaire de création et une carte
 * (ListCard) par liste. Les données et leurs modifications sont confiées au service TodoStore.
 */
@Component({
  selector: 'app-root',
  // Ce que le gabarit utilise : FormsModule pour [(ngModel)] et (ngSubmit),
  // AccountPanel et ListCard pour les balises <app-account-panel> et <app-list-card>.
  imports: [FormsModule, AccountPanel, ListCard],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /**
   * Le service qui détient les listes. inject(TodoStore) demande à Angular l'exemplaire
   * unique du service (Angular le crée au premier appel). Le gabarit l'utilise directement :
   * store.lists(), store.addTask(…), etc.
   */
  protected readonly store = inject(TodoStore);

  /** Le service du compte : le gabarit s'en sert pour dire où vont les listes. */
  protected readonly auth = inject(AuthStore);

  protected readonly title = 'Mes listes de tâches';

  /**
   * Le texte tapé dans le champ « Nom de la nouvelle liste ».
   * [(ngModel)] le tient à jour à chaque touche frappée (voir app.html).
   * Il reste dans le composant : c'est un détail de l'affichage, pas une donnée à partager.
   */
  protected readonly newListName = signal('');

  /** Crée une liste portant le nom saisi, puis vide le champ. */
  protected createList(): void {
    // trim() retire les espaces au début et à la fin : « Courses » et « Courses  » sont pareils.
    const name = this.newListName().trim();
    if (!name) {
      return; // rien de saisi : on ne fait rien
    }
    this.store.createList(name);
    this.newListName.set('');
  }

  /**
   * Supprime une liste, après confirmation. La question posée à l'utilisateur est une
   * affaire d'affichage : elle reste ici. La suppression elle-même est confiée au service.
   */
  protected deleteList(list: TodoList): void {
    // confirm affiche une boîte de dialogue du navigateur ; il renvoie true si on clique sur OK.
    if (confirm(`Supprimer la liste « ${list.name} » et toutes ses tâches ?`)) {
      this.store.deleteList(list);
    }
  }
}
