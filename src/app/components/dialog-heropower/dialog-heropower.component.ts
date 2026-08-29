import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatOption } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-dialog-heropower',
    templateUrl: './dialog-heropower.component.html',
    styleUrls: ['./dialog-heropower.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatFormField, MatLabel, MatSelect, FormsModule, MatOption, MatDialogActions, MatButton, MatDialogClose]
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
