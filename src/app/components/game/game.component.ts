import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { isEmpty } from '@firebase/util';
import { DialogChooseHeroComponent } from 'src/app/components/dialog-choose-hero/dialog-choose-hero.component';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { CurrentGameService } from 'src/app/services/current-game.service';
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";
import { Game } from 'src/models/game';
import { User } from 'src/models/user.class';
import { initializeApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';
import { getAuth } from '@angular/fire/auth';
import { Monster } from 'src/models/monster/monster.class';


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  game = new Game();
  user = new User();
  gameId:string = '';
  currentPlayer:string = '';
  currentPlayerId!: string;
  currentHero:Object = {};
  numberOfPlayers: number = 0;
  gameDifficulty: string = '';
  gameIsLost: boolean = false;
  enemy: string = '';
  monsterStack: string[] = [];
  monsterSetting!:string;
  mySubscription;
  monster!:Monster;
  db = getFirestore();
  currentBoss: object[] = [];
  allBosses: object[] = [];

  constructor(
    public currentUserService: CurrentUserService,
    public currentGameService: CurrentGameService,
    private route: ActivatedRoute,
    public dialog:MatDialog,
    private router: Router
  ) { 
    
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.mySubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
  // Trick the Router into believing it's last link wasn't previously loaded
      this.router.navigated = false;
      }
    }); 
  }

  ngOnInit(): void {
    const firebaseApp = initializeApp(environment.firebase);
    this.route.params.subscribe((params) => {
      this.gameId = params['id'];
      this.currentHero = this.currentUserService.currentUserHero;
      this.currentPlayer = this.currentUserService.currentUser;
      this.currentPlayerId = this.currentUserService.currentUserId;
      this.currentGameService.getCurrentGame(this.gameId)
      .then((response) => {
        this.numberOfPlayers = response!['numberOfPlayers'];
        this.gameDifficulty = response!['difficulty'];
        this.gameIsLost = response!['isLost'];
        this.enemy = response!['currentEnemy'];
        this.monsterStack = response!['monsterStack'];
        this.currentBoss = response!['currentBoss'];
        this.allBosses = response!['allBosses'];
      })
      if (isEmpty(this.currentHero)) {
        this.openDialog()
      } 
    });
  }


  openDialog() {
    let dialogRef = this.dialog.open(DialogChooseHeroComponent, {
      data: {
             choosenHero: this.currentHero 
            }
    })

    dialogRef.afterClosed().subscribe(result => {
      this.setHeroToUser(result.data);
      const updateData = {
        choosenHero: this.user.choosenHero,
      }
      const docRef = doc(this.db, 'users', this.currentPlayerId);
      updateDoc(docRef, updateData);
    }
    )
  }

  setHeroToUser(data:any) {
    if (data) {
      this.user.choosenHero = data.choosenHero;
    }
  }

}