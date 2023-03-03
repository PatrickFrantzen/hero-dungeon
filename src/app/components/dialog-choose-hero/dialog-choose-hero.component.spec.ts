import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogChooseHeroComponent } from './dialog-choose-hero.component';

describe('DialogChooseHeroComponent', () => {
  let component: DialogChooseHeroComponent;
  let fixture: ComponentFixture<DialogChooseHeroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogChooseHeroComponent ]
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
