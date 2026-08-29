import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgxsModule } from '@ngxs/store';
import { CurrentUserState } from 'src/app/states/currentUser-state';
import { heropowerState } from 'src/app/states/heropower-state';

import { HeropowerComponent } from './heropower.component';

describe('HeropowerComponent', () => {
  let component: HeropowerComponent;
  let fixture: ComponentFixture<HeropowerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [NgxsModule.forRoot([CurrentUserState, heropowerState]), HeropowerComponent],
    schemas: [NO_ERRORS_SCHEMA],
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
