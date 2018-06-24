import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceDashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DeviceDashboardComponent;
  let fixture: ComponentFixture<DeviceDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeviceDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
