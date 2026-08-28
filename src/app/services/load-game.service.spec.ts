import { TestBed } from '@angular/core/testing';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';
import { ɵAngularFireSchedulers } from '@angular/fire';

import { LoadGameService } from './load-game.service';

describe('LoadGameService', () => {
  let service: LoadGameService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => getFirestore()),
      ],
    });
    TestBed.inject(ɵAngularFireSchedulers);
    service = TestBed.inject(LoadGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
