import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrentEnemyService } from 'src/app/services/current-enemy.service';
import { CurrentHandService } from 'src/app/services/current-hand.service';

@Component({
  selector: 'app-player-hand',
  templateUrl: './player-hand.component.html',
  styleUrls: ['./player-hand.component.scss'],
  providers: [CurrentHandService, CurrentEnemyService]
})
export class PlayerHandComponent implements OnInit{
  currentHand: string[] = [];
  currentStack: string[] = [];
  currentEnemyToken:string[]= [];
  playedCards:string[] = [];
  gameId:string = '';

  constructor(
    private handservice: CurrentHandService,
    private currentEnemyService: CurrentEnemyService,
    private route: ActivatedRoute
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
    });
    this.checkEnemyToken();
    
  }

 
  chooseCard(card: string) {
    
    if (this.currentEnemyToken.includes(card)) {
      let indexOfToken = this.currentEnemyToken.indexOf(card);
      let indexOfHandCard = this.currentHand.indexOf(card);
      this.currentEnemyToken.splice(indexOfToken,1);
      this.currentHand.splice(indexOfHandCard, 1);
      console.log('chooseCard', this.currentHand, this.currentEnemyToken)
    }
    // if (this.currentEnemyToken.includes(card)) {
    //   let indexOfToken = this.currentEnemyToken.indexOf(card);
    //   let indexOfHandCard = this.initialHand!.indexOf(card);
    //   this.currentEnemyToken.splice(indexOfToken, 1);
    //   this.initialHand!.splice(indexOfHandCard, 1);
    //   console.log('currentHand', this.initialHand)
    //   this.drawACard();
    // }
  }

  checkEnemyToken() {
    this.currentEnemyService.getCurrentEnemyFromServer(this.gameId)
    .then((response:any) =>{
      this.currentEnemyToken = response.currentEnemy.token;
    })
  }

  // async drawACard() {
  //   //if handstack.length is < 5 draw Cards until 5 in Hand
  //   const docHand = doc(this.db, 'games', this.gameId, 'player', this.currentPlayerId);
  //   const docSnap = await getDoc(docHand);
  //   let data = docSnap.data();
  //   for (let i = 0; this.initialHand!.length < 5; i++) {
  //     const cardsInHand = data!['heroStack'].shift();
  //     this.initialHand!.push(cardsInHand)
  //   }
  //   const updateData = {
  //     heroStack: data!['heroStack'] ,
  //     handstack: this.initialHand,
  //   }
  //   const docRef = doc(this.db, 'games', this.gameId, 'player', this.currentPlayerId)
  //   updateDoc(docRef, updateData);
  //   console.log('initialHand', this.initialHand)
  // }
}
