import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { Layout } from './layout';

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            correoActual: 'ejemplo@uao.edu.co',
            obtenerUsuario: async () => null
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark notifications as read and close the panel when opened', () => {
    component.alternar();
    expect(component.abierto).toBe(true);
    expect(component.noLeidas).toBe(true);

    component.marcarTodas();
    expect(component.noLeidas).toBe(false);

    component.abrir(component.notificaciones[0]);
    expect(component.abierto).toBe(false);
  });

  it('should show the account name from the email', () => {
    expect(component.nombre).toBe('Ejemplo');
    expect(component.iniciales).toBe('EJ');
  });
});
