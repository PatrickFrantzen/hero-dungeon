import { inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

/**
 * Kleine Basis für die Dialog-Komponenten (Choose-Hero, Game-Settings, Heropower, Confirm,
 * Account-Offer, Link-Account): bündelt das wiederkehrende `dialogRef.close({ data: result })`-
 * Muster hinter `closeWith(result)`, mit `TResult` als explizitem, typisiertem Ergebnis-Contract
 * statt `any` auf beiden Seiten (Dialog-Komponente und Aufrufer). `dialogRef` wird per `inject()`
 * bezogen statt über den Constructor gereicht (Issue #94) - Subklassen rufen daher `super()`
 * ohne Argumente statt `super(dialogRef)`.
 */
export abstract class BaseDialogComponent<TResult> {
  protected dialogRef = inject<MatDialogRef<unknown, { data: TResult }>>(MatDialogRef);

  protected closeWith(result: TResult): void {
    this.dialogRef.close({ data: result });
  }
}
