import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DialogGameSettingsComponent } from './dialog-game-settings.component';

describe('DialogChooseHeroComponent', () => {
  let component: DialogGameSettingsComponent;
  let fixture: ComponentFixture<DialogGameSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DialogGameSettingsComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
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
});
