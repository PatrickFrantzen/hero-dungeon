import { Component, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Game } from 'src/models/game';
import { Hero } from 'src/models/helden/hero.class';
import { Barbar } from 'src/models/helden/barbar.class';
import { DialogChooseHeroComponent } from '../dialog-choose-hero/dialog-choose-hero.component';
import { Auth, signOut } from '@angular/fire/auth';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { Router } from '@angular/router';
import { CurrentUserService } from 'src/app/services/current-user.service';

@Component({
  selector: 'app-startscreen',
  templateUrl: './startscreen.component.html',
  styleUrls: ['./startscreen.component.scss']
})
export class StartscreenComponent implements OnChanges, OnInit{
  numberOfPlayers:number = 0;
  playerNumber!:number;
  difficulty!:string;
  gameId!:string;
  game: Game = new Game();
  GameSetting:any;
  hero: Hero = new Hero;
  barbar:Barbar = new Barbar;
  choosenHeros: any = [];
  db = getFirestore();


  constructor(
    public dialog:MatDialog,
    public auth: Auth,
    private route: Router,
    public currentUserService: CurrentUserService,
  ) {}

  logout() {
    signOut(this.auth)
    .then (()=> {
      this.route.navigate(['signIn'])
    })
  }

  ngOnInit(): void {
    this.currentUserService.getCurrentUser();
  }

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
    this.hero = new Hero;
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
              difficulty: this.difficulty,
              gameId: this.gameId,
            }
    })

    dialogRef.afterClosed().subscribe(result => {
      this.setGameSettings(result.data);
      console.log('gameSettings', result.data);
      const docRef = doc(this.db, 'games', result.data.gameId);
      setDoc(docRef, this.game.toJSON());
    }
    )
  }

  setGameSettings(data:any) {
    this.game.numberOfPlayers = data.numberOfPlayer;
    this.game.difficulty = data.difficulty;
    this.game.gameId = data.gameId;
    this.game.choosenHeros = [this.barbar]; //Fehlermeldung erscheint: ERROR FirebaseError: 
    //Function setDoc() called with invalid data. Unsupported field value: a custom Barbar object (found in document games/test)
    console.log('game', this.game)
  }
}
