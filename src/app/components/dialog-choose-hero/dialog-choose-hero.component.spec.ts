import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { DialogChooseHeroComponent } from './dialog-choose-hero.component';

describe('DialogChooseHeroComponent', () => {
  let component: DialogChooseHeroComponent;
  let fixture: ComponentFixture<DialogChooseHeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [DialogChooseHeroComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: MatDialogRef, useValue: { close: () => { } } },
    ],
})
    .compileComponents();

    fixture = TestBed.createComponent(DialogChooseHeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
