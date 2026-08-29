import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DialogGameSettings } from './dialog-game-settings.component';

describe('DialogChooseHeroComponent', () => {
  let component: DialogGameSettings;
  let fixture: ComponentFixture<DialogGameSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DialogGameSettings],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => { } } },
    ],
})
    .compileComponents();

    fixture = TestBed.createComponent(DialogGameSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
