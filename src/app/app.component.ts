import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

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
