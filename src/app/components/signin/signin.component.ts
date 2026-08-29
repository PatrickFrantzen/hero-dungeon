import { ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { FormBuilder, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { MatCard, MatCardHeader, MatCardContent, MatCardFooter } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-signin',
    templateUrl: './signin.component.html',
    styleUrls: ['./signin.component.scss'],
    imports: [FormsModule, ReactiveFormsModule, MatCard, MatCardHeader, MatCardContent, MatFormField, MatLabel, MatInput, MatCardFooter, MatButton],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SigninComponent implements OnInit{

  public logInForm!: FormGroup;
  public errorMessage: string | null = null;
  public isSubmitting = false;

  constructor(
    public auth: Auth,
    private fb: FormBuilder,
    private route: Router,
    public currentUserService: CurrentUserService,
  ) {}

  ngOnInit(): void {
    this.logInForm = this.fb.group({
      email : new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    })
    this.currentUserService.getCurrentUser();
  }

  logIn() {
    this.errorMessage = null;
    this.isSubmitting = true;
    signInWithEmailAndPassword(this.auth, this.logInForm.value.email, this.logInForm.value.password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      this.route.navigate(['startscreen']);
      this.currentUserService.getCurrentUser()
    })
    .catch((error) => {
      this.errorMessage = 'Login fehlgeschlagen: E-Mail oder Passwort ist falsch.';
    })
    .finally(() => {
      this.isSubmitting = false;
    })
  }

  redirectToSignUp() {
    this.route.navigate(['signUp']);
  }
}
