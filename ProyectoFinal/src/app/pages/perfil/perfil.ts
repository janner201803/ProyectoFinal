import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Layout } from '../layout/layout';
import { Icono } from '../icono/icono';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [Layout, Icono],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {

  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  correo = this.authService.correoActual;

  resumen = [
    { valor: 3, etiqueta: 'Publicaciones' },
    { valor: 1, etiqueta: 'Solicitudes' },
    { valor: 2, etiqueta: 'Eventos' }
  ];

  publicaciones = [
    { titulo: 'Morral negro', tipo: 'Objeto encontrado', tiempo: 'Hace 2 horas', estado: 'Activa' },
    { titulo: 'Tutorías de cálculo', tipo: 'Servicio ofrecido', tiempo: 'Hace 3 días', estado: 'Activa' },
    { titulo: 'Calculadora científica', tipo: 'Objeto perdido', tiempo: 'Hace 1 semana', estado: 'Resuelta' }
  ];

  privacidad = [
    { titulo: 'Perfil público', detalle: 'Otros estudiantes pueden ver tu perfil.', activo: true },
    { titulo: 'Mostrar mi correo', detalle: 'Tu correo será visible en tu perfil.', activo: false },
    { titulo: 'Mostrar mis publicaciones', detalle: 'Tu historial aparecerá en tu perfil.', activo: true }
  ];

  get nombre(): string {
    const base = this.correo.split('@')[0] ?? '';
    const primera = base.split(/[._-]/)[0] ?? '';
    return primera ? primera.charAt(0).toUpperCase() + primera.slice(1) : 'Estudiante';
  }

  get iniciales(): string {
    return (this.correo.slice(0, 2) || 'U').toUpperCase();
  }

  async ngOnInit() {

    const usuario = await this.authService.obtenerUsuario();

    if (usuario?.email) {
      this.correo = usuario.email;
    }

    this.cdr.markForCheck();

  }
}