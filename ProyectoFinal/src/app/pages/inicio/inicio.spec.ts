import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Inicio } from './inicio';

describe('Inicio', () => {
  let component: Inicio;
  let fixture: ComponentFixture<Inicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inicio],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { correoActual: 'ejemplo@uao.edu.co', obtenerUsuario: async () => null }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Inicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should link to the profile from navigation and account controls', () => {
    const links = fixture.nativeElement.querySelectorAll('a[href="/perfil"]');

    expect(links).toHaveLength(2);
  });
});
