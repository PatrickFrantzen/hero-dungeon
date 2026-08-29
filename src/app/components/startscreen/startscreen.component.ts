import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Game } from 'src/models/game';
import { DialogGameSettingsComponent } from '../dialog-game-settings/dialog-game-settings.component';
import { Auth, signOut } from '@angular/fire/auth';
import { getFirestore, doc, setDoc, DocumentData} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Mob, Monster } from 'src/models/monster/monster.class';
import { Store } from '@ngxs/store';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectors';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { CurrentGameAction, CurrentGameData } from 'src/app/actions/currentGame-action';
import { SetNewEnemy } from 'src/app/actions/encounter-action';
import { ToJSONService } from 'src/app/services/to-json.service';
import { CreateNewMobAction, UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { GameSettingsDialogResult } from 'src/app/components/dialog-results';

@Component({
    selector: 'app-startscreen',
    templateUrl: './startscreen.component.html',
    styleUrls: ['./startscreen.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StartscreenComponent implements OnInit {
  numberOfPlayers:number = 0;
  difficulty!:string;
  gameId!:string;
  currentGameId: string = '';
  game!: Game
  choosenHeros: any = [];
  db = getFirestore();
  gameAsJSON!:Game;

  currentUserId = this.store.selectSignal(CurrentUserSelectors.currentUserId);
  currentUserName = this.store.selectSignal(CurrentUserSelectors.currentUserName);

  loadedCollectionData!: DocumentData;
  loadedCurrentEnemy!: Mob;
  loadedCurrentMob!: Mob[]
  joinGameError: string | null = null;

  constructor(
    public dialog:MatDialog,
    public auth: Auth,
    private route: Router,
    private userService: CurrentUserService,
    private store: Store,
    private JSON: ToJSONService,
    private gameRepo: GameRepositoryService
  ) {}


  ngOnInit(): void {
    if (!this.currentUserName()) {
      this.userService.getCurrentUser()
    }
  }
  
  newGame() {
      this.openDialog();
  }

  openDialog() {
    let dialogRef = this.dialog.open<DialogGameSettingsComponent, undefined, { data: GameSettingsDialogResult }>(
      DialogGameSettingsComponent
    );

    dialogRef.afterClosed().subscribe(result => {
      if (!result?.data) {
        return;
      }
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

  setGameSettings(data: GameSettingsDialogResult) {
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
        allBosses: allBosses,
        questCardActivated: false
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
    let inputValue = (<HTMLInputElement>document.getElementById('joinGame')).value.trim();
    if (!inputValue) {
      return;
    }
    this.gameRepo.getGame(inputValue)
    .then((results)=> {
      if (!results) {
        this.joinGameError = 'Kein Spiel mit dieser ID gefunden.';
        return;
      }
      this.joinGameError = null;
      this.loadedCollectionData = results;
      this.loadedCurrentEnemy = this.loadedCollectionData['currentEnemy'];
      this.loadedCurrentMob = this.loadedCollectionData['Mob'];
      this.store.dispatch(new SetNewEnemy(this.loadedCurrentEnemy));
      this.store.dispatch(new UpdateMobAction(this.loadedCurrentMob));
      this.route.navigate(['/game/'+ inputValue]);
      this.store.dispatch(new CurrentGameAction(inputValue));
    })
    .catch(() => {
      this.joinGameError = 'Kein Spiel mit dieser ID gefunden.';
    })
  }
}
