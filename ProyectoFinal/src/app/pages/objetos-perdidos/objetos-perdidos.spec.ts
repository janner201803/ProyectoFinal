import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjetosPerdidos } from './objetos-perdidos';

describe('ObjetosPerdidos', () => {
  let component: ObjetosPerdidos;
  let fixture: ComponentFixture<ObjetosPerdidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjetosPerdidos],
    }).compileComponents();

    fixture = TestBed.createComponent(ObjetosPerdidos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
