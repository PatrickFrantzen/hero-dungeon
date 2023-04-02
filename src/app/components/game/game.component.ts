import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { isEmpty } from '@firebase/util';
import { DialogChooseHeroComponent } from 'src/app/components/dialog-choose-hero/dialog-choose-hero.component';

import { CurrentGameService } from 'src/app/services/current-game.service';
import { doc, getFirestore, getDoc, updateDoc } from '@angular/fire/firestore';
import { Game } from 'src/models/game';
import { User } from 'src/models/user.class';
import { Monster } from 'src/models/monster/monster.class';
import { CurrentUserService } from 'src/app/services/current-user.service';


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  game = new Game();
  user = new User();
  gameId: string = '';
  currentPlayer: string = '';
  currentPlayerId!: string;
  currentHero: Object = {};
  currentEnemy!: Array<object>;
  numberOfPlayers: number = 0;
  gameDifficulty: string = '';
  gameIsLost: boolean = false;
  enemy: string = '';
  monsterStack: Array<object> = [];
  monsterSetting!: string;
  monster!: Monster;
  currentBoss: object[] = [];
  currentMonster: Array<object> = [];
  allBosses: object[] = [];

  initialHand: string[] = [];
  db = getFirestore();

  currentEnemyName!: string;
  currentEnemyType!: string;
  currentEnemyToken!: Array<string>;

  constructor(
    public currentUserService: CurrentUserService,
    public currentGameService: CurrentGameService,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(async (params) => {
      //When url is changed the Hero Data of this User is loaded
      this.getGameId(params)
    });
    this.currentUserService.getCurrentUser().then((response) => {
      console.log('gameResponse', response);
      this.currentHero = this.currentUserService.currentUserHero;
      this.currentPlayer = this.currentUserService.currentUser;
      this.currentPlayerId = this.currentUserService.currentUserId;
    }).then(async () => {
      if (this.currentHero) {
        const docRef = doc(this.db, 'users', this.currentPlayerId);
        const docSnap = await getDoc(docRef);
        let data = docSnap.data();
        this.initialHand = data!['handstack'];
        console.log('initHand', this.initialHand)
      }
    }).then(() => {
      this.currentGameService.getCurrentGame(this.gameId)
        .then((response) => {
          console.log('CurrentgameResponse', response)
          //get Data from Server for Game
          this.numberOfPlayers = response!['numberOfPlayers'];
          this.gameDifficulty = response!['difficulty'];
          this.gameIsLost = response!['isLost'];
          this.enemy = response!['currentEnemy'];
          this.monsterStack = response!['monsterStack'];
          this.currentBoss = response!['currentBoss'];
          this.allBosses = response!['allBosses'];
          this.currentEnemy = response!['currentEnemy'];
          this.currentEnemyName = response!['currentEnemy'].name;
          this.currentEnemyType = response!['currentEnemy'].type;
          this.currentEnemyToken = response!['currentEnemy'].token;
        }).then(() => {
          //if currentHero is empty a Dialog is opened
          if (isEmpty(this.currentHero)) {
            this.openDialog();
          }
        });
    });
  };

 getGameId(params: { [x: string]: string; }) {
  this.gameId = params['id'];
  console.log('getGameID', this.gameId)
 }

  async loadHandstack() {
    const docRef = doc(this.db, 'users', this.currentPlayerId);
    const docSnap = await getDoc(docRef);
    let data = docSnap.data();
    this.initialHand = data!['handstack'];
    console.log('initHand', this.initialHand)
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
      updateDoc(docRef, updateData).then(() => {
        this.drawCards(this.user.choosenHero)
      });
    }
    )
  }

  setHeroToUser(data: any) {
    if (data) {
      this.user.choosenHero = data.choosenHero;
    }
  }

  drawCards(currentHero: any) {
    for (let i = 0; i < 5; i++) {
      const cardsinHand = currentHero.value.heroStack.shift();
      this.initialHand.push(cardsinHand);
    }
    const updateData = {
      handstack: this.initialHand
    }
    const docRef = doc(this.db, 'users', this.currentPlayerId)
    updateDoc(docRef, updateData);
    console.log('initialHand', this.initialHand)
  }

  chooseCard(card: any) {
    console.log('testCard', card)
  }

}