import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

// OnPush: the routed branch (GameComponent -> PlayerHandComponent) no longer relies on
// Default-strategy change detection - see the note on GameComponent for why.
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'hero-dungeon';

  constructor(
    public router: Router,
  ) {}
}
