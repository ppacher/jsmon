import { Component, OnInit, OnDestroy} from '@angular/core';
import {Subject, interval} from 'rxjs';
import {takeUntil, switchMap, startWith} from 'rxjs/operators';
import {APIService, Device, Sensor, ParameterType} from '../services';

@Component({
  selector: 'jsmon-devices',
  templateUrl: './device-dashboard.component.html',
  styleUrls: ['./device-dashboard.component.scss']
})
export class DeviceDashboardComponent implements OnInit, OnDestroy {
  /** Holds a list of available devices */
  _devices: Device[] = [];

  private readonly _destroyed = new Subject<void>();

  constructor(private _api: APIService) { }

  ngOnInit() {
    interval(2000)
      .pipe(
        startWith(-1),
        takeUntil(this._destroyed),
        switchMap(() => this._api.getDevices())
      )
      .subscribe(devices => this._devices = devices);
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

  _trackDevice(_: number, dev: Device) {
    return dev.name;
  }
}
