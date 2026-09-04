import { TestBed } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { CurrentGameData } from 'src/app/actions/currentGame-action';
import { EncounterSelectors } from 'src/app/selectors/encounter-selector';
import { Game } from 'src/models/game';

import { EncounterState } from './encounter-state';

describe('EncounterState', () => {
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([EncounterState])],
    });
    store = TestBed.inject(Store);
  });

  // Issue #83 (zusammengeführt in #87): CardPlayService.checkForNextEnemy() ruft bei besiegtem
  // Boss this.currentAllBosses().length auf - wäre allBosses undefined, würde das synchron mit
  // einem TypeError abbrechen, bevor der Timer eingefroren/gameStatus gesetzt wird ("Timer läuft
  // weiter, keine Buttons"-Symptom). Kein bestätigter Root Cause für #83, nur eine zusätzliche
  // Absicherung analog zum bestehenden `?? []`-Muster bei anderen Feldern in diesem Projekt.
  it('setGameData (CurrentGameData) defaults allBosses to an empty array when the incoming game object lacks it', () => {
    const gameWithoutAllBosses = { gameId: 'game-1' } as unknown as Game;

    store.dispatch(new CurrentGameData(gameWithoutAllBosses));

    expect(store.selectSnapshot(EncounterSelectors.currentAllBosses)).toEqual([]);
  });

  it('setGameData (CurrentGameData) keeps a provided allBosses array as-is', () => {
    const game = { gameId: 'game-1', allBosses: [{ name: 'Boss', token: [], type: 'Boss' }] } as unknown as Game;

    store.dispatch(new CurrentGameData(game));

    expect(store.selectSnapshot(EncounterSelectors.currentAllBosses)).toEqual([{ name: 'Boss', token: [], type: 'Boss' }]);
  });
});
