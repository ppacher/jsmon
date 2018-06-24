import {Injectable, Inject} from '@angular/core';
import {OverlayContainer} from '@angular/cdk/overlay';
import {DOCUMENT} from '@angular/platform-browser';

export interface Theme {
    name: string;
    theme: string;
}

@Injectable({providedIn: 'root'})
export class ThemeSwitcher {
    themeClass: string;

    constructor(
      private overlayContainer: OverlayContainer,
      @Inject(DOCUMENT) private _document: Document,
    ) {
        this.swtichTheme('jsmon-light-red-theme');
    }

    getThemeList(): Theme[] {
        return [
            {
                name: 'Light-Red',
                theme: 'jsmon-light-red-theme'
            },
            {
                name: 'Dark-Red',
                theme: 'jsmon-dark-red-theme'
            },
            {
                name: 'Light-Blue',
                theme: 'jsmon-light-blue-theme'
            },
            {
                name: 'Dark-Blue',
                theme: 'jsmon-dark-blue-theme'
            }
        ];
    }

    swtichTheme(newThemeClass: string): void {
      // subscribe to some source of theme change events, then...
      this.themeClass = newThemeClass;

      // remove old theme class and add new theme class
      // we're removing any css class that contains '-theme' string but your theme classes can follow any pattern
      const overlayContainerClasses = this.overlayContainer.getContainerElement().classList;
      let themeClassesToRemove = Array.from(overlayContainerClasses).filter((item: string) => item.includes('-theme'));
      if (themeClassesToRemove.length) {
         overlayContainerClasses.remove(...themeClassesToRemove);
      }
      overlayContainerClasses.add(this.themeClass);

      const documentContainerClasses = this._document.body.classList;
      themeClassesToRemove = Array.from(documentContainerClasses).filter((item: string) => item.includes('-theme'));
      if (themeClassesToRemove.length) {
         this._document.body.classList.remove(...themeClassesToRemove);
      }
      this._document.body.classList.add(this.themeClass);
    }
}
