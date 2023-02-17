import { Component } from '@angular/core';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dialog-choose-hero',
  templateUrl: './dialog-choose-hero.component.html',
  styleUrls: ['./dialog-choose-hero.component.scss']
})
export class DialogChooseHeroComponent {
  playerValidation = new FormControl('', [Validators.required, Validators.min(1), Validators.max(5)]);
  numberOfPlayers!: number;

  constructor() {}

  getPlayerNumber() {
    this.numberOfPlayers = (document.getElementById('playerNumber') as HTMLInputElement).valueAsNumber;
    console.log(this.numberOfPlayers);
  }
}
