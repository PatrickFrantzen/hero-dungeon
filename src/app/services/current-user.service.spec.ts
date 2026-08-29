import { TestBed } from '@angular/core/testing';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { NgxsModule } from '@ngxs/store';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { CurrentUserService } from './current-user.service';

describe('CurrentUserService', () => {
  let service: CurrentUserService;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();

    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([])],
      providers: [...firestoreTestProviders(), provideAuth(() => getAuth())],
    });

    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(CurrentUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
