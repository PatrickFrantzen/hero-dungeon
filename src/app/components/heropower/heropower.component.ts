import { Component, Input, computed } from '@angular/core';
import { Store} from '@ngxs/store';
import { UpdateHeropowerActivated, UpdateHeropowerArray } from 'src/app/actions/heropower-action';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { Mob } from 'src/models/monster/monster.class';
import { MatCard } from '@angular/material/card';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-heropower',
    templateUrl: './heropower.component.html',
    styleUrls: ['./heropower.component.scss'],
    imports: [MatCard, NgClass]
})
export class HeropowerComponent {
  @Input() currentGameId: string = '';
  @Input() currentPlayerId: string = '';
  @Input() currentEnemy: Mob = {name: '', token: [], type: ''};
  @Input() currentDeliveryStack:string[] = [];

  currentUserHeroData = this.store.selectSignal(CurrentUserSelectors.currentUserHeroData);
  heropowerActivated = this.store.selectSignal(HeropowerSelectors.currentHeropowerActivated);

  heroName = computed(() => this.currentUserHeroData()?.choosenHero ?? '');
  heropower = computed(() => this.currentUserHeroData()?.heroPower ?? '');
  description = computed(() => this.currentUserHeroData()?.description ?? '');

  constructor(
    private store: Store
  ) {}

  activateHeroPower() {
    this.store.dispatch(new UpdateHeropowerActivated(true))
    this.store.dispatch(new UpdateHeropowerArray([]))
  }

  deactivateHeroPower() {

    this.store.dispatch(new UpdateHeropowerActivated(false))
    this.store.dispatch(new UpdateHeropowerArray([]))
  }

  heroPowerGladiator() {
    if (this.currentEnemy.type === 'Person' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerBarbar() {
    if (this.currentEnemy.type === 'Monster' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();

  }

  heroPowerZauberin() {
    if (this.currentEnemy.type === 'Hindernis' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerMagier() {

  }

  heroPowerJaegerin() {
    if (!this.heropowerActivated()) {
      this.activateHeroPower()
    } else this.deactivateHeroPower();
  }

  heroPowerWaldlaeufer() {
    if (this.currentEnemy.type === 'Person' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerDieb() {
    if (!this.heropowerActivated()) {
      this.activateHeroPower()
    } else this.deactivateHeroPower();
  }

  heroPowerNinja() {
    if (this.currentEnemy.type === 'Hindernis' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerPaladin() {
    if (this.currentEnemy.type === 'Monster' && !this.heropowerActivated()) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerWalkuere() {
    if (!this.heropowerActivated()) {
      this.activateHeroPower()
    } else this.deactivateHeroPower();
  }
}
