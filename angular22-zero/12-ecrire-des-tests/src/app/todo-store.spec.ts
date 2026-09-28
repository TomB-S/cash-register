import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth-interceptor';
import { TodoList } from './todo';
import { TodoStore } from './todo-store';

/*
 * Tests d'un service qui parle au serveur. Pas besoin du vrai serveur Java : on remplace le
 * réseau par un FAUX SERVEUR, HttpTestingController, que le test pilote lui-même.
 *
 * - provideHttpClientTesting() branche HttpClient sur ce faux serveur ;
 * - server.expectOne('/api/sync') vérifie qu'UNE requête est partie vers cette adresse, et la
 *   renvoie pour qu'on l'examine ;
 * - request.flush(données) fait « répondre » le faux serveur avec ces données ;
 * - server.verify(), après chaque test, vérifie qu'aucune requête inattendue n'est partie.
 */
describe('TodoStore', () => {
  let store: TodoStore;
  let server: HttpTestingController;

  /** Ce que le faux serveur renvoie au chargement. */
  const lists: TodoList[] = [
    { id: 1, name: 'Courses', tasks: [{ id: 2, title: 'Pain', done: false }] },
  ];

  // beforeEach s'exécute avant CHAQUE test : chacun repart ainsi d'une situation neuve.
  beforeEach(() => {
    localStorage.clear(); // pas de session : on est en mode test
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    store = TestBed.inject(TodoStore); // son constructeur envoie aussitôt GET /api/sync
    server = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    server.verify();
  });

  it('charge les listes au démarrage', () => {
    expect(store.loading()).toBe(true);

    server.expectOne('/api/sync').flush(lists);

    expect(store.loading()).toBe(false);
    expect(store.lists()).toEqual(lists);
  });

  it("modifie les listes tout de suite, puis les envoie toutes au serveur", () => {
    server.expectOne('/api/sync').flush(lists);

    store.toggleTask(store.lists()[0], store.lists()[0].tasks[0]);

    // L'affichage n'attend pas le serveur…
    expect(store.lists()[0].tasks[0].done).toBe(true);
    // … et toutes les listes partent au serveur.
    const request = server.expectOne({ method: 'PUT', url: '/api/sync' });
    expect(request.request.body[0].tasks[0].done).toBe(true);
    expect(store.saving()).toBe(true);

    request.flush(null);

    expect(store.saving()).toBe(false);
  });

  it("n'envoie qu'une requête à la fois, puis renvoie le dernier état", () => {
    server.expectOne('/api/sync').flush(lists);

    store.createList('A');
    store.createList('B');
    store.createList('C');

    // Une seule requête est partie, avec l'état du moment : Courses et A.
    const first = server.expectOne({ method: 'PUT', url: '/api/sync' });
    expect(first.request.body.length).toBe(2);
    first.flush(null);

    // Quand elle a abouti, une seconde part, avec l'état le plus récent.
    const second = server.expectOne({ method: 'PUT', url: '/api/sync' });
    expect(second.request.body.map((list: TodoList) => list.name)).toEqual(['Courses', 'A', 'B', 'C']);
    second.flush(null);
  });

  it("n'envoie rien tant que les listes n'ont pas été reçues", () => {
    store.createList('Trop tôt');

    server.expectNone({ method: 'PUT', url: '/api/sync' });
    server.expectOne('/api/sync').flush(lists);
  });

  it('donne aux nouveautés des numéros encore jamais utilisés', () => {
    server.expectOne('/api/sync').flush(lists); // numéros déjà pris : 1 et 2

    store.createList('Week-end');
    const weekEnd = store.lists()[1];
    store.addTask(weekEnd, 'Faire le plein');

    expect(weekEnd.id).toBe(3);
    expect(store.lists()[1].tasks[0].id).toBe(4);
    // Deux envois : le premier en route, le second à son retour.
    server.expectOne({ method: 'PUT', url: '/api/sync' }).flush(null);
    server.expectOne({ method: 'PUT', url: '/api/sync' }).flush(null);
  });

  it('affiche un message quand le serveur ne répond pas', () => {
    // vi.spyOn(…).mockImplementation(…) remplace console.error le temps du test :
    // le message technique ne vient pas encombrer l'affichage des résultats.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    server.expectOne('/api/sync').flush(null, { status: 502, statusText: 'Bad Gateway' });

    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('Impossible de joindre le serveur. Est-il bien lancé ?');
  });
});
