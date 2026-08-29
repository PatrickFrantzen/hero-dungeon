import { MatDialogRef } from '@angular/material/dialog';

/**
 * Kleine Basis für die drei Dialog-Komponenten (Choose-Hero, Game-Settings, Heropower):
 * bündelt das wiederkehrende `dialogRef.close({ data: result })`-Muster hinter
 * `closeWith(result)`, mit `TResult` als explizitem, typisiertem Ergebnis-Contract statt
 * `any` auf beiden Seiten (Dialog-Komponente und Aufrufer).
 */
export abstract class BaseDialogComponent<TResult> {
  constructor(protected dialogRef: MatDialogRef<unknown, { data: TResult }>) {}

  protected closeWith(result: TResult): void {
    this.dialogRef.close({ data: result });
  }
}
