import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DeviceDashboardComponent} from './device-dashboard';

const routes: Routes = [
  {
    path: 'devices',
    component: DeviceDashboardComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
