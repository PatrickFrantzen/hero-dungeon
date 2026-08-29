import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { createHero } from 'src/models/helden/hero.class';
import { HERO_DEFINITIONS } from 'src/models/helden/hero-definitions';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatOption } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { BaseDialogComponent } from '../dialog-base.component';
import { ChooseHeroDialogResult } from '../dialog-results';

interface Heros {
  value: { heroName: string; heroPower: string; cardstack: string[]; description: string };
  viewValue: string;
}

@Component({
    selector: 'app-dialog-choose-hero',
    templateUrl: './dialog-choose-hero.component.html',
    styleUrls: ['./dialog-choose-hero.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatLabel, MatSelect, FormsModule, MatOption, MatDialogActions, MatButton, MatDialogClose],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogChooseHeroComponent extends BaseDialogComponent<ChooseHeroDialogResult> {

  numberOfPlayer!:number;
  selectedValue!: Heros;

  heros: Heros[] = HERO_DEFINITIONS.map((def) => ({
    value: createHero(def.id).toJSON(),
    viewValue: def.heroName,
  }));

  constructor(dialogRef: MatDialogRef<DialogChooseHeroComponent, { data: ChooseHeroDialogResult }>) {
    super(dialogRef);
  }

  getChoosenHero(choosenHero: Heros) {
    const { heroName, heroPower, cardstack, description } = choosenHero.value;
    this.closeWith({
      choosenHero: { heroname: heroName, heropower: heroPower, cardstack, description },
    });
  }

}
