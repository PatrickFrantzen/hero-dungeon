import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeropowerComponent } from './heropower.component';

describe('HeropowerComponent', () => {
  let component: HeropowerComponent;
  let fixture: ComponentFixture<HeropowerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeropowerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeropowerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
