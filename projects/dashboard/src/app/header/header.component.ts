import {Component, OnInit, ChangeDetectionStrategy, HostBinding} from '@angular/core';
import {ThemeSwitcher, Theme} from '../services';

@Component({
  selector: 'jsmon-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  _themes: Theme[] = [];

  constructor(private _themeSwitcher: ThemeSwitcher) { }

  @HostBinding('class.jsmon-header-component')
  private _componentClass = true;

  ngOnInit() {
    this._themes = this._themeSwitcher.getThemeList();
  }

  _switchTheme(theme: Theme) {
    this._themeSwitcher.swtichTheme(theme.theme);
  }
}
