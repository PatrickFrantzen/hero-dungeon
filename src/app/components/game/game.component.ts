import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Game } from 'src/models/game';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  game = new Game()

  @Input() numberOfPlayers!: number;

  constructor() { }

  ngOnInit(): void {
    console.log(this.game);

  }

}