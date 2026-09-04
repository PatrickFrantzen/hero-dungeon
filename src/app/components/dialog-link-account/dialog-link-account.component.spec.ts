import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthFormService } from 'src/app/services/auth-form.service';

import { DialogLinkAccountComponent } from './dialog-link-account.component';

describe('DialogLinkAccountComponent', () => {
  let component: DialogLinkAccountComponent;
  let fixture: ComponentFixture<DialogLinkAccountComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<unknown>>;
  let authForm: jasmine.SpyObj<AuthFormService>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    authForm = jasmine.createSpyObj('AuthFormService', ['linkAnonymousAccount']);

    await TestBed.configureTestingModule({
      imports: [DialogLinkAccountComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: AuthFormService, useValue: authForm },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogLinkAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onDecline closes the dialog without a result - the anonymous session stays usable', () => {
    component.onDecline();

    expect(dialogRef.close).toHaveBeenCalledWith();
    expect(authForm.linkAnonymousAccount).not.toHaveBeenCalled();
  });

  it('onAccept links the account and closes with linked: true', async () => {
    authForm.linkAnonymousAccount.and.resolveTo(undefined);
    component.form.setValue({ email: 'a@b.de', password: 'geheim', nickname: 'Heldin' });

    await component.onAccept();

    expect(authForm.linkAnonymousAccount).toHaveBeenCalledWith('a@b.de', 'geheim', 'Heldin');
    expect(dialogRef.close).toHaveBeenCalledWith({ data: { linked: true } });
  });

  it('onAccept shows an error and keeps the dialog open when linking fails (e.g. email already in use) - Gast-Session bleibt nutzbar', async () => {
    authForm.linkAnonymousAccount.and.rejectWith(
      new Error('Verknüpfung fehlgeschlagen: Diese E-Mail-Adresse wird bereits verwendet.')
    );
    component.form.setValue({ email: 'a@b.de', password: 'geheim', nickname: 'Heldin' });

    await component.onAccept();

    expect(component.errorMessage).toBe('Verknüpfung fehlgeschlagen: Diese E-Mail-Adresse wird bereits verwendet.');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
