import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatButton } from '@angular/material/button';
import { BaseDialogComponent } from '../dialog-base.component';
import { GameSettingsDialogResult } from '../dialog-results';
import { LOCAL_GAME_ID_PREFIX } from 'src/app/services/local-game-id.util';

interface Difficulty {
  value: string;
  viewValue: string;
}

@Component({
    selector: 'app-dialog-game-settings',
    templateUrl: './dialog-game-settings.component.html',
    styleUrls: ['./dialog-game-settings.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatLabel, FormsModule, MatInput, ReactiveFormsModule, MatError, MatSelect, MatOption, MatDialogActions, MatButton, MatDialogClose],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogGameSettingsComponent extends BaseDialogComponent<GameSettingsDialogResult> {
  private dialogData = inject<{ singleplayerMode?: boolean } | null>(MAT_DIALOG_DATA, { optional: true });
  singleplayerMode = this.dialogData?.singleplayerMode ?? false;
  playerValidation = new FormControl<number | null>(1, [Validators.required, Validators.min(1), Validators.max(5)]);
  idValidation = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });

  selectedValue:string = 'easy';
  difficulties: Difficulty[] = [
    {value: 'easy', viewValue: 'Lehrling'},
    {value: 'medium', viewValue: 'Held'},
    {value: 'hard', viewValue: 'Dungeon-Master'}
  ];

  constructor(dialogRef: MatDialogRef<DialogGameSettingsComponent, { data: GameSettingsDialogResult }>) {
    super(dialogRef);
  }

  getGameSettings(numberOfPlayer:number, difficulty: string, gameId: string) {
    if (this.singleplayerMode) {
      this.closeWith({ numberOfPlayer: 1, difficulty, gameId: `${LOCAL_GAME_ID_PREFIX}${Date.now()}` });
      return;
    }

    this.closeWith({ numberOfPlayer, difficulty, gameId });
  }
}
