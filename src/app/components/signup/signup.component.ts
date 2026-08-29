import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFormService } from 'src/app/services/auth-form.service';
import { MatCard, MatCardHeader, MatCardContent, MatCardFooter } from '@angular/material/card';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss'],
    imports: [FormsModule, ReactiveFormsModule, RouterLink, MatCard, MatCardHeader, MatCardContent, MatFormField, MatLabel, MatInput, MatError, MatCardFooter, MatButton],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent implements OnInit {

  public signUpForm!: FormGroup;
  public errorMessage: string | null = null;
  public isSubmitting = false;

  constructor(
    private authForm: AuthFormService,
    private fb: FormBuilder,
    private route: Router,
  ) { }

  ngOnInit(): void {
    this.signUpForm = this.fb.group({
      email : new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(3)]),
      nickname: new FormControl('', Validators.required)
    })
  }


  async register() {
    this.errorMessage = null;
    this.isSubmitting = true;
    try {
      await this.authForm.register(this.signUpForm.value.email, this.signUpForm.value.password, this.signUpForm.value.nickname);
      this.route.navigate(['startscreen'])
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Registrierung fehlgeschlagen. Bitte prüfe deine Eingaben und versuche es erneut.';
    } finally {
      this.isSubmitting = false;
    }
  }


  getEmailErrorMessage() {
    if (this.signUpForm.controls['email'].hasError('required')) {
      return 'You must enter a value';
    }

    return this.signUpForm.controls['email'].hasError('email') ? 'Not a valid email' : '';
  }

  getPasswordErrorMessage() {
    if (this.signUpForm.controls['password'].hasError('required')) {
      return 'You must enter a password';
    }
    return this.signUpForm.controls['password'].hasError('password') ? 'Not a valid password' : '';
  }

  getNicknameErrorMessage() {
    if (this.signUpForm.controls['nickname'].hasError('required')) {
      return 'You must enter a nickname';
    }
    return ''
  }

}


