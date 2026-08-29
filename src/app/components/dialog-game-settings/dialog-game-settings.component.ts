import { Component } from '@angular/core';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatButton } from '@angular/material/button';

interface Difficulty {
  value: string;
  viewValue: string;
}

@Component({
    selector: 'app-dialog-game-settings',
    templateUrl: './dialog-game-settings.component.html',
    styleUrls: ['./dialog-game-settings.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatLabel, FormsModule, MatInput, ReactiveFormsModule, MatError, MatSelect, MatOption, MatDialogActions, MatButton, MatDialogClose]
})
export class DialogGameSettings {
  playerValidation = new FormControl('', [Validators.required, Validators.min(2), Validators.max(5)]);
  idValidation = new FormControl('', Validators.required);

  numberOfPlayer!:number;
  selectedValue!:string;
  difficulties: Difficulty[] = [
    {value: 'easy', viewValue: 'easy'},
    {value: 'medium', viewValue: 'medium'},
    {value: 'hard', viewValue: 'hard'}
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private dialogRef: MatDialogRef<DialogGameSettings>) {}

  getGameSettings(numberOfPlayer:number, difficulty: string, gameId: string) {
    this.dialogRef.close({data: {
      numberOfPlayer: numberOfPlayer,
      difficulty: difficulty,
      gameId: gameId,
    }})
  }
}
