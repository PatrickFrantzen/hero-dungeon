import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Game } from 'src/models/game';
import { Hero } from 'src/models/helden/hero.class';
import { Barbar } from 'src/models/helden/barbar.class';
import { DialogGameSettings } from '../dialog-game-settings/dialog-game-settings.component';
import { Auth, signOut } from '@angular/fire/auth';
import { getFirestore, doc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { Monster } from 'src/models/monster/monster.class';

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
  monsterSetting!:string;
  currentGameId: string = '';
  game: Game = new Game();
  GameSetting:any;
  hero: Hero = new Hero;
  barbar:Barbar = new Barbar;
  choosenHeros: any = [];
  monster!: Monster;
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
    let dialogRef = this.dialog.open(DialogGameSettings, {
      data: {numberOfPlayer: this.numberOfPlayers,
              difficulty: this.difficulty,
              gameId: this.gameId,
            }
    })

    dialogRef.afterClosed().subscribe(result => {
      this.setGameSettings(result.data);
      this.currentGameId = result.data.gameId;
      const docRef = doc(this.db, 'games', result.data.gameId);
      setDoc(docRef, this.game.toJSON())
      .then(()=> {
        this.route.navigate(['/game/'+ this.currentGameId])
      });
    }
    )
  }

  setGameSettings(data:any) {
    if (data) {
      this.game.numberOfPlayers = data.numberOfPlayer;
      this.game.difficulty = data.difficulty;
      this.game.gameId = data.gameId;
      this.game.allBosses = new Monster().bossCollection;
      this.game.currentBoss = this.game.allBosses[0];
      this.game.monsterStack = new Monster().createMonsterStack(data.numberOfPlayer, this.game.currentBoss, data.difficulty);
    }
  }


  logout() {
    signOut(this.auth)
    .then (()=> {
      this.route.navigate(['signIn'])
    })
  }

  joinGame() {
    let inputValue = (<HTMLInputElement>document.getElementById('joinGame')).value;
    this.route.navigate(['/game/'+ inputValue]);
  }
}
