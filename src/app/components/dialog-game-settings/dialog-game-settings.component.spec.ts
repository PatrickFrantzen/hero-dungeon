import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogGameSettings } from './dialog-game-settings.component';

describe('DialogChooseHeroComponent', () => {
  let component: DialogGameSettings;
  let fixture: ComponentFixture<DialogGameSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogGameSettings ]
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
