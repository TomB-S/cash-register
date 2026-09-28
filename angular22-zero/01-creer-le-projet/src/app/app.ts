import { Component } from '@angular/core';

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
  // Nom de la balise qui affiche ce composant : <app-root>, dans src/index.html.
  selector: 'app-root',
  // Fichiers du gabarit et des styles, placés à côté de celui-ci.
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Une propriété de la classe. Le gabarit l'affiche en écrivant {{ title }}.
  // « protected » : utilisable par le gabarit, mais pas par le reste du code.
  // « readonly » : on ne la modifiera pas.
  protected readonly title = 'Mes listes de tâches';
}
