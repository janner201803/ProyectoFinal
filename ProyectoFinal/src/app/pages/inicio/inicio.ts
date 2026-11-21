import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Layout } from '../layout/layout';
import { Icono } from '../icono/icono';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [Layout, Icono],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  correo = this.authService.correoActual;

  eventos = [
    {
      titulo: 'Feria de Bienestar Universitario',
      fecha: '15 de Noviembre, 2026 • 9:00 a.m.',
      lugar: 'Plazoleta Central',
      categoria: 'Bienestar'
    },
    {
      titulo: 'Muestra de Emprendimiento UAO',
      fecha: '18 de Noviembre, 2026 • 2:00 p.m.',
      lugar: 'Auditorio Principal',
      categoria: 'Emprendimiento'
    },
    {
      titulo: 'Torneo Interfacultades de Fútbol',
      fecha: '21 de Noviembre, 2026 • 8:00 a.m.',
      lugar: 'Canchas Deportivas',
      categoria: 'Deportes'
    }
  ];

  eventoActual = 0;

  objetos = [
    { nombre: 'Morral negro', detalle: 'Encontrado en la biblioteca.', estado: 'Encontrado', tiempo: 'Hace 2 horas' },
    { nombre: 'Audífonos inalámbricos', detalle: 'Perdidos en el edificio C.', estado: 'Perdido', tiempo: 'Hace 1 día' }
  ];

  actividad = [
    { texto: 'Tienes 2 mensajes nuevos', icono: 'mensaje', tono: 'azul' },
    { texto: '1 evento próximo', icono: 'calendario', tono: 'rojo' },
    { texto: '3 notificaciones', icono: 'campana', tono: 'rojo' }
  ];

  get nombre(): string {
    const base = this.correo.split('@')[0] ?? '';
    const primera = base.split(/[._-]/)[0] ?? '';
    return primera ? primera.charAt(0).toUpperCase() + primera.slice(1) : 'Estudiante';
  }

  async ngOnInit() {

    const usuario = await this.authService.obtenerUsuario();

    if (usuario?.email) {
      this.correo = usuario.email;
    }

    this.cdr.markForCheck();

  }

  ejecutar(accion?: string): void {
    const rutas = ['servicios', 'mapa', 'objetos-perdidos', 'eventos', 'perfil', 'chat'];
    if (accion && rutas.includes(accion)) {
      void this.router.navigate([`/${accion}`]);
    }
  }

  seleccionarEvento(indice: number): void {
    this.eventoActual = indice;
  }
}