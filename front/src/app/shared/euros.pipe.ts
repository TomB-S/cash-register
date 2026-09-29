import { formatCurrency } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

// Pipe = function de transformation d'affichage utilisable dans un template avec `|` : {{ 850 | euros }}.
// Nos montants sont en centimes (entiers) ; ce pipe centralise la conversion en euros affichés.
@Pipe({ name: 'euros' })
export class EurosPipe implements PipeTransform {
  // transform() = appelée automatiquement par Angular à chaque usage du pipe.
  transform(cents: number): string {
    // formatCurrency(montant en euros, locale, symbole) → "8,50 €" avec la locale 'fr'.
    return formatCurrency(cents / 100, 'fr', '€');
  }
}
