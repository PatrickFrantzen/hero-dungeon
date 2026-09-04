import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthFormService } from 'src/app/services/auth-form.service';
import { LocalSaveMigrationService } from 'src/app/services/local-save-migration.service';

import { DialogAccountOfferComponent } from './dialog-account-offer.component';

describe('DialogAccountOfferComponent', () => {
  let component: DialogAccountOfferComponent;
  let fixture: ComponentFixture<DialogAccountOfferComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<unknown>>;
  let authForm: jasmine.SpyObj<AuthFormService>;
  let migration: jasmine.SpyObj<LocalSaveMigrationService>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    authForm = jasmine.createSpyObj('AuthFormService', ['register']);
    migration = jasmine.createSpyObj('LocalSaveMigrationService', ['migrateAll']);
    migration.migrateAll.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [DialogAccountOfferComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: AuthFormService, useValue: authForm },
        { provide: LocalSaveMigrationService, useValue: migration },
        { provide: Auth, useValue: { currentUser: { uid: 'new-uid' } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogAccountOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onDecline closes the dialog without a result', () => {
    component.onDecline();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('onAccept registers, migrates local saves and closes with accountCreated: true', async () => {
    authForm.register.and.resolveTo(undefined);
    component.form.setValue({ email: 'a@b.de', password: 'geheim', nickname: 'Heldin' });

    await component.onAccept();

    expect(authForm.register).toHaveBeenCalledWith('a@b.de', 'geheim', 'Heldin');
    expect(migration.migrateAll).toHaveBeenCalledWith('new-uid', 'Heldin');
    expect(dialogRef.close).toHaveBeenCalledWith({ data: { accountCreated: true } });
  });

  it('onAccept shows an error and keeps the dialog open when registration fails', async () => {
    authForm.register.and.rejectWith(new Error('Registrierung fehlgeschlagen: Diese E-Mail-Adresse wird bereits verwendet.'));
    component.form.setValue({ email: 'a@b.de', password: 'geheim', nickname: 'Heldin' });

    await component.onAccept();

    expect(component.errorMessage).toBe('Registrierung fehlgeschlagen: Diese E-Mail-Adresse wird bereits verwendet.');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(migration.migrateAll).not.toHaveBeenCalled();
  });
});
