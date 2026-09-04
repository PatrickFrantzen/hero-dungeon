import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { BaseDialogComponent } from '../dialog-base.component';
import { AuthFormService } from 'src/app/services/auth-form.service';
import { LocalSaveMigrationService } from 'src/app/services/local-save-migration.service';

export interface AccountOfferDialogResult {
  accountCreated: boolean;
}

/**
 * Bei Singleplayer-Spielende (gameStatus 'won'/'lost', Issue #75, PR 3) angeboten: "Account
 * erstellen, um diesen Spielstand online zu sichern". Anders als die übrigen Dialoge (die nur
 * Eingaben sammeln und den Aufrufer async arbeiten lassen) führt dieser Dialog Registrierung +
 * Migration selbst aus (analog zu SignupComponent.register()) - GameComponent bekommt nur das
 * fertige Ergebnis, weil der Dialog dafür ohnehin schon Formular-/Fehlerzustand hält.
 */
@Component({
  selector: 'app-dialog-account-offer',
  templateUrl: './dialog-account-offer.component.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatDialogActions,
    MatButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogAccountOfferComponent extends BaseDialogComponent<AccountOfferDialogResult> implements OnInit {
  form!: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = false;

  constructor(
    dialogRef: MatDialogRef<DialogAccountOfferComponent, { data: AccountOfferDialogResult }>,
    private fb: FormBuilder,
    private authForm: AuthFormService,
    private auth: Auth,
    private migration: LocalSaveMigrationService
  ) {
    super(dialogRef);
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      nickname: ['', Validators.required],
    });
  }

  async onAccept(): Promise<void> {
    this.errorMessage = null;
    this.isSubmitting = true;
    try {
      const { email, password, nickname } = this.form.value;
      await this.authForm.register(email, password, nickname);
      await this.migration.migrateAll(this.auth.currentUser?.uid ?? '', nickname);
      this.closeWith({ accountCreated: true });
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Account konnte nicht erstellt werden. Bitte erneut versuchen.';
    } finally {
      this.isSubmitting = false;
    }
  }

  onDecline(): void {
    this.dialogRef.close();
  }
}
