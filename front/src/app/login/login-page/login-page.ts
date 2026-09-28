import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-login-page',
  styleUrl: './login-page.css',
  templateUrl: './login-page.html',
})
export class LoginPage {
  // AuthService : pour envoyer login/password au serveur.
  private readonly authService = inject(AuthService);
  // Router : pour changer de page par code (ici, aller vers /caisse après succès).
  private readonly router = inject(Router);

  // Fabrique de formulaires où les champs texte ne sont jamais null (juste '').
  // NonNullableFormBuilder = comme FormBuilder, mais évite de gérer `string | null` partout.
  private readonly fb = inject(NonNullableFormBuilder);

  // Le formulaire : deux champs texte, tous les deux obligatoires.
  // Chaque champ = [valeur de départ, validateur(s)]. Validators.required = ne doit pas être vide.
  readonly form = this.fb.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  // Message d'erreur à afficher sous le formulaire (null = rien à afficher).
  // Un signal : le template se met à jour tout seul dès qu'on fait .set().
  readonly errorMessage = signal<string | null>(null);

  // Appelée au clic sur "Se connecter" (voir (ngSubmit) dans le template).
  onSubmit(): void {
    // getRawValue() = lit les valeurs actuelles du formulaire, sous forme { login, password }.
    const { login, password } = this.form.getRawValue();

    // On efface une éventuelle erreur précédente avant de retenter.
    this.errorMessage.set(null);

    // authService.login(...) ne fait encore rien : c'est .subscribe() qui déclenche
    // réellement la requête, et qui reçoit soit next (succès), soit error (échec).
    this.authService.login(login, password).subscribe({
      // Succès : le jeton est déjà sauvegardé par AuthService, il ne reste qu'à naviguer.
      next: () => this.router.navigate(['/caisse']),
      // Échec : err.status donne le code HTTP (401 = identifiants faux, sinon = pas de serveur).
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.errorMessage.set('Identifiant ou mot de passe incorrect');
        } else {
          this.errorMessage.set('Le serveur ne répond pas');
        }
      },
    });
  }
}
