import {Component, OnInit} from '@angular/core';
import {ThemeSwitcher} from './services';

@Component({
  selector: 'jsmon-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'jsmon';

    constructor(private _themeSwitcher: ThemeSwitcher) {}
}
