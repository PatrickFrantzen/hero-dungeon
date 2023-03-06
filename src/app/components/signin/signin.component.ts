import { Component, OnInit} from '@angular/core';
import { Auth, signInWithEmailAndPassword, user } from '@angular/fire/auth';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

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
  ) {}

  ngOnInit(): void {
    this.logInForm = this.fb.group({
      email : new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    })
  }

  logIn() {
    signInWithEmailAndPassword(this.auth, this.logInForm.value.email, this.logInForm.value.password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      console.log(user)
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
