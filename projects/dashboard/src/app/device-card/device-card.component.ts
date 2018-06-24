import {Component, OnInit, OnDestroy, Input} from '@angular/core';
import {Sensor, Device, APIService, SensorValue, Command, ParameterType} from '../services';
import {Subject, interval} from 'rxjs';
import {takeUntil, switchMap, startWith} from 'rxjs/operators';
import {MatDialog} from '@angular/material';
import {DeviceCommandDialogComponent, DeviceCommandDialogConfig} from 'src/app/device-command-dialog';
import {humanize, Humanized} from '../utils';


@Component({
  selector: 'jsmon-device-card',
  templateUrl: './device-card.component.html',
  styleUrls: ['./device-card.component.scss']
})
export class DeviceCardComponent implements OnInit, OnDestroy {

  @Input()
  device: Device;

  _sensors: (SensorValue & Humanized)[] = [];
  _commands: (Command & Humanized)[] = [];

  _firstLoad = true;

  private readonly _destroyed: Subject<void> = new Subject();

  constructor(private _api: APIService,
              private _dialog: MatDialog) { }

  ngOnInit() {
    interval(2000)
      .pipe(
        startWith(-1),
        takeUntil(this._destroyed),
        switchMap(() => this._api.getSensors(this.device.name))
      )
      .subscribe(res => {
        this._firstLoad = false;
        this._sensors = res.map(s => humanize(s, a => a.name));
      });

    this._commands = this.device.commands.map(c => humanize(c, a => a.name));
  }

  _formatValue(val: any, sensor: SensorValue): string {
    if (sensor.type === ParameterType.Timestamp) {
      return new Date(val as number * 1000).toLocaleTimeString();
    }

    if (val === null || val == undefined) {
      return 'N/A ';
    }

    return '' + val;
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

  _trackSensor(_: number, sensor: Sensor) {
    return sensor.name;
  }

  _executeCommand(cmd: Command): void {
    console.log(cmd);

    this._dialog.open(DeviceCommandDialogComponent, {
      data: new DeviceCommandDialogConfig(this.device, cmd)
    });
  }
}
