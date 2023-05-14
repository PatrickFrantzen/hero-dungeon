import { Component } from '@angular/core';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Output, EventEmitter } from '@angular/core';
import { Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

interface Difficulty {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-dialog-game-settings',
  templateUrl: './dialog-game-settings.component.html',
  styleUrls: ['./dialog-game-settings.component.scss']
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
