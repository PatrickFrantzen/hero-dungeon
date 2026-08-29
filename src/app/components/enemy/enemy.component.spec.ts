import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { EnemyComponent } from './enemy.component';

describe('EnemyComponent', () => {
  let component: EnemyComponent;
  let fixture: ComponentFixture<EnemyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [EnemyComponent],
    schemas: [NO_ERRORS_SCHEMA],
})
    .compileComponents();

    fixture = TestBed.createComponent(EnemyComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentEnemy', { name: '', token: [], type: '' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
