import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { createHero } from 'src/models/helden/hero.class';
import { HERO_DEFINITIONS } from 'src/models/helden/hero-definitions';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatOption } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

interface Heros {
  value: Object;
  viewValue: string;
}

@Component({
    selector: 'app-dialog-choose-hero',
    templateUrl: './dialog-choose-hero.component.html',
    styleUrls: ['./dialog-choose-hero.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatLabel, MatSelect, FormsModule, MatOption, MatDialogActions, MatButton, MatDialogClose],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogChooseHeroComponent {

  numberOfPlayer!:number;
  selectedValue!:string;

  heros: Heros[] = HERO_DEFINITIONS.map((def) => ({
    value: createHero(def.id).toJSON(),
    viewValue: def.heroName,
  }));

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private dialogRef: MatDialogRef<DialogChooseHeroComponent>) {}

  getChoosenHero(choosenHero:any) {
    this.dialogRef.close({data: {
      choosenHero: {heroname: choosenHero.value.heroName, heropower: choosenHero.value.heroPower, cardstack: choosenHero.value.cardstack, description: choosenHero.value.description},
    }})
  }

}
