import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { isLocalGameId } from 'src/app/services/local-game-id.util';

import { DialogGameSettingsComponent } from './dialog-game-settings.component';

describe('DialogChooseHeroComponent', () => {
  let component: DialogGameSettingsComponent;
  let fixture: ComponentFixture<DialogGameSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DialogGameSettingsComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: MatDialogRef, useValue: { close: () => { } } },
    ],
})
    .compileComponents();

    fixture = TestBed.createComponent(DialogGameSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('generates a local- gameId for singleplayer instead of a Firestore gameId', async () => {
    await TestBed.resetTestingModule().configureTestingModule({
      imports: [DialogGameSettingsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: MAT_DIALOG_DATA, useValue: { singleplayerMode: true } },
      ],
    }).compileComponents();
    const singleplayerFixture = TestBed.createComponent(DialogGameSettingsComponent);
    const singleplayerComponent = singleplayerFixture.componentInstance;
    let result: { gameId: string } | undefined;
    spyOn(singleplayerComponent as unknown as { closeWith: (r: unknown) => void }, 'closeWith').and.callFake(
      (r: unknown) => (result = r as { gameId: string })
    );

    singleplayerComponent.getGameSettings(1, 'easy', 'ignored');

    expect(isLocalGameId(result!.gameId)).toBeTrue();
  });

  it('labels the difficulty options as Lehrling/Held/Dungeon-Master while keeping easy/medium/hard as values (Issue #86)', () => {
    expect(component.difficulties).toEqual([
      { value: 'easy', viewValue: 'Lehrling' },
      { value: 'medium', viewValue: 'Held' },
      { value: 'hard', viewValue: 'Dungeon-Master' },
    ]);
  });
});
