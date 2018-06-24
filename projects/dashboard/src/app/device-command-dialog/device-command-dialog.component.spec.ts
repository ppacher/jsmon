import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceCommandDialogComponent } from './device-command-dialog.component';

describe('DeviceCommandDialogComponent', () => {
  let component: DeviceCommandDialogComponent;
  let fixture: ComponentFixture<DeviceCommandDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceCommandDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceCommandDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
