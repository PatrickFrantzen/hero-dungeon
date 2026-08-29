import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';
import { Mob } from 'src/models/monster/monster.class';
import { MatCard, MatCardHeader, MatCardContent, MatCardFooter } from '@angular/material/card';

@Component({
    selector: 'app-enemy',
    templateUrl: './enemy.component.html',
    styleUrls: ['./enemy.component.scss'],
    imports: [MatCard, MatCardHeader, MatCardContent, MatCardFooter],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnemyComponent {
  readonly currentEnemy = input.required<Mob>();
  readonly gameId = input<string>('');
  readonly questCardStatus = input<boolean>(false);
}
