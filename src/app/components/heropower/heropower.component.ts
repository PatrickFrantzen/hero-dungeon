import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Select, Store} from '@ngxs/store';
import { Observable, Subscription} from 'rxjs';
import { UpdateHeropowerActivated } from 'src/app/actions/heropower-action';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { CurrentUserState } from 'src/app/states/currentUser-state';
import { Mob } from 'src/models/monster/monster.class';

@Component({
  selector: 'app-heropower',
  templateUrl: './heropower.component.html',
  styleUrls: ['./heropower.component.scss']
})
export class HeropowerComponent implements OnInit, OnDestroy{
  @Input() currentGameId: string = '';
  @Input() currentPlayerId: string = '';
  @Input() currentEnemy: Mob = {name: '', token: [], type: ''};
  @Input() currentDeliveryStack:string[] = [];

  @Select(CurrentUserSelectors.currentUserHeroData) currentUserHeroData$!: Observable<{choosenHero: string, heroPower: string, description: string}>;
  userHeroSubscription!: Subscription;
  currentUserHeroData!: {choosenHero: string, heroPower: string, description: string}
  @Select(HeropowerSelectors.currentHeropowerActivated) currentHeropowerActivated$!: Observable<boolean>;
  heropowerSubscription!: Subscription;
  
  heroName: string = ''
  heropower: string = ''
  description: string = ''
  heropowerActivated: boolean = false;

  constructor(
    private store: Store
  ) {}

  ngOnInit(): void {

    this.userHeroSubscription = this.currentUserHeroData$.subscribe((data) => {
      if (data) {
        this.currentUserHeroData = data;
        this.heroName = this.currentUserHeroData.choosenHero;
        this.heropower = this.currentUserHeroData.heroPower;
        this.description = this.currentUserHeroData.description
      }
    })
    this.heropowerSubscription = this.currentHeropowerActivated$.subscribe((data)=> {
      this.heropowerActivated = data;
    })
  }

  activateHeroPower() {
    if (!this.heropowerActivated) this.store.dispatch(new UpdateHeropowerActivated(true))

  }

  deactivateHeroPower() {
    if (this.heropowerActivated) this.store.dispatch(new UpdateHeropowerActivated(false))
  }

  heroPowerGladiator() {
    if (this.currentEnemy.type === 'Person' && !this.heropowerActivated) {
      this.activateHeroPower();
    } 
  }

  heroPowerBarbar() {
    if (this.currentEnemy.type === 'Monster' && !this.heropowerActivated) {
      this.activateHeroPower();
    } 

  }

  heroPowerZauberin() {
    if (this.currentEnemy.type === 'Hindernis' && !this.heropowerActivated) {
      this.activateHeroPower();
    } 
  }

  heroPowerMagier() {

  }

  heroPowerJaegerin() {

  }

  heroPowerWaldlaeufer() {
    if (this.currentEnemy.type === 'Person' && !this.heropowerActivated) {
      this.activateHeroPower();
    } 
  }

  heroPowerDieb() {
    this.activateHeroPower();
  }

  heroPowerNinja() {
    if (this.currentEnemy.type === 'Hindernis' && !this.heropowerActivated) {
      this.activateHeroPower();
    } 
  }

  heroPowerPaladin() {
    if (this.currentEnemy.type === 'Monster' && !this.heropowerActivated) {
      this.activateHeroPower();
    } 
  }

  heroPowerWalkuere() {

  }

  ngOnDestroy(): void {
    this.userHeroSubscription.unsubscribe();
    this.heropowerSubscription.unsubscribe();
  }

}
