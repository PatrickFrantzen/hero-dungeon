import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import {
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  map,
  take,
  takeUntil,
} from 'rxjs';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { UpdateMonsterTokenArray } from 'src/app/actions/currentGame-action';
import {
  UpdateHeropowerActivated,
  UpdateHeropowerArray,
} from 'src/app/actions/heropower-action';
import { CurrentCardStackSelector } from 'src/app/selectors/currentCardStack-selector';
import { CurrentDeliveryStackSelector } from 'src/app/selectors/currentDeliveryStack-selector';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { HeropowerSelectors } from 'src/app/selectors/heropower-selector';
import { DiebServiceService } from 'src/app/services/dieb-service.service';
import { SaveGameService } from 'src/app/services/save-game.service';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import {
  CurrentUserModel,
  CurrentUserState,
} from 'src/app/states/currentUser-state';
import { Game } from 'src/models/game';
import { Mob } from 'src/models/monster/monster.class';

@Component({
  selector: 'app-heropower-container',
  template: `
    <app-heropower
      [currentGameId]="(this.gameId$ | async) || ''"
      [currentPlayerId]="(this.playerId$ | async) || ''"
      [currentEnemy]="(this.enemy$ | async) || emptyMob"
      [currentDeliveryStack]="(this.deliveryStack$ | async) || []"
    ></app-heropower>
  `,
  styles: [``],
})
export class HeropowerContainerComponent implements OnInit, OnDestroy {
  @Select(CurrentGameSelectors.currentGameState)
  game$!: Observable<Game>;

  @Select(CurrentGameSelectors.currentGame)
  id$!: Observable<string>;

  @Select(CurrentUserSelectors.currentUser)
  user$!: Observable<CurrentUserModel>;

  @Select(CurrentDeliveryStackSelector.currentDeliveryStack)
  deliveryStack$!: Observable<string[]>;

  @Select(HeropowerSelectors.currentHeropowerArray)
  heropowerArray$!: Observable<string[]>;

  @Select(CurrentHandSelector.currentHand)
  cardsInHand$!: Observable<string[]>;

  @Select(CurrentCardStackSelector.currentCardStack)
  cardStack$!: Observable<string[]>;

  public emptyMob: Mob = {
    name: '',
    type: '',
    token: [],
  };

  gameId$: Observable<string> = new Observable<string>();
  playerId$: Observable<string> = new Observable<string>();
  enemy$: Observable<Mob> = new Observable<Mob>();
  deliveryStackObs$: Observable<string[]> = new Observable<string[]>();
  heroPowerArray$: Observable<string[]> = new Observable<string[]>();

  private unsubscribe$: Subject<void> = new Subject();
  constructor(private store: Store, private saveGame: SaveGameService, private diebService: DiebServiceService) {}

  ngOnInit(): void {
    this.gameId$ = this.game$.pipe(
      map((data) => {
        return data.gameId;
      })
    );

    this.playerId$ = this.user$.pipe(
      map((data) => {
        console.warn('data', data.items.id);
        return data.items.id;
      })
    );

    this.enemy$ = this.game$.pipe(
      map((data) => {
        return data.currentEnemy;
      })
    );

    this.deliveryStackObs$ = this.deliveryStack$.pipe(
      map((data) => {
        return data;
      })
    );

    //Aktion der Heropower hier mit combineLatest (Heropower Activated, enemy$, gameId$) durchführen
    this.heroPowerArray$ = this.heropowerArray$.pipe(
      map((data) => {
        return data;
      })
    );

    combineLatest([this.enemy$, this.heropowerArray$])
      .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged())
      .subscribe((data) => {
        const heropowerActivated = this.store.selectSnapshot(
          HeropowerSelectors.currentHeropowerActivated
        );
        const hero = this.store.selectSnapshot(
          CurrentUserSelectors.currentUserHeroData
        );
        let heroname = hero.choosenHero;
        const [enemy, heropowerArray] = data;

        if (heropowerActivated && heropowerArray.length == 3) {
          switch (heroname) {
            case 'Gladiator':
            case 'Barbar':
            case 'Zauberin':
            case 'Waldläufer':
            case 'Ninja':
            case 'Paladin':
              this.checkheropowerArray();
              break;
            case 'Magier':
              break;
            case 'Jägerin':
              this.checkJaegerinHeropower();
              break;
            case 'Dieb':
              this.diebService.heropower(heropowerArray)
              break;
            case 'Walküre':
              this.checkWalkuereHeropower();
              break;
          }
        }
      });
  }

  checkheropowerArray() {}

  checkJaegerinHeropower() {}

  checkWalkuereHeropower() {}

  ngOnDestroy(): void {
    if (this.unsubscribe$) {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  }
}
