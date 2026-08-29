import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
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
export class AppComponent implements OnInit{
  title = 'hero-dungeon';

  constructor(
    public router: Router,
  ) {}

ngOnInit(): void {
  
}


}
