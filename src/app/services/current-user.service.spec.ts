import { TestBed } from '@angular/core/testing';
import { NgxsModule } from '@ngxs/store';

import { CurrentUserService } from './current-user.service';

describe('CurrentUserService', () => {
  let service: CurrentUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([])],
    });
    service = TestBed.inject(CurrentUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
