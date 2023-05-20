import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Select} from '@ngxs/store';
import { Observable, Subscription} from 'rxjs';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectos';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { CurrentUserState } from 'src/app/states/currentUser-state';

@Component({
  selector: 'app-heropower',
  templateUrl: './heropower.component.html',
  styleUrls: ['./heropower.component.scss']
})
export class HeropowerComponent implements OnInit, OnDestroy{
  @Input() currentGameId: string = '';
  @Input() currentPlayerId: string = '';
  @Select(CurrentUserSelectors.currentUserHeroData) currentUserHeroData$!: Observable<{choosenHero: string, heroPower: string, description: string}>;
  userHeroSubscription!: Subscription
  currentUserHeroData!: {choosenHero: string, heroPower: string, description: string}
  heroName: string = ''
 heropower: string = ''
 description: string = ''

  constructor() {}

  ngOnInit(): void {
    this.userHeroSubscription = this.currentUserHeroData$.subscribe((data) => {
      if (data) {
        this.currentUserHeroData = data;
        this.heroName = this.currentUserHeroData.choosenHero;
        this.heropower = this.currentUserHeroData.heroPower;
        this.description = this.currentUserHeroData.description
      }

    })
  }

  ngOnDestroy(): void {
    this.userHeroSubscription.unsubscribe()
  }

}
