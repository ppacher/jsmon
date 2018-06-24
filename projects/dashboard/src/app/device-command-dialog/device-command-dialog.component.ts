import {Component, OnInit, Inject, NgZone} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatSnackBar} from '@angular/material';
import {Device, Command, APIService, Parameter} from '../services';
import {take} from 'rxjs/operators';
import {Humanized, humanize} from '../utils';

export class DeviceCommandDialogConfig {
  constructor(
    public device: Device,
    public command: Command,
  ) {}
}

@Component({
  selector: 'jsmon-device-command-dialog',
  templateUrl: './device-command-dialog.component.html',
  styleUrls: ['./device-command-dialog.component.scss']
})
export class DeviceCommandDialogComponent implements OnInit {
  model: {[key: string]: any} = {};

  _errorMessage = '';
  _executing = false;
  _title = '';

  _parameters: (Parameter&Humanized)[] = [];

  constructor(private _api: APIService,
              private _ngZone: NgZone,
              private _dialogRef: MatDialogRef<DeviceCommandDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public _config: DeviceCommandDialogConfig) {}

  ngOnInit() {
      this._parameters = this._config.command.parameters.map(p => humanize(p, a => a.name));

      this._title = humanize(this._config.command, c => c.name).displayName;
  }

  _execute() {
    let params = this.model;

    if (this._config.command.parameters.length === 0) {
      params = undefined;
    }
    this._errorMessage = '';
    this._executing = true;

    this._ngZone.onStable
      .pipe(take(1))
      .subscribe(() => {
        this._api.executeCommand(this._config.device.name, this._config.command.name, params)
          .subscribe(res => {
            if (!!res && typeof res === 'object' && 'error' in res) {
              this._errorMessage = res.error;
            } else {
              this._dialogRef.close();
            }

            this._executing = false;
          }, err => {
              this._errorMessage = err.toString();

              this._executing = false;
          });
      });

  }
}
