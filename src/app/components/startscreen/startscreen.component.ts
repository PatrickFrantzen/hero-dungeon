import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Game } from 'src/models/game';
import { Hero } from 'src/models/helden/hero.class';
import { Barbar } from 'src/models/helden/barbar.class';
import { DialogChooseHeroComponent } from '../dialog-choose-hero/dialog-choose-hero.component';
import { Auth, signOut } from '@angular/fire/auth';
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";
import { Router } from '@angular/router';
import { CurrentUserService } from 'src/app/services/current-user.service';

@Component({
  selector: 'app-startscreen',
  templateUrl: './startscreen.component.html',
  styleUrls: ['./startscreen.component.scss']
})
export class StartscreenComponent implements OnInit{
  numberOfPlayers:number = 0;
  playerNumber!:number;
  difficulty!:string;
  gameId!:string;

  currentGameId: string = '';
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


  ngOnInit(): void {
    this.currentUserService.getCurrentUser();
  }
  
  newGame() {
      this.openDialog();
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
      this.currentGameId = result.data.gameId; //wird nur für addHero() gebraucht und kann nach auslagerung raus
      const docRef = doc(this.db, 'games', result.data.gameId);
      setDoc(docRef, this.game.toJSON())
      .then(()=> {
        this.route.navigate(['/game/'+ this.currentGameId])
      });
    }
    )
  }

  setGameSettings(data:any) {
    this.game.numberOfPlayers = data.numberOfPlayer;
    this.game.difficulty = data.difficulty;
    this.game.gameId = data.gameId;
  }


  //Code um einen einzelnen Helden dem Spiel hinzuzufügen
  //Die ID des Spiels muss bekannt sein. 
  addHero() {
    this.game.choosenHeros = [this.barbar.toJSON()];
    const docRef = doc(this.db, 'games', this.currentGameId);
    console.log(this.currentGameId);
    const updateData = {
      choosenHeros: this.game.choosenHeros,
    }
    updateDoc(docRef, updateData )
  }

  logout() {
    signOut(this.auth)
    .then (()=> {
      this.route.navigate(['signIn'])
    })
  }
}
