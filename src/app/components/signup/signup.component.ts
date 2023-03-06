import { Component, OnInit } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword} from '@angular/fire/auth';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { User } from 'src/models/user.class';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  public signUpForm!: FormGroup;
  user = new User;
  db = getFirestore();
  dbRef = collection(this.db, 'users');

  constructor(
    public auth: Auth,
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


  register() {
    createUserWithEmailAndPassword(this.auth, this.signUpForm.value.email, this.signUpForm.value.password)
    .then((response) => {
      console.log('response', response)
      this.user.userEmail = this.signUpForm.value.email;
      this.user.userId = response.user.uid;
      this.user.userNickname = this.signUpForm.value.nickname;
      console.log(this.user);
      addDoc(this.dbRef, this.user.toJSON());
    })
    .then(() => {
      this.route.navigate(['startscreen'])
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

  getNicknameErrorMessage() {
    if (this.signUpForm.controls['nickname'].hasError('required')) {
      return 'You must enter a nickname';
    }
    return ''
  }

  backToSignIn() {
    this.route.navigate(['signIn'])
  }

}
