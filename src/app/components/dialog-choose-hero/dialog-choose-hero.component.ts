import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MAT_DIALOG_DATA } from '@angular/material/dialog';
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

  private dialogData = inject<{ singleplayerMode?: boolean; useExtraDeck?: boolean } | null>(MAT_DIALOG_DATA, { optional: true });
  numberOfPlayer!:number;
  // Bewusst kein Default-Held - der "Ok"-Button bleibt disabled, bis der Spieler aktiv eine
  // Auswahl trifft (Bugfix: Dialog liess sich vorher per Backdrop-Klick/Escape ohne jede
  // Auswahl schliessen, siehe disableClose an den open()-Aufrufstellen).
  selectedValue?: Heros;

  heros: Heros[] = HERO_DEFINITIONS
    .filter((def) => !this.dialogData?.singleplayerMode || ['dieb', 'waldläufer'].includes(def.id))
    .map((def) => ({
      value: createHero(def.id, this.dialogData?.useExtraDeck ?? false).toJSON(),
      viewValue: def.heroName,
    }));

  getChoosenHero(choosenHero: Heros | undefined) {
    if (!choosenHero) {
      return;
    }
    const { heroName, heroPower, cardstack, description } = choosenHero.value;
    this.closeWith({
      choosenHero: { heroname: heroName, heropower: heroPower, cardstack, description },
    });
  }

}
