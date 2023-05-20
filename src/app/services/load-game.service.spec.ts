import { TestBed } from '@angular/core/testing';

import { LoadGameService } from './load-game.service';

describe('LoadGameService', () => {
  let service: LoadGameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
