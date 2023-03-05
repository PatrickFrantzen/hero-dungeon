import { Component, OnInit } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from '@angular/fire/auth';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  public signUpForm!: FormGroup;

  constructor(
    public auth: Auth,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.signUpForm = this.fb.group({
      email : new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(3)])
    })
  }


  register() {
    createUserWithEmailAndPassword(this.auth, this.signUpForm.value.email, this.signUpForm.value.password)
    .then((response) => {
      console.log('response', response)
    })
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

}
