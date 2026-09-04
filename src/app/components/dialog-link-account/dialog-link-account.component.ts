import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { BaseDialogComponent } from '../dialog-base.component';
import { AuthFormService } from 'src/app/services/auth-form.service';

export interface LinkAccountDialogResult {
  linked: boolean;
}

/**
 * Verknüpft den bereits anonym eingeloggten Multiplayer-Nutzer (Issue #76,
 * AuthFormService.ensureAnonymousSession()) mit E-Mail/Passwort (Issue #78), aus
 * GameMenuComponent heraus erreichbar. Analog zu DialogAccountOfferComponent (Issue #75) führt
 * dieser Dialog die Verknüpfung selbst aus, statt nur Formulardaten zurückzugeben - der Dialog
 * hält ohnehin schon Formular-/Fehlerzustand. Ablehnen ("Nicht jetzt") und ein Fehlschlag
 * (z.B. E-Mail bereits vergeben) lassen den bestehenden anonymen Account unverändert nutzbar -
 * AuthFormService.linkAnonymousAccount() meldet ihn bei einem Fehler nicht ab, dieser Dialog
 * ruft ebenfalls kein signOut() auf.
 */
@Component({
  selector: 'app-dialog-link-account',
  templateUrl: './dialog-link-account.component.html',
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
export class DialogLinkAccountComponent extends BaseDialogComponent<LinkAccountDialogResult> implements OnInit {
  form!: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = false;

  constructor(
    dialogRef: MatDialogRef<DialogLinkAccountComponent, { data: LinkAccountDialogResult }>,
    private fb: FormBuilder,
    private authForm: AuthFormService
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
      await this.authForm.linkAnonymousAccount(email, password, nickname);
      this.closeWith({ linked: true });
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Verknüpfung fehlgeschlagen. Bitte erneut versuchen.';
    } finally {
      this.isSubmitting = false;
    }
  }

  onDecline(): void {
    this.dialogRef.close();
  }
}
