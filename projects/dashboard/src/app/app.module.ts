import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ValidatorsModule} from 'ngx-validators';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AppMaterialModule} from './material.module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {HeaderComponent} from './header/header.component';
import {DeviceDashboardComponent} from './device-dashboard';
import {DeviceCardComponent} from './device-card/device-card.component';
import { DeviceCommandDialogComponent } from './device-command-dialog/device-command-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    DeviceDashboardComponent,
    DeviceCardComponent,
    DeviceCommandDialogComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ValidatorsModule,
    BrowserModule,
    AppRoutingModule,
    AppMaterialModule,
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [DeviceCommandDialogComponent]
})
export class AppModule { }
