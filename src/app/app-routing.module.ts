import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameComponent } from './components/game/game.component';
import { SigninComponent } from './components/signin/signin.component';
import { SignupComponent } from './components/signup/signup.component';
import { StartscreenComponent } from './components/startscreen/startscreen.component';
import { redirectLoggedInTo, canActivate, redirectUnauthorizedTo} from '@angular/fire/auth-guard'

const routes: Routes = [
  {path: '', redirectTo: 'startscreen', pathMatch:'full'},
  {path: 'signIn', component:SigninComponent, ...canActivate( () => redirectLoggedInTo(['startscreen']))},
  {path: 'signUp', component: SignupComponent, ...canActivate( () => redirectLoggedInTo(['startscreen']))},
  {path: 'startscreen', component: StartscreenComponent, ...canActivate(() => redirectUnauthorizedTo(['signIn']))},
  {path: 'game/:id', component: GameComponent, ...canActivate(() => redirectUnauthorizedTo(['game/:id']))},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
