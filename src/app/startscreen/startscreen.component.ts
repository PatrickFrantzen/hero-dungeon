import { Component, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Game } from 'src/models/game';
import { DialogChooseHeroComponent } from '../dialog-choose-hero/dialog-choose-hero.component';

@Component({
  selector: 'app-startscreen',
  templateUrl: './startscreen.component.html',
  styleUrls: ['./startscreen.component.scss']
})
export class StartscreenComponent implements OnChanges{
  numberOfPlayers:number = 0;
  playerNumber!:number;
  difficulty!:string;
  game!: Game;
  GameSetting:any;


  constructor(
    public dialog:MatDialog,
  ) {}



  ngOnChanges(changes: SimpleChanges): void {
    this.createGame(changes);
    this.sendGameToServer();
  }

  createGame(changes:SimpleChanges) {
    this.GameSetting = changes['numberOfPlayers'].currentValue;
    console.log(this.GameSetting, this.numberOfPlayers);
  
  }

  sendGameToServer() {
    this.game = new Game;
    this.game.numberOfPlayers = this.numberOfPlayers;

  }
  
  newGame() {
    if(this.numberOfPlayers == 0) {
      this.openDialog();
    }
  }

  openDialog() {
    let dialogRef = this.dialog.open(DialogChooseHeroComponent, {
      data: {numberOfPlayer: this.numberOfPlayers,
              difficulty: this.difficulty
            }
    })

    dialogRef.afterClosed().subscribe(result => {
      console.log('data',result.data)
      this.setGameSettings(result.data)
    })
  }

  setGameSettings(data:any) {
    this.numberOfPlayers = data.numberOfPlayer;
    this.difficulty = data.difficulty;
  }
}
