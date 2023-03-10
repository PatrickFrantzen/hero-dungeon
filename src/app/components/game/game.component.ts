import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { isEmpty } from '@firebase/util';
import { DialogChooseHeroComponent } from 'src/app/components/dialog-choose-hero/dialog-choose-hero.component';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";
import { Game } from 'src/models/game';
import { User } from 'src/models/user.class';
import { initializeApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';
import { getAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  game = new Game();
  user = new User();
  gameId:string = '';
  currentPlayer:string = '';
  currentPlayerId!: string;
  currentHero:Object = {};
  mySubscription;
   

  constructor(
    public currentUserService: CurrentUserService,
    private route: ActivatedRoute,
    public dialog:MatDialog,
    private router: Router
  ) { 
    
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.mySubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
  // Trick the Router into believing it's last link wasn't previously loaded
      this.router.navigated = false;
      }
    }); 
  }

  ngOnInit(): void {
    const firebaseApp = initializeApp(environment.firebase);
    // const auth = getAuth(firebaseApp);
    this.route.params.subscribe((params) => {
      this.gameId = params['id'];
      // this.currentUserService.getCurrentUser(); // testen ob die Funktion hier aufgerufen werden muss oder ob die nachfolgenden Zeilen auch so ausgeführt werden
      this.currentHero = this.currentUserService.currentUserHero;
      this.currentPlayer = this.currentUserService.currentUser;
      this.currentPlayerId = this.currentUserService.currentUserId;
      if (isEmpty(this.currentHero)) {
        this.openDialog()
        console.log(this.currentPlayerId)
      }
    });
  }

  openDialog() {
    let dialogRef = this.dialog.open(DialogChooseHeroComponent, {
      data: {
             choosenHero: this.currentHero 
            }
    })

    dialogRef.afterClosed().subscribe(result => {
      
      const db = getFirestore();
      this.setHeroToUser(result.data);
      const updateData = {
        choosenHero: this.user.choosenHero,
      }
      const docRef = doc(db, 'users', this.currentPlayerId);
      updateDoc(docRef, updateData);
    }
    )
  }

  setHeroToUser(data:any) {
    if (data) {
      this.user.choosenHero = data.choosenHero;
    }
  }

}