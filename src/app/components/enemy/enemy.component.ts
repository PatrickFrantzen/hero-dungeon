import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Mob } from 'src/models/monster/monster.class';

@Component({
  selector: 'app-enemy',
  templateUrl: './enemy.component.html',
  styleUrls: ['./enemy.component.scss'],
})
export class EnemyComponent implements OnInit {
  @Input() currentEnemy!: Mob;
  @Input() gameId: string = '';
  @Input() questCardStatus: boolean = false;

  constructor() {}
  ngAfterContentInit(): void {}


  ngOnInit(): void {
  }
}
