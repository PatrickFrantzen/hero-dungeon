import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Game } from 'src/models/game';
import { DialogGameSettings } from '../dialog-game-settings/dialog-game-settings.component';
import { Auth, signOut } from '@angular/fire/auth';
import { getFirestore, doc, setDoc} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Mob, Monster } from 'src/models/monster/monster.class';
import { Select, Store } from '@ngxs/store';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { Observable, Subscription } from 'rxjs';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { CurrentGameAction, CurrentGameData } from 'src/app/actions/currentGame-action';
import { ToJSONService } from 'src/app/services/to-json.service';
import { CreateNewMobAction } from 'src/app/actions/MonsterStack-action';

@Component({
  selector: 'app-startscreen',
  templateUrl: './startscreen.component.html',
  styleUrls: ['./startscreen.component.scss']
})
export class StartscreenComponent implements OnInit, OnDestroy{
  numberOfPlayers:number = 0;
  difficulty!:string;
  gameId!:string;
  currentGameId: string = '';
  game!: Game
  choosenHeros: any = [];
  db = getFirestore();
  gameAsJSON!:Game;

  @Select(CurrentUserSelectors.currentUserId) currentUserId$!: Observable<string>
  @Select(CurrentUserSelectors.currentUserName) currentUserName$!: Observable<string>

  currentUserIdSubscription!: Subscription;
  currentUserNameSubscription!: Subscription;

  currentUserName: string= '';
  currentUserId: string = '';

  constructor(
    public dialog:MatDialog,
    public auth: Auth,
    private route: Router,
    private userService: CurrentUserService,
    private store: Store,
    private JSON: ToJSONService,
  ) {}


  ngOnInit(): void {
    if (!this.currentUserName) {
      this.userService.getCurrentUser()
    }

    this.currentUserIdSubscription = this.currentUserId$.subscribe((data)=> {
      this.currentUserId = data;
    })
    this.currentUserNameSubscription = this.currentUserName$.subscribe((data)=> {
      this.currentUserName = data;
    })
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
      this.store.dispatch(new CurrentGameAction(this.currentGameId));
      const docRef = doc(this.db, 'games', result.data.gameId);
      setDoc(docRef, this.gameAsJSON)
      .then(()=> {
        this.route.navigate(['/game/'+ this.currentGameId])
      });
    }
    )
  }

  setGameSettings(data:any) {
    if (data) {
      const Mob: Mob[] = new Monster().createMob(data.numberOfPlayer, 'Baby-Barbar', data.difficulty);
      const allBosses: Mob[] = new Monster().bossCollection;
      const currentEnemy: Mob = Mob.shift()!;

      const game:Game = {
        numberOfPlayers: data.numberOfPlayer,
        choosenHeros: [],
        currentEnemy: {
          name: currentEnemy.name,
          token: currentEnemy.token,
          type: currentEnemy.type},
        currentBoss: {
          "name": "Baby-Barbar",
          "token": ['red', 'red', 'green', 'green', 'purple', 'purple', 'purple'],
          "type": "Boss"},
        isLost: false,
        gameId: data.gameId,
        difficulty: data.difficulty,
        Mob: Mob,
        allBosses: allBosses
      }
      this.store.dispatch(new CurrentGameData(game))
      this.store.dispatch(new CreateNewMobAction(Mob))
      this.gameAsJSON = this.JSON.gameToJSON(game);
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
    this.store.dispatch(new CurrentGameAction(inputValue));
  }

  ngOnDestroy(): void {
    this.currentUserIdSubscription.unsubscribe();
    this.currentUserNameSubscription.unsubscribe();
  }
}
