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
  selector: 'app-dialog-choose-hero',
  templateUrl: './dialog-choose-hero.component.html',
  styleUrls: ['./dialog-choose-hero.component.scss']
})
export class DialogChooseHeroComponent {
  playerValidation = new FormControl('', [Validators.required, Validators.min(1), Validators.max(5)]);
  numberOfPlayer!:number;
  selectedValue!:string;
  difficulties: Difficulty[] = [
    {value: 'easy', viewValue: 'easy'},
    {value: 'medium', viewValue: 'medium'},
    {value: 'hard', viewValue: 'hard'},
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private dialogRef: MatDialogRef<DialogChooseHeroComponent>) {}

  getGameSettings(numberOfPlayer:number, difficulty: string) {
    this.dialogRef.close({data: {
      numberOfPlayer: numberOfPlayer,
      difficulty: difficulty
    }})
  }
}
