import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-heropower',
  templateUrl: './dialog-heropower.component.html',
  styleUrls: ['./dialog-heropower.component.scss']
})
export class DialogHeropowerComponent {
  selectedValue: { playerName: string; playerId: string; playerHero: string; } = { playerName: '', playerId: '', playerHero: '' }


  constructor(@Inject(MAT_DIALOG_DATA) public data:{ playerName: string; playerId: string; playerHero: string; }[], private dialogRef: MatDialogRef<DialogHeropowerComponent>){}

  getChoosenHero(selectedValue: { playerName: string; playerId: string; playerHero: string; }) {
    this.dialogRef.close({
      data:  {
        playerName: selectedValue.playerName,
        playerId: selectedValue.playerId,
        playerHero: selectedValue.playerHero
      }
    })
  }
}
