import { ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFormService } from 'src/app/services/auth-form.service';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { MatCard, MatCardHeader, MatCardContent, MatCardFooter } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-signin',
    templateUrl: './signin.component.html',
    styleUrls: ['./signin.component.scss'],
    imports: [FormsModule, ReactiveFormsModule, RouterLink, MatCard, MatCardHeader, MatCardContent, MatFormField, MatLabel, MatInput, MatCardFooter, MatButton],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SigninComponent implements OnInit{

  public logInForm!: FormGroup;
  public errorMessage: string | null = null;
  public isSubmitting = false;

  constructor(
    private authForm: AuthFormService,
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

  async logIn() {
    this.errorMessage = null;
    this.isSubmitting = true;
    try {
      await this.authForm.login(this.logInForm.value.email, this.logInForm.value.password);
      this.route.navigate(['startscreen']);
      this.currentUserService.getCurrentUser();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Login fehlgeschlagen: E-Mail oder Passwort ist falsch.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
