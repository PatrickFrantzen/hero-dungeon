import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit{

constructor() {}

ngOnInit(): void {
  
}

email = new FormControl('', [Validators.required, Validators.email]);
password = new FormControl ('', [Validators.required, Validators.minLength(3)])

  getEmailErrorMessage() {
    if (this.email.hasError('required')) {
      return 'You must enter a value';
    }

    return this.email.hasError('email') ? 'Not a valid email' : '';
  }

  getPasswordErrorMessage() {
    if (this.password.hasError('required')) {
      return 'You must enter a password';
    }
    return this.password.hasError('password') ? 'Not a valid password' : '';
  }

}
