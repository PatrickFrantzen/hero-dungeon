import { ChangeDetectionStrategy, Component, effect, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogGameSettingsComponent } from '../dialog-game-settings/dialog-game-settings.component';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectors';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { CurrentGameAction, CurrentGameData } from 'src/app/actions/currentGame-action';
import { SetNewEnemy } from 'src/app/actions/encounter-action';
import { ToJSONService } from 'src/app/services/to-json.service';
import { CreateNewMobAction, UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { StartTutorial } from 'src/app/actions/tutorial-action';
import { GameFactoryService } from 'src/app/services/game-factory.service';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { GameSettingsDialogResult } from 'src/app/components/dialog-results';
import { isLocalGameId } from 'src/app/services/local-game-id.util';
import { LocalSingleplayerSave, LocalSingleplayerSaveService } from 'src/app/services/local-singleplayer-save.service';
import { AuthFormService } from 'src/app/services/auth-form.service';
import { JoinedGame, UserRepositoryService } from 'src/app/services/user-repository.service';
import { SaveListEntry, openSaveSelector } from '../dialog-select-save/dialog-select-save.component';

@Component({
    selector: 'app-startscreen',
    templateUrl: './startscreen.component.html',
    styleUrls: ['./startscreen.component.scss'],
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StartscreenComponent implements OnInit {
  currentGameId: string = '';
  joinGameId: string = '';
  startscreenError: string | null = null;

  currentUserId = this.store.selectSignal(CurrentUserSelectors.currentUserId);
  currentUserName = this.store.selectSignal(CurrentUserSelectors.currentUserName);

  /** "Meine Spielstände" (Issue #73) - lokale Singleplayer-Saves, die ohne Anmeldung fortgesetzt
   * werden können. Einmal beim Betreten des Startscreens geladen; ein neu erstelltes Spiel legt
   * hier keinen Eintrag mehr an, da nach dem Erstellen sofort zu /local-game/:id navigiert wird -
   * die Liste aktualisiert sich beim nächsten Besuch des Startscreens von selbst. */
  localSaves = signal<LocalSingleplayerSave[]>([]);

  /** "Meine Spiele" (Issue #78) - Multiplayer-Historie aus `users/{uid}.games`, im Unterschied
   * zu `localSaves` oben nicht synchron verfügbar (hängt vom asynchron auflösenden
   * `currentUserId()` ab, siehe CurrentUserService.getCurrentUser()) - deshalb per effect() statt
   * einmalig in ngOnInit() geladen; lädt neu, sobald sich die Account-Id ändert (z.B. nach
   * signInAnonymously() aus newGame()/joinGame()). */
  myGames = signal<JoinedGame[]>([]);

  constructor(
    public dialog:MatDialog,
    public auth: Auth,
    private route: Router,
    private userService: CurrentUserService,
    private store: Store,
    private JSON: ToJSONService,
    private gameFactory: GameFactoryService,
    private gameRepo: GameRepositoryService,
    private localSaveService: LocalSingleplayerSaveService,
    private authForm: AuthFormService,
    private userRepo: UserRepositoryService
  ) {
    effect(() => {
      const userId = this.currentUserId();
      if (!userId) {
        return;
      }
      this.userRepo.getJoinedGames(userId).then((games) => this.myGames.set(games));
    });
  }


  ngOnInit(): void {
    if (!this.currentUserName()) {
      this.userService.getCurrentUser()
    }
    this.localSaves.set(this.localSaveService.listSaves());
  }

  /** Fortsetzen eines lokalen Spielstands aus "Meine Spielstände" - GameComponent/
   * PlayerHandComponent laden den Rest (Encounter/Hand/Held) selbst beim Betreten der Route,
   * siehe PlayerHandComponent.loadLocalGameOnce(). */
  resumeLocalSave(saveId: string): void {
    this.store.dispatch(new CurrentGameAction(saveId));
    this.route.navigate(['/local-game/' + saveId]);
  }

  /** `player` ist bewusst ein loses Feld-Bag (siehe local-singleplayer-save.service.ts) - vor
   * der Heldenauswahl (frisch erstelltes, noch nie betretenes Spiel) existiert `choosenHero`
   * noch nicht. */
  heroNameOf(save: LocalSingleplayerSave): string {
    const choosenHero = save.player['choosenHero'] as { heroname?: string } | undefined;
    return choosenHero?.heroname ?? 'Fortsetzen';
  }

  hasSaves(): boolean {
    return this.localSaves().length > 0 || this.myGames().length > 0;
  }

  /** "Spielstand auswählen" (ersetzt die bisherigen inline gerenderten Listen "Meine
   * Spielstände"/"Meine Spiele") - baut die gemeinsame Auswahlliste aus den beiden vorhandenen
   * Signalen zusammen (Badge/Datum übernimmt der Dialog selbst) und setzt danach das Spiel
   * fort. `localSaves` wird nach dem Schließen immer neu gelesen (billig, synchron), da im
   * Dialog ein lokaler Spielstand gelöscht worden sein könnte. */
  openSaveDialog(): void {
    const entries: SaveListEntry[] = [
      ...this.localSaves().map(
        (save): SaveListEntry => ({ id: save.saveId, label: this.heroNameOf(save), mode: 'singleplayer', lastPlayedAt: save.updatedAt })
      ),
      ...this.myGames().map(
        (game): SaveListEntry => ({ id: game.gameId, label: game.gameId, mode: 'multiplayer', lastPlayedAt: game.lastPlayedAt || null })
      ),
    ];

    openSaveSelector(this.dialog, entries).subscribe((result) => {
      this.localSaves.set(this.localSaveService.listSaves());
      if (!result) {
        return;
      }
      if (result.mode === 'singleplayer') {
        this.resumeLocalSave(result.selectedId);
      } else {
        this.joinGame(result.selectedId);
      }
    });
  }

  /** Multiplayer-Einstieg (Issue #76): meldet vor dem eigentlichen Firestore-Zugriff per
   * `AuthFormService.ensureAnonymousSession()` an, falls noch kein Nutzer eingeloggt ist - kein
   * sichtbarer Signin-Screen mehr nötig. `newSingleplayerGame()` bleibt bewusst ohne diesen
   * Aufruf, Singleplayer läuft weiterhin komplett ohne Auth. */
  async newGame() {
      await this.authForm.ensureAnonymousSession();
      this.openDialog(false);
  }

  newSingleplayerGame() {
      this.openDialog(true);
  }

  openDialog(singleplayerMode = false) {
    let dialogRef = this.dialog.open<DialogGameSettingsComponent, { singleplayerMode: boolean }, { data: GameSettingsDialogResult }>(
      DialogGameSettingsComponent,
      // disableClose: ohne Auswahl (Schwierigkeit ist zwar vorbelegt, Spiele-ID/Spielerzahl
      // aber nicht) durfte der Dialog vorher per Backdrop-Klick/Escape verschwinden, ohne dass
      // ein Spiel erstellt wurde - wirkte wie ein Bug ("Klick geht ins Leere").
      { data: { singleplayerMode }, disableClose: true }
    );

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result?.data) {
        return;
      }
      const { numberOfPlayer, difficulty, gameId } = result.data;
      await this.createGame(numberOfPlayer, difficulty, gameId);
    });
  }

  private async createGame(numberOfPlayer: number, difficulty: string, gameId: string) {
    const game = this.gameFactory.buildNewGame(numberOfPlayer, difficulty, gameId);

    this.currentGameId = gameId;
    this.store.dispatch(new CurrentGameAction(gameId));
    this.store.dispatch(new CurrentGameData(game));
    this.store.dispatch(new CreateNewMobAction(game.Mob));

    try {
      await this.gameRepo.createGame(gameId, this.JSON.gameToJSON(game));
      // "Meine Spiele" (Issue #78): nur für Multiplayer - Singleplayer hat kein Account-Konzept,
      // localSaves oben deckt dessen Spielübersicht bereits ab.
      if (!isLocalGameId(gameId)) {
        await this.userRepo.addJoinedGame(this.currentUserId(), gameId);
      }
      this.route.navigate([(isLocalGameId(gameId) ? '/local-game/' : '/game/') + gameId]);
    } catch {
      this.startscreenError = 'Das Spiel konnte nicht erstellt werden. Bitte erneut versuchen.';
    }
  }

  startTutorial(): void {
    this.store.dispatch(new StartTutorial());
  }

  logout() {
    signOut(this.auth)
    .then (()=> {
      this.route.navigate(['signIn'])
    })
  }

  /** `gameId`: explizit übergeben beim Fortsetzen aus "Meine Spiele" (Issue #78) - ohne Argument
   * wird wie bisher das manuelle Eingabefeld gelesen. */
  async joinGame(gameId?: string) {
    const inputValue = (gameId ?? this.joinGameId).trim();
    if (!inputValue) {
      return;
    }
    await this.authForm.ensureAnonymousSession();
    this.gameRepo.getGame(inputValue)
    .then(async (results)=> {
      if (!results) {
        this.startscreenError = 'Kein Spiel mit dieser ID gefunden.';
        return;
      }
      this.startscreenError = null;
      this.store.dispatch(new SetNewEnemy(results['currentEnemy']));
      this.store.dispatch(new UpdateMobAction(results['Mob']));
      await this.userRepo.addJoinedGame(this.currentUserId(), inputValue);
      this.route.navigate(['/game/'+ inputValue]);
      this.store.dispatch(new CurrentGameAction(inputValue));
    })
    .catch(() => {
      this.startscreenError = 'Kein Spiel mit dieser ID gefunden.';
    })
  }
}
