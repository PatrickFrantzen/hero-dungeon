import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngxs/store';
import { ChooseCardAction } from 'src/app/actions/cardsInHand-action';
import { CreateNewCardStackAction } from 'src/app/actions/createNewCardStack-action';
import { UpdateCardStackAction } from 'src/app/actions/updateCardStack-action';
import { CurrentEnemyService } from 'src/app/services/current-enemy.service';
import { CurrentHandService } from 'src/app/services/current-hand.service';
import { CardStack } from 'src/models/helden/card.class';

@Component({
  selector: 'app-player-hand',
  templateUrl: './player-hand.component.html',
  styleUrls: ['./player-hand.component.scss']
})
export class PlayerHandComponent implements OnInit{
  currentHand: string[] = [];
  currentStack: string[] = [];
  currentEnemyToken:string[]= [];
  playedCards:string[] = [];
  gameId:string = '';

  constructor(
    private handservice: CurrentHandService,
    public currentEnemyService: CurrentEnemyService,
    private route: ActivatedRoute,
    private store: Store,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(async (params) => {
      //When url is changed the Hero Data of this User is loaded
      this.gameId = params['id'];
    });
    this.handservice.getCurrentHandFromServer(this.gameId)
    .then((response:any)=> {
      this.currentHand = response.handstack;
      this.currentStack = response.heroStack;
      this.playedCards = response.playedCards;
      this.store.dispatch(new UpdateCardStackAction(this.currentStack))
    });
    this.checkEnemyToken();
    
  }

 
  chooseCard(card: string) {
    this.store.dispatch(new ChooseCardAction(card))
    
    
    if (this.currentEnemyToken.includes(card)) {
      let indexOfHandCard = this.currentHand.indexOf(card);
      this.currentHand.splice(indexOfHandCard, 1);
      this.currentEnemyService.removeEnemyToken(this.gameId, card)
      .then((response:any) => {
        console.log('responseAfterService', response)
        this.currentEnemyToken = response;
        this.currentEnemyService.currentEnemyTokenEvent.emit(this.currentEnemyToken)
        console.log('EventTOken', this.currentEnemyService.currentEnemyTokenEvent.emit(this.currentEnemyToken))
      });
    }

    if (this.currentHand.length < 5) {
      this.handservice.drawACard(this.gameId, this.currentHand)
    }
      
    }

  checkEnemyToken() {
    this.currentEnemyService.getCurrentEnemyFromServer(this.gameId)
    .then((response:any) =>{
      this.currentEnemyToken = response.currentEnemy.token;
    })
  }



}
