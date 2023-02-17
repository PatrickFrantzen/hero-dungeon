import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  @Input() numberOfPlayers!: number;

  constructor() { }

  ngOnInit(): void {
    console.log(this.numberOfPlayers);
  }

}