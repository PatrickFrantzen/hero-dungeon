import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { Game } from 'src/models/game';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  game = new Game();
  gameId:string = '';

  @Input() numberOfPlayers!: number;

  constructor(
    public currentUserService: CurrentUserService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.currentUserService.getCurrentUser();
    this.route.params.subscribe((params) => {
      this.gameId = params['id'];
      console.log(this.gameId)
    })
  }

}