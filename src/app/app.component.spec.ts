import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideStore } from '@ngxs/store';
import { AppComponent } from './app.component';
import { TutorialState } from './states/tutorial-state';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
        RouterTestingModule,
        AppComponent,
    ],
    // Seit dem eingehaengten <app-tutorial-overlay-container> (Issue #54, PR 1) braucht
    // AppComponent einen NGXS-Store - provideStore() statt eines vollen provideStore(...)-Setups
    // aus app.config.ts reicht, da hier nur TutorialState gelesen wird.
    providers: [provideStore([TutorialState])],
}).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'hero-dungeon'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('hero-dungeon');
  });

  it('should render a router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
