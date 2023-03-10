import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { isEmpty } from '@firebase/util';
import { DialogChooseHeroComponent } from 'src/app/components/dialog-choose-hero/dialog-choose-hero.component';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";
import { Game } from 'src/models/game';
import { User } from 'src/models/user.class';

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
  db = getFirestore();



  constructor(
    public currentUserService: CurrentUserService,
    private route: ActivatedRoute,
    public dialog:MatDialog,
  ) { }

  ngOnInit(): void {
    
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
      this.setHeroToUser(result.data);
      const updateData = {
        choosenHero: this.user.choosenHero,
      }
      const docRef = doc(this.db, 'users', this.currentPlayerId);
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