import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { CurrentGameAction } from 'src/app/actions/currentGame-action';
import { LocalSingleplayerSave, LocalSingleplayerSaveService } from 'src/app/services/local-singleplayer-save.service';

/**
 * In-Game-Menü (Issue #74, PR 2 aus docs/planned/login-multiplayer-onboarding-plan.md) -
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

  isOpen = signal(false);
  /** Reine Bestätigungs-Anzeige - es gibt keinen zusätzlichen Schreibvorgang, weil jede
   * Spielaktion (CardPlayService/HeropowerService) bereits synchron über
   * FirestoreRepositoryService/LocalGameDocumentStoreService persistiert wird (siehe
   * services/CLAUDE.md). Der Button bestätigt dem Nutzer nur, dass der Save existiert. */
  saveConfirmed = signal(false);

  constructor(
    private localSaves: LocalSingleplayerSaveService,
    private store: Store,
    private router: Router
  ) {}

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

  /** "Spielstände laden": GameComponent/PlayerHandComponent laden den Rest beim Betreten der
   * Route selbst (loadLocalGameOnce()), analog zu StartscreenComponent.resumeLocalSave(). */
  resumeSave(saveId: string): void {
    this.store.dispatch(new CurrentGameAction(saveId));
    this.router.navigate(['/local-game/' + saveId]);
  }

  /** Analog zu StartscreenComponent.heroNameOf() - `player` ist ein loses Feld-Bag, vor der
   * Heldenauswahl existiert `choosenHero` noch nicht. */
  saveLabel(save: LocalSingleplayerSave): string {
    const choosenHero = save.player['choosenHero'] as { heroname?: string } | undefined;
    return choosenHero?.heroname ?? save.saveId;
  }
}
