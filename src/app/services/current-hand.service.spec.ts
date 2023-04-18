import { TestBed } from '@angular/core/testing';

import { CurrentHandService } from './current-hand.service';

describe('CurrentHandService', () => {
  let service: CurrentHandService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurrentHandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
