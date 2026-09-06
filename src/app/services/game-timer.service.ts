import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { select, Store } from '@ngxs/store';
import { UpdateGameStatus } from 'src/app/actions/currentGame-action';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { GameRepositoryService } from './game-repository.service';

/**
 * Extrahiert aus `GameComponent` (T4, Component-Refactoring-Audit) — das clientseitige
 * Herunterzählen des Dungeon-Timers (siehe `components/game/CLAUDE.md`, Abschnitt
 * "Dungeon-Timer"). Start/Pause/Reset des Timers selbst bleiben unverändert in
 * `CardPlayService`/`HeropowerService` (schreiben den Store-State, den dieser Service nur
 * liest) — dieser Service ist ausschließlich der "Countdown anzeigen + bei Ablauf verlieren"-
 * Teil. Component-scoped (`providers: [GameTimerService]` in `GameComponent`, nicht
 * `providedIn: 'root'`), da `now`/`timerInterval`/`timeoutReported` pro Spiel-Instanz gelten.
 */
@Injectable()
export class GameTimerService {
  private store = inject(Store);
  private gameRepo = inject(GameRepositoryService);

  private timerStartedAt = select(CurrentGameSelectors.currentTimerStartedAt);
  private timerDurationSeconds = select(CurrentGameSelectors.currentTimerDurationSeconds);
  private timerPausedAt = select(CurrentGameSelectors.currentTimerPausedAt);
  private timerPausedSecondsTotal = select(CurrentGameSelectors.currentTimerPausedSecondsTotal);
  private currentGameStatus = select(CurrentGameSelectors.currentGameStatus);

  private now = signal(Date.now());
  private timerInterval?: ReturnType<typeof setInterval>;
  private timeoutReported = false;

  readonly hasStarted = computed(() => this.timerStartedAt() !== null);
  readonly isTimerPaused = computed(() => this.timerPausedAt() !== null);
  readonly remainingSeconds = computed(() => {
    const startedAt = this.timerStartedAt();
    if (startedAt === null) return this.timerDurationSeconds();

    const pausedAt = this.timerPausedAt();
    const clockAt = pausedAt ?? this.now();
    const elapsedSeconds = Math.floor((clockAt - startedAt) / 1000) - Math.floor(this.timerPausedSecondsTotal());
    return Math.max(0, this.timerDurationSeconds() - elapsedSeconds);
  });
  readonly formattedRemainingTime = computed(() => {
    const remaining = this.remainingSeconds();
    const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
    const seconds = (remaining % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    });
  }

  /** Startet den 1s-Tick. `onTimeout` wird aufgerufen, wenn der Firestore-Write nach Ablauf der
   * Zeit fehlschlägt (Aufrufer zeigt dafür seine eigene Fehlermeldung). */
  start(gameId: () => string, onTimeoutWriteFailed: () => void): void {
    this.timerInterval = setInterval(() => {
      this.now.set(Date.now());
      this.markGameLostWhenTimerRunsOut(gameId, onTimeoutWriteFailed);
    }, 1000);
  }

  /** Nach `continueToNextDungeon()`/`retryCampaign()`: ein späteres erneutes Ablaufen soll
   * wieder auslösen, nicht durch das Flag vom vorherigen Dungeon unterdrückt werden. */
  resetTimeoutReported(): void {
    this.timeoutReported = false;
  }

  private markGameLostWhenTimerRunsOut(gameId: () => string, onTimeoutWriteFailed: () => void): void {
    if (
      this.timeoutReported ||
      this.timerStartedAt() === null ||
      this.remainingSeconds() > 0 ||
      this.currentGameStatus() !== 'playing'
    ) {
      return;
    }

    this.timeoutReported = true;
    this.store.dispatch(new UpdateGameStatus('lost'));
    this.gameRepo.updateGameStatus(gameId(), 'lost').catch(onTimeoutWriteFailed);
  }
}
