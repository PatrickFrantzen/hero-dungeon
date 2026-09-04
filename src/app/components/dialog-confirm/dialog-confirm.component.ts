import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatButton } from '@angular/material/button';
import { BaseDialogComponent } from '../dialog-base.component';

export interface DialogConfirmData {
  title: string;
  message: string;
}

export interface DialogConfirmResult {
  confirmed: boolean;
}

/**
 * Generischer Bestätigungsdialog (Issue #85, "Spielstand löschen" - eine destruktive Aktion
 * ohne Rückgängig-Option) - bisher gab es in diesem Repo nur fachspezifische Dialoge (Choose-
 * Hero, Game-Settings, Heropower, Account-Offer, Link-Account), keinen wiederverwendbaren
 * Titel/Nachricht-Confirm. Reines "Dialog sammelt nur Eingaben"-Muster (kein Seiteneffekt hier
 * selbst, siehe components/CLAUDE.md) - der Aufrufer entscheidet, was bei `confirmed: true`
 * tatsächlich gelöscht wird.
 */
@Component({
  selector: 'app-dialog-confirm',
  templateUrl: './dialog-confirm.component.html',
  imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions, MatButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogConfirmComponent extends BaseDialogComponent<DialogConfirmResult> {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogConfirmData,
    dialogRef: MatDialogRef<DialogConfirmComponent, { data: DialogConfirmResult }>
  ) {
    super(dialogRef);
  }

  onConfirm(): void {
    this.closeWith({ confirmed: true });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
