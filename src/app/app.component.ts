import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogChooseHeroComponent } from './dialog-choose-hero/dialog-choose-hero.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'hero-dungeon';
  numberOfPlayers = 0;

  constructor(
    public dialog: MatDialog) {}

  ngOnInit(): void {
    if(this.numberOfPlayers == 0) {
      this.openDialog();
    }
  }

  openDialog() {
    this.dialog.open(DialogChooseHeroComponent)
  }
}
