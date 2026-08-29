import { Routes } from '@angular/router';
import { canActivate, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { GameComponent } from './components/game/game.component';
import { SigninComponent } from './components/signin/signin.component';
import { SignupComponent } from './components/signup/signup.component';
import { StartscreenComponent } from './components/startscreen/startscreen.component';

export const routes: Routes = [
  { path: '', redirectTo: 'startscreen', pathMatch: 'full' },
  { path: 'signIn', component: SigninComponent, ...canActivate(() => redirectLoggedInTo(['startscreen'])) },
  { path: 'signUp', component: SignupComponent, ...canActivate(() => redirectLoggedInTo(['startscreen'])) },
  { path: 'startscreen', component: StartscreenComponent, ...canActivate(() => redirectUnauthorizedTo(['signIn'])) },
  { path: 'game/:id', component: GameComponent, ...canActivate(() => redirectUnauthorizedTo(['game/:id'])) },
];
