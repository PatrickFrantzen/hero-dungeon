import { TestBed } from '@angular/core/testing';

import { CurrentEnemyService } from './current-enemy.service';

describe('CurrentEnemyService', () => {
  let service: CurrentEnemyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurrentEnemyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
