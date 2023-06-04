import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogHeropowerComponent } from './dialog-heropower.component';

describe('DialogHeropowerComponent', () => {
  let component: DialogHeropowerComponent;
  let fixture: ComponentFixture<DialogHeropowerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogHeropowerComponent ]
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
