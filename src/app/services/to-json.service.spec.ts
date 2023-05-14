import { TestBed } from '@angular/core/testing';

import { ToJSONService } from './to-json.service';

describe('ToJSONService', () => {
  let service: ToJSONService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToJSONService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
