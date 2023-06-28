import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NgxsSimpleChange, Select, Store} from '@ngxs/store';
import { Observable, Subscription} from 'rxjs';
import { UpdateHeropowerActivated, UpdateHeropowerArray } from 'src/app/actions/heropower-action';
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

    // this.heropowerArraySubscription = this.currentHeropowerArray$.subscribe((data)=> {
    //   this.heropowerArray = data;
    // })
  }


  activateHeroPower() {
    this.store.dispatch(new UpdateHeropowerActivated(true))
    this.store.dispatch(new UpdateHeropowerArray([]))
  }

  deactivateHeroPower() {

    this.store.dispatch(new UpdateHeropowerActivated(false))
    this.store.dispatch(new UpdateHeropowerArray([]))
  }

  heroPowerGladiator() {
    if (this.currentEnemy.type === 'Person' && !this.heropowerActivated) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerBarbar() {
    if (this.currentEnemy.type === 'Monster' && !this.heropowerActivated) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();

  }

  heroPowerZauberin() {
    if (this.currentEnemy.type === 'Hindernis' && !this.heropowerActivated) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerMagier() {

  }

  heroPowerJaegerin() {
    if (!this.heropowerActivated) {
      this.activateHeroPower()
    } else this.deactivateHeroPower();
  }

  heroPowerWaldlaeufer() {
    if (this.currentEnemy.type === 'Person' && !this.heropowerActivated) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerDieb() {
    if (!this.heropowerActivated) {
      this.activateHeroPower()
    } else this.deactivateHeroPower();
  }

  heroPowerNinja() {
    if (this.currentEnemy.type === 'Hindernis' && !this.heropowerActivated) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerPaladin() {
    if (this.currentEnemy.type === 'Monster' && !this.heropowerActivated) {
      this.activateHeroPower();
    } else this.deactivateHeroPower();
  }

  heroPowerWalkuere() {
    if (!this.heropowerActivated) {
      this.activateHeroPower()
    } else this.deactivateHeroPower();
  }

  ngOnDestroy(): void {
    this.userHeroSubscription.unsubscribe();
    this.heropowerSubscription.unsubscribe();
  }
}
