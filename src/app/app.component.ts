import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

// Not OnPush: hosts the router-outlet, and one routed branch (GameComponent ->
// PlayerHandComponent) still relies on Default-strategy change detection - see the note on
// GameComponent for why.
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [RouterOutlet]
})
export class AppComponent implements OnInit{
  title = 'hero-dungeon';

  constructor(
    public router: Router,
  ) {}

ngOnInit(): void {
  
}


}
