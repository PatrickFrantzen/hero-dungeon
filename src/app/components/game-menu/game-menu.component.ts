import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { CurrentGameAction } from 'src/app/actions/currentGame-action';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectors';
import { LocalSingleplayerSave, LocalSingleplayerSaveService } from 'src/app/services/local-singleplayer-save.service';
import { JoinedGame, UserRepositoryService } from 'src/app/services/user-repository.service';
import { DialogLinkAccountComponent } from '../dialog-link-account/dialog-link-account.component';
import { DialogConfirmComponent, DialogConfirmResult } from '../dialog-confirm/dialog-confirm.component';
import { SaveListEntry, openSaveSelector } from '../dialog-select-save/dialog-select-save.component';

/**
 * In-Game-Menü (Issue #74, PR 2 aus docs/done/login-multiplayer-onboarding-plan.md) -
 * permanent erreichbar unabhängig von currentGameStatus(), eingebunden in game.component.html.
 * Presenter im Sinne des Issues, greift aber direkt auf LocalSingleplayerSaveService/Store zu
 * (kein eigener Container nötig, analog zu game.component.ts/startscreen/, siehe
 * components/CLAUDE.md).
 */
@Component({
  selector: 'app-game-menu',
  templateUrl: './game-menu.component.html',
  styleUrl: './game-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameMenuComponent {
  isSingleplayer = input.required<boolean>();
  gameId = input.required<string>();
  leave = output<void>();
  /** Issue #85: GameComponent führt das eigentliche Löschen aus (braucht dafür `this.players`/
   * `currentUserId()`, die GameMenuComponent nicht kennt) - emittiert erst NACH Bestätigung
   * durch den Nutzer (siehe confirmDeleteMultiplayerGame()). */
  deleteGame = output<void>();

  isOpen = signal(false);
  /** Reine Bestätigungs-Anzeige - es gibt keinen zusätzlichen Schreibvorgang, weil jede
   * Spielaktion (CardPlayService/HeropowerService) bereits synchron über
   * FirestoreRepositoryService/LocalGameDocumentStoreService persistiert wird (siehe
   * services/CLAUDE.md). Der Button bestätigt dem Nutzer nur, dass der Save existiert. */
  saveConfirmed = signal(false);

  /** "Meine Spiele" (Issue #78) - Multiplayer-Historie aus `users/{uid}.games`, analog zu
   * StartscreenComponent. Nur relevant, solange das Menü im Multiplayer-Modus ist - lädt
   * trotzdem unabhängig von isOpen(), damit die Liste beim ersten Öffnen bereits da ist. */
  myGames = signal<JoinedGame[]>([]);
  private currentUserId = this.store.selectSignal(CurrentUserSelectors.currentUserId);

  constructor(
    private localSaves: LocalSingleplayerSaveService,
    private store: Store,
    private router: Router,
    private userRepo: UserRepositoryService,
    private auth: Auth,
    private dialog: MatDialog
  ) {
    effect(() => {
      if (this.isSingleplayer()) {
        return;
      }
      const userId = this.currentUserId();
      if (!userId) {
        return;
      }
      this.userRepo.getJoinedGames(userId).then((games) => this.myGames.set(games));
    });
  }

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  onLeave(): void {
    this.leave.emit();
  }

  onSave(): void {
    this.saveConfirmed.set(!!this.localSaves.getSave(this.gameId()));
  }

  listSaves(): LocalSingleplayerSave[] {
    return this.localSaves.listSaves();
  }

  hasSaves(): boolean {
    return this.isSingleplayer() ? this.listSaves().length > 0 : this.myGames().length > 0;
  }

  /** "Spielstände laden" (Singleplayer) bzw. "Meine Spiele" (Multiplayer) - ersetzt die
   * bisherigen inline gerenderten Listen durch denselben Auswahldialog wie
   * StartscreenComponent.openSaveDialog(). `isSingleplayer()` entscheidet bereits, welche der
   * beiden Listen überhaupt geladen wird (siehe effect() oben), daher enthält `entries` hier nie
   * beide Modi gleichzeitig. */
  openSaveDialog(): void {
    const entries: SaveListEntry[] = this.isSingleplayer()
      ? this.listSaves().map((save): SaveListEntry => ({ id: save.saveId, label: this.saveLabel(save), mode: 'singleplayer', lastPlayedAt: save.updatedAt }))
      : this.myGames().map((game): SaveListEntry => ({ id: game.gameId, label: game.gameId, mode: 'multiplayer', lastPlayedAt: game.lastPlayedAt || null }));

    openSaveSelector(this.dialog, entries).subscribe((result) => {
      if (!result) {
        return;
      }
      this.store.dispatch(new CurrentGameAction(result.selectedId));
      this.router.navigate([(result.mode === 'singleplayer' ? '/local-game/' : '/game/') + result.selectedId]);
    });
  }

  /** "Account verknüpfen" (Issue #78) - nur sinnvoll für einen anonym eingeloggten Multiplayer-
   * Nutzer (signInAnonymously() aus StartscreenComponent.newGame()/joinGame()); ein bereits
   * verknüpfter/registrierter Account hat `isAnonymous: false` und braucht den Button nicht
   * mehr. Singleplayer hat kein Auth-Konzept, siehe game-menu/CLAUDE.md. */
  canLinkAccount(): boolean {
    return !this.isSingleplayer() && !!this.auth.currentUser?.isAnonymous;
  }

  openLinkAccountDialog(): void {
    this.dialog.open(DialogLinkAccountComponent, { disableClose: false });
  }

  /** Analog zu StartscreenComponent.heroNameOf() - `player` ist ein loses Feld-Bag, vor der
   * Heldenauswahl existiert `choosenHero` noch nicht. */
  saveLabel(save: LocalSingleplayerSave): string {
    const choosenHero = save.player['choosenHero'] as { heroname?: string } | undefined;
    return choosenHero?.heroname ?? save.saveId;
  }

  private openConfirmDialog(title: string, message: string, onConfirmed: () => void): void {
    this.dialog
      .open<DialogConfirmComponent, unknown, { data: DialogConfirmResult }>(DialogConfirmComponent, {
        data: { title, message },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.data.confirmed) {
          onConfirmed();
        }
      });
  }

  /** "Spielstand löschen" für Singleplayer (Issue #85) - im Unterschied zu "Verlassen"
   * (`onLeave()`, reine Navigation) eine destruktive Aktion, deshalb eigener Button + eigener
   * Bestätigungsdialog. Löscht direkt über LocalSingleplayerSaveService (analog zu onSave()
   * oben) und navigiert danach zum Startscreen. */
  confirmDeleteSingleplayerSave(): void {
    this.openConfirmDialog(
      'Spielstand löschen?',
      'Dieser lokale Spielstand wird unwiderruflich gelöscht.',
      () => {
        this.localSaves.deleteSave(this.gameId());
        this.router.navigate(['/startscreen']);
      }
    );
  }

  /** "Spielstand löschen" für Multiplayer (Issue #85) - emittiert `deleteGame` erst nach
   * Bestätigung; GameComponent führt die eigentliche Löschung aus (siehe deleteGame oben). */
  confirmDeleteMultiplayerGame(): void {
    this.openConfirmDialog(
      'Spielstand löschen?',
      'Du wirst aus diesem Spiel entfernt. Die übrigen Mitspieler können ohne dich weiterspielen.',
      () => this.deleteGame.emit()
    );
  }
}
