import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { DialogHeropowerComponent } from './dialog-heropower.component';

describe('DialogHeropowerComponent', () => {
  let component: DialogHeropowerComponent;
  let fixture: ComponentFixture<DialogHeropowerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DialogHeropowerComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: MAT_DIALOG_DATA, useValue: [] },
        { provide: MatDialogRef, useValue: { close: () => { } } },
    ],
})
    .compileComponents();

    fixture = TestBed.createComponent(DialogHeropowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
