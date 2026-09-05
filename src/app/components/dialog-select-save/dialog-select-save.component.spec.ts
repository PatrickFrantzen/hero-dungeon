import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { DialogSelectSaveComponent, DialogSelectSaveData } from './dialog-select-save.component';
import { LocalSingleplayerSaveService } from 'src/app/services/local-singleplayer-save.service';

describe('DialogSelectSaveComponent', () => {
  let component: DialogSelectSaveComponent;
  let fixture: ComponentFixture<DialogSelectSaveComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<unknown>>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let localSaves: jasmine.SpyObj<LocalSingleplayerSaveService>;

  const data: DialogSelectSaveData = {
    entries: [
      { id: 'sp-old', label: 'Barbar', mode: 'singleplayer', lastPlayedAt: 100 },
      { id: 'mp-new', label: 'game-2', mode: 'multiplayer', lastPlayedAt: 300 },
      { id: 'mp-legacy', label: 'game-3', mode: 'multiplayer', lastPlayedAt: null },
    ],
  };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    matDialog = jasmine.createSpyObj('MatDialog', ['open']);
    localSaves = jasmine.createSpyObj('LocalSingleplayerSaveService', ['deleteSave']);

    await TestBed.configureTestingModule({
      imports: [DialogSelectSaveComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialog, useValue: matDialog },
        { provide: LocalSingleplayerSaveService, useValue: localSaves },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogSelectSaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sorts entries by lastPlayedAt descending, with unknown timestamps last', () => {
    expect(component.entries().map((e) => e.id)).toEqual(['mp-new', 'sp-old', 'mp-legacy']);
  });

  it('select() closes the dialog with the chosen entry id and mode', () => {
    component.select(data.entries[0]);

    expect(dialogRef.close).toHaveBeenCalledWith({ data: { selectedId: 'sp-old', mode: 'singleplayer' } });
  });

  it('formatLastPlayed() shows "Unbekannt" for a missing timestamp', () => {
    expect(component.formatLastPlayed(null)).toBe('Unbekannt');
    expect(component.formatLastPlayed(100)).not.toBe('Unbekannt');
  });

  it('delete() removes the entry locally after confirmation, without deleting on cancel', () => {
    const confirmRef = { afterClosed: () => of({ data: { confirmed: false } }) };
    matDialog.open.and.returnValue(confirmRef as never);

    component.delete(data.entries[0]);

    expect(localSaves.deleteSave).not.toHaveBeenCalled();
    expect(component.entries().some((e) => e.id === 'sp-old')).toBe(true);
  });

  it('delete() calls LocalSingleplayerSaveService and removes the entry once confirmed', () => {
    const confirmRef = { afterClosed: () => of({ data: { confirmed: true } }) };
    matDialog.open.and.returnValue(confirmRef as never);

    component.delete(data.entries[0]);

    expect(localSaves.deleteSave).toHaveBeenCalledWith('sp-old');
    expect(component.entries().some((e) => e.id === 'sp-old')).toBe(false);
  });

  it('onCancel closes the dialog without a result', () => {
    component.onCancel();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
