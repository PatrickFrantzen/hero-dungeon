import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatButton, MatIconButton } from '@angular/material/button';
import { BaseDialogComponent } from '../dialog-base.component';
import { DialogConfirmComponent, DialogConfirmResult } from '../dialog-confirm/dialog-confirm.component';
import { LocalSingleplayerSaveService } from 'src/app/services/local-singleplayer-save.service';

export type SaveMode = 'singleplayer' | 'multiplayer';

/** Ein Eintrag in der Auswahlliste - der Aufrufer (StartscreenComponent/GameMenuComponent)
 * baut diese Liste aus seinen eigenen `localSaves()`/`myGames()`-Signalen zusammen, da nur er
 * weiß, wie ein Held-/Status-Label für einen Eintrag aussieht (siehe `heroNameOf()`/
 * `saveLabel()`). `lastPlayedAt: null` für Multiplayer-Einträge aus der Zeit vor der Umstellung
 * von `users/{uid}.games` auf das neue Objektformat (UserRepositoryService.JoinedGame). */
export interface SaveListEntry {
  id: string;
  label: string;
  mode: SaveMode;
  lastPlayedAt: number | null;
}

export interface DialogSelectSaveData {
  entries: SaveListEntry[];
}

export interface DialogSelectSaveResult {
  selectedId: string;
  mode: SaveMode;
}

const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' });

/** "Spielstand auswählen" - ersetzt die bisherigen, direkt im Startscreen/GameMenu inline
 * gerenderten Listen ("Meine Spielstände"/"Meine Spiele") durch einen gemeinsamen Dialog mit
 * Modus-Badge + "zuletzt gespielt"-Zeitpunkt pro Eintrag, sortiert nach Aktualität (unbekannter
 * Zeitpunkt - Altdaten vor der Umstellung auf `JoinedGame` - landet am Ende). Löschen bleibt nur
 * für Singleplayer-Einträge möglich (Multiplayer-Einträge in "Meine Spiele" hatten auch vorher
 * keinen Löschen-Button - siehe StartscreenComponent/GameMenuComponent). */
@Component({
  selector: 'app-dialog-select-save',
  templateUrl: './dialog-select-save.component.html',
  imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions, MatButton, MatIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogSelectSaveComponent extends BaseDialogComponent<DialogSelectSaveResult> {
  private data = inject<DialogSelectSaveData>(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private localSaves = inject(LocalSingleplayerSaveService);

  entries = signal<SaveListEntry[]>(
    [...this.data.entries].sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0))
  );

  formatLastPlayed(lastPlayedAt: number | null): string {
    return lastPlayedAt ? dateFormatter.format(new Date(lastPlayedAt)) : 'Unbekannt';
  }

  modeLabel(mode: SaveMode): string {
    return mode === 'singleplayer' ? 'Singleplayer' : 'Multiplayer';
  }

  select(entry: SaveListEntry): void {
    this.closeWith({ selectedId: entry.id, mode: entry.mode });
  }

  /** Nur Singleplayer-Einträge sind hier löschbar (siehe Klassenkommentar) - löscht direkt über
   * LocalSingleplayerSaveService (analog zu StartscreenComponent.deleteLocalSave() vorher) und
   * entfernt den Eintrag aus der lokalen Kopie der Liste, statt den Dialog zu schließen. */
  delete(entry: SaveListEntry): void {
    this.dialog
      .open<DialogConfirmComponent, unknown, { data: DialogConfirmResult }>(DialogConfirmComponent, {
        data: { title: 'Spielstand löschen?', message: 'Dieser lokale Spielstand wird unwiderruflich gelöscht.' },
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result?.data.confirmed) {
          return;
        }
        this.localSaves.deleteSave(entry.id);
        this.entries.update((entries) => entries.filter((e) => e.id !== entry.id));
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
