import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DialogConfirmComponent, DialogConfirmData } from './dialog-confirm.component';

describe('DialogConfirmComponent', () => {
  let component: DialogConfirmComponent;
  let fixture: ComponentFixture<DialogConfirmComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<unknown>>;

  const data: DialogConfirmData = { title: 'Spielstand löschen?', message: 'Das kann nicht rückgängig gemacht werden.' };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [DialogConfirmComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the injected title/message', () => {
    expect(component.data).toEqual(data);
  });

  it('onConfirm closes the dialog with confirmed: true', () => {
    component.onConfirm();

    expect(dialogRef.close).toHaveBeenCalledWith({ data: { confirmed: true } });
  });

  it('onCancel closes the dialog without a result', () => {
    component.onCancel();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
