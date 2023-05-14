import { Component, OnInit} from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrentUserService } from 'src/app/services/current-user.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit{

  public logInForm!: FormGroup;



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
    signInWithEmailAndPassword(this.auth, this.logInForm.value.email, this.logInForm.value.password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      this.route.navigate(['startscreen']);
      this.currentUserService.getCurrentUser()
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
    })
  }

  redirectToSignUp() {
    this.route.navigate(['signUp']);
  }
}
