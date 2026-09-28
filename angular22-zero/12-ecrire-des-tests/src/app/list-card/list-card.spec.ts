import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task, TodoList } from '../todo';
import { ListCard } from './list-card';

/*
 * Tests d'un composant : Angular l'affiche dans une fausse page (jsdom, un navigateur simulé),
 * puis on regarde le HTML produit et on clique dessus, comme le ferait un utilisateur.
 *
 * - TestBed.createComponent(ListCard) crée le composant et renvoie un « fixture », qui permet
 *   de le piloter ;
 * - fixture.componentRef.setInput('list', …) remplit son entrée, comme [list]="…" ;
 * - await fixture.whenStable() attend qu'Angular ait fini de mettre l'affichage à jour ;
 * - fixture.nativeElement est l'élément HTML du composant, où chercher avec querySelector.
 */
describe('ListCard', () => {
  let fixture: ComponentFixture<ListCard>;
  let element: HTMLElement;

  /** Affiche une carte pour cette liste, et attend la fin de l'affichage. */
  async function show(list: TodoList): Promise<void> {
    fixture = TestBed.createComponent(ListCard);
    fixture.componentRef.setInput('list', list);
    await fixture.whenStable();
    element = fixture.nativeElement;
  }

  /** Vrai si le nom de la liste est barré (classe CSS « done » sur le titre). */
  function nameIsCrossedOut(): boolean {
    return element.querySelector('h2')!.classList.contains('done');
  }

  const pain: Task = { id: 1, title: 'Pain', done: true };
  const lait: Task = { id: 2, title: 'Lait', done: false };

  describe('la règle du nom barré', () => {
    it('barre le nom quand toutes les tâches sont réalisées', async () => {
      await show({ id: 1, name: 'Courses', tasks: [pain, { ...lait, done: true }] });

      expect(nameIsCrossedOut()).toBe(true);
      expect(element.querySelector('.count')!.textContent).toContain('2 / 2');
    });

    it("ne barre pas le nom s'il reste une tâche à faire", async () => {
      await show({ id: 1, name: 'Courses', tasks: [pain, lait] });

      expect(nameIsCrossedOut()).toBe(false);
      expect(element.querySelector('.count')!.textContent).toContain('1 / 2');
    });

    it("ne barre pas le nom d'une liste vide", async () => {
      await show({ id: 1, name: 'Courses', tasks: [] });

      expect(nameIsCrossedOut()).toBe(false);
      expect(element.textContent).toContain('Aucune tâche');
      // querySelector renvoie null quand il ne trouve rien : pas de compteur pour une liste vide.
      expect(element.querySelector('.count')).toBeNull();
    });

    it("débarre le nom dès qu'on ajoute une tâche", async () => {
      await show({ id: 1, name: 'Courses', tasks: [pain] });
      expect(nameIsCrossedOut()).toBe(true);

      // Le parent donne une nouvelle liste, avec une tâche de plus (non réalisée).
      fixture.componentRef.setInput('list', { id: 1, name: 'Courses', tasks: [pain, lait] });
      await fixture.whenStable();

      expect(nameIsCrossedOut()).toBe(false);
    });
  });

  describe('les tâches', () => {
    it('barre les tâches réalisées, et elles seules', async () => {
      await show({ id: 1, name: 'Courses', tasks: [pain, lait] });

      const labels = element.querySelectorAll('label');
      expect(labels[0].classList.contains('done')).toBe(true);
      expect(labels[1].classList.contains('done')).toBe(false);
    });

    it('prévient le parent quand on coche une tâche', async () => {
      await show({ id: 1, name: 'Courses', tasks: [pain, lait] });
      // On écoute la sortie toggleTask, comme le ferait le parent avec (toggleTask)="…".
      let received: Task | undefined;
      fixture.componentInstance.toggleTask.subscribe((task) => (received = task));

      element.querySelectorAll<HTMLInputElement>('input[type=checkbox]')[1].click();

      expect(received).toEqual(lait);
    });

    it('envoie le titre saisi au parent, puis vide le champ', async () => {
      await show({ id: 1, name: 'Courses', tasks: [] });
      let received: string | undefined;
      fixture.componentInstance.addTask.subscribe((title) => (received = title));

      // On « tape » dans le champ : on change sa valeur, puis on déclenche l'événement input,
      // celui qu'écoute [(ngModel)].
      const field = element.querySelector<HTMLInputElement>('.new-task input')!;
      field.value = '  Fromage  ';
      field.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      element.querySelector<HTMLButtonElement>('.new-task button')!.click();
      await fixture.whenStable();

      expect(received).toBe('Fromage');
      expect(field.value).toBe('');
    });
  });
});
