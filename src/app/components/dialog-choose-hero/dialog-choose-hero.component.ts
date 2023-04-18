import { Component } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { Barbar } from 'src/models/helden/barbar.class';
import { Dieb } from 'src/models/helden/dieb.class';
import { Gladiator } from 'src/models/helden/gladiator.class';
import { Jägerin } from 'src/models/helden/jägerin.class';
import { Magier } from 'src/models/helden/magier.class';
import { Ninja } from 'src/models/helden/ninja.class';
import { Paladin } from 'src/models/helden/paladin.class';
import { Waldläufer } from 'src/models/helden/waldläufer.class';
import { Walküre } from 'src/models/helden/walküre.class';
import { Zauberin } from 'src/models/helden/zauberin.class';

interface Heros {
  value: Object;
  viewValue: string;
}

@Component({
  selector: 'app-dialog-choose-hero',
  templateUrl: './dialog-choose-hero.component.html',
  styleUrls: ['./dialog-choose-hero.component.scss']
})
export class DialogChooseHeroComponent {

  numberOfPlayer!:number;
  selectedValue!:string;

  barbar:Barbar = new Barbar;
  dieb: Dieb = new Dieb;
  gladiator: Gladiator = new Gladiator;
  jägerin: Jägerin = new Jägerin;
  magier: Magier = new Magier;
  ninja: Ninja = new Ninja;
  paladin: Paladin = new Paladin;
  waldläufer: Waldläufer = new Waldläufer;
  walküre: Walküre = new Walküre;
  zauberin: Zauberin = new Zauberin;


  heros: Heros[] = [
    {value: this.barbar.toJSON(), viewValue: 'Barbar'},
    {value: this.dieb.toJSON(), viewValue: 'Dieb'},
    {value: this.gladiator.toJSON(), viewValue: 'Gladiator'},
    {value: this.jägerin.toJSON(), viewValue: 'Jägerin'},
    {value: this.magier.toJSON(), viewValue: 'Magier'},
    {value: this.ninja.toJSON(), viewValue: 'Ninja'},
    {value: this.paladin.toJSON(), viewValue: 'Paladin'},
    {value: this.waldläufer.toJSON(), viewValue: 'Waldläufer'},
    {value: this.walküre.toJSON(), viewValue: 'Walküre'},
    {value: this.zauberin.toJSON(), viewValue: 'Zauberin'},
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private dialogRef: MatDialogRef<DialogChooseHeroComponent>) {}

  getChoosenHero(choosenHero:any) {
    console.log('Dialogfeld',choosenHero)
    this.dialogRef.close({data: {
      choosenHero: {heroname: choosenHero.value.heroName, heropower: choosenHero.value.heroPower, herostack: choosenHero.value.heroStack},
    }})
  }

}
