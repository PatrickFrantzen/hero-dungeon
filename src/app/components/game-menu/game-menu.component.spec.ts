import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Auth } from '@angular/fire/auth';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { Game } from 'src/models/game';
import { LocalSingleplayerSaveService } from 'src/app/services/local-singleplayer-save.service';
import { UserRepositoryService } from 'src/app/services/user-repository.service';
import { CurrentUserAction } from 'src/app/actions/currentUser-action';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { CurrentUserState } from 'src/app/states/currentUser-state';
import { DialogLinkAccountComponent } from '../dialog-link-account/dialog-link-account.component';
import { DialogConfirmComponent } from '../dialog-confirm/dialog-confirm.component';
import { DialogSelectSaveComponent } from '../dialog-select-save/dialog-select-save.component';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { GameMenuComponent } from './game-menu.component';

describe('GameMenuComponent', () => {
  let component: GameMenuComponent;
  let fixture: ComponentFixture<GameMenuComponent>;

  beforeEach(async () => {
    ensureFirebaseTestAppInitialized();

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MatDialogModule,
        NgxsModule.forRoot([CurrentGameState, CurrentUserState]),
        GameMenuComponent,
      ],
      providers: [...firestoreTestProviders(), { provide: Auth, useValue: { currentUser: null } }],
    }).compileComponents();

    ensureAngularFireSchedulersInitialized();
    fixture = TestBed.createComponent(GameMenuComponent);
    fixture.componentRef.setInput('isSingleplayer', true);
    fixture.componentRef.setInput('gameId', 'local-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts closed', () => {
    expect(component.isOpen()).toBeFalse();
  });

  it('toggle() opens the closed menu', () => {
    component.toggle();

    expect(component.isOpen()).toBeTrue();
  });

  it('toggle() closes the open menu again', () => {
    component.toggle();
    component.toggle();

    expect(component.isOpen()).toBeFalse();
  });

  it('emits leave when the user clicks "Verlassen"', () => {
    let emitted = false;
    component.leave.subscribe(() => (emitted = true));

    component.onLeave();

    expect(emitted).toBeTrue();
  });

  it('listSaves() lists the saves for "Spielstände laden"', () => {
    localStorage.clear();
    TestBed.inject(LocalSingleplayerSaveService).createSave({
      saveId: 'local-9',
      updatedAt: Date.now(),
      game: {} as Game,
      player: {},
    });

    expect(component.listSaves().map((save) => save.saveId)).toEqual(['local-9']);
    localStorage.clear();
  });

  it('onSave confirms once the save already exists (auto-save already wrote it)', () => {
    localStorage.clear();
    TestBed.inject(LocalSingleplayerSaveService).createSave({
      saveId: 'local-1',
      updatedAt: Date.now(),
      game: {} as Game,
      player: {},
    });

    component.onSave();

    expect(component.saveConfirmed()).toBeTrue();
    localStorage.clear();
  });

  it('openSaveDialog resumes the selected local save and navigates to it', () => {
    const dialog = TestBed.inject(MatDialog);
    const dialogOpen = spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of({ data: { selectedId: 'local-7', mode: 'singleplayer' } }),
    } as never);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.openSaveDialog();

    expect(dialogOpen).toHaveBeenCalledWith(DialogSelectSaveComponent, jasmine.anything());
    expect(TestBed.inject(Store).selectSnapshot(CurrentGameSelectors.currentGame)).toBe('local-7');
    expect(router.navigate).toHaveBeenCalledWith(['/local-game/local-7']);
  });

  it('openSaveDialog does nothing when the dialog is cancelled', () => {
    const dialog = TestBed.inject(MatDialog);
    spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as never);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.openSaveDialog();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  describe('"Meine Spiele" für Multiplayer (Issue #78)', () => {
    function createMultiplayerFixture(): ComponentFixture<GameMenuComponent> {
      const mpFixture = TestBed.createComponent(GameMenuComponent);
      mpFixture.componentRef.setInput('isSingleplayer', false);
      mpFixture.componentRef.setInput('gameId', 'game-1');
      mpFixture.detectChanges();
      return mpFixture;
    }

    it('loads the joined-games list for the current account once its id is available', async () => {
      const userRepo = TestBed.inject(UserRepositoryService);
      spyOn(userRepo, 'getUser').and.resolveTo({ games: ['game-1', 'game-2'] });
      const store = TestBed.inject(Store);
      const mpFixture = createMultiplayerFixture();

      store.dispatch(new CurrentUserAction('user-1', 'Alice'));
      mpFixture.detectChanges();
      await mpFixture.whenStable();

      expect(mpFixture.componentInstance.myGames()).toEqual([
        { gameId: 'game-1', lastPlayedAt: 0 },
        { gameId: 'game-2', lastPlayedAt: 0 },
      ]);
      mpFixture.destroy();
    });

    it('openSaveDialog resumes the selected multiplayer game and navigates to it', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      const dialog = TestBed.inject(MatDialog);
      spyOn(dialog, 'open').and.returnValue({
        afterClosed: () => of({ data: { selectedId: 'game-7', mode: 'multiplayer' } }),
      } as never);
      const mpFixture = createMultiplayerFixture();

      mpFixture.componentInstance.openSaveDialog();

      expect(TestBed.inject(Store).selectSnapshot(CurrentGameSelectors.currentGame)).toBe('game-7');
      expect(router.navigate).toHaveBeenCalledWith(['/game/game-7']);
      mpFixture.destroy();
    });

    it('openLinkAccountDialog opens the DialogLinkAccountComponent', () => {
      const auth = TestBed.inject(Auth) as unknown as { currentUser: { isAnonymous: boolean } | null };
      auth.currentUser = { isAnonymous: true };
      const mpFixture = createMultiplayerFixture();
      const dialog = TestBed.inject(MatDialog);
      const dialogOpen = spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as never);

      mpFixture.componentInstance.openLinkAccountDialog();

      expect(dialogOpen).toHaveBeenCalledWith(DialogLinkAccountComponent, jasmine.anything());
      mpFixture.destroy();
    });

    it('canLinkAccount is true only for an anonymous account in a multiplayer game', () => {
      const auth = TestBed.inject(Auth) as unknown as { currentUser: { isAnonymous: boolean } | null };

      auth.currentUser = { isAnonymous: true };
      const anonymousMpFixture = createMultiplayerFixture();
      expect(anonymousMpFixture.componentInstance.canLinkAccount()).toBeTrue();
      anonymousMpFixture.destroy();

      auth.currentUser = { isAnonymous: false };
      const linkedMpFixture = createMultiplayerFixture();
      expect(linkedMpFixture.componentInstance.canLinkAccount()).toBeFalse();
      linkedMpFixture.destroy();

      auth.currentUser = { isAnonymous: true };
      expect(component.canLinkAccount()).toBeFalse();
    });
  });

  describe('"Spielstand löschen" (Issue #85)', () => {
    it('confirmDeleteSingleplayerSave asks for confirmation before deleting anything', () => {
      const dialog = TestBed.inject(MatDialog);
      const dialogOpen = spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as never);
      const localSaves = TestBed.inject(LocalSingleplayerSaveService);
      const deleteSave = spyOn(localSaves, 'deleteSave');

      component.confirmDeleteSingleplayerSave();

      expect(dialogOpen).toHaveBeenCalledWith(DialogConfirmComponent, jasmine.anything());
      expect(deleteSave).not.toHaveBeenCalled();
    });

    it('confirmDeleteSingleplayerSave deletes the save and navigates to /startscreen once confirmed', () => {
      const dialog = TestBed.inject(MatDialog);
      spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of({ data: { confirmed: true } }) } as never);
      const localSaves = TestBed.inject(LocalSingleplayerSaveService);
      const deleteSave = spyOn(localSaves, 'deleteSave');
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      component.confirmDeleteSingleplayerSave();

      expect(deleteSave).toHaveBeenCalledWith('local-1');
      expect(router.navigate).toHaveBeenCalledWith(['/startscreen']);
    });

    it('confirmDeleteSingleplayerSave does nothing when the dialog is cancelled', () => {
      const dialog = TestBed.inject(MatDialog);
      spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as never);
      const localSaves = TestBed.inject(LocalSingleplayerSaveService);
      const deleteSave = spyOn(localSaves, 'deleteSave');

      component.confirmDeleteSingleplayerSave();

      expect(deleteSave).not.toHaveBeenCalled();
    });

    it('confirmDeleteMultiplayerGame emits deleteGame only once confirmed', () => {
      const dialog = TestBed.inject(MatDialog);
      spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of({ data: { confirmed: true } }) } as never);
      const deleteGameEmitted = jasmine.createSpy('deleteGame');
      component.deleteGame.subscribe(deleteGameEmitted);

      component.confirmDeleteMultiplayerGame();

      expect(deleteGameEmitted).toHaveBeenCalled();
    });

    it('confirmDeleteMultiplayerGame does not emit deleteGame when cancelled', () => {
      const dialog = TestBed.inject(MatDialog);
      spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as never);
      const deleteGameEmitted = jasmine.createSpy('deleteGame');
      component.deleteGame.subscribe(deleteGameEmitted);

      component.confirmDeleteMultiplayerGame();

      expect(deleteGameEmitted).not.toHaveBeenCalled();
    });
  });
});
