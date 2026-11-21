import { Component, Input, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Icono } from '../icono/icono';

interface Notificacion {
  titulo: string;
  detalle: string;
  tiempo: string;
  ruta: string;
  tipo: 'mensaje' | 'evento' | 'publicacion';
  leida: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, Icono],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit {

  @Input() activo = 'inicio';

  private authService = inject(AuthService);
  private router = inject(Router);

  correo = this.authService.correoActual;
  abierto = false;

  notificaciones: Notificacion[] = [
    {
      titulo: 'Nuevo mensaje',
      detalle: 'Laura M. respondió a tu conversación.',
      tiempo: 'Hace 5 min',
      ruta: '/chat',
      tipo: 'mensaje',
      leida: false
    },
    {
      titulo: 'Evento próximo',
      detalle: 'Feria de Bienestar Universitario · 15 de noviembre.',
      tiempo: 'Hace 1 h',
      ruta: '/eventos',
      tipo: 'evento',
      leida: false
    },
    {
      titulo: 'Objeto actualizado',
      detalle: 'Tu publicación "Morral negro" recibió una respuesta.',
      tiempo: 'Ayer',
      ruta: '/objetos-perdidos',
      tipo: 'publicacion',
      leida: true
    }
  ];

  menu = [
    { clave: 'inicio', etiqueta: 'Inicio', icono: 'inicio', ruta: '/inicio' },
    { clave: 'servicios', etiqueta: 'Servicios', icono: 'servicios', ruta: '/servicios' },
    { clave: 'objetos-perdidos', etiqueta: 'Objetos Perdidos', icono: 'buscar', ruta: '/objetos-perdidos' },
    { clave: 'eventos', etiqueta: 'Eventos', icono: 'calendario', ruta: '/eventos' },
    { clave: 'chat', etiqueta: 'Chat', icono: 'chat', ruta: '/chat' },
    { clave: 'mapa', etiqueta: 'Mapa', icono: 'mapa', ruta: '/mapa' },
    { clave: 'perfil', etiqueta: 'Perfil', icono: 'perfil', ruta: '/perfil' }
  ];

  get iniciales(): string {
    return (this.correo.slice(0, 2) || 'U').toUpperCase();
  }

  get nombre(): string {
    const base = this.correo.split('@')[0] ?? '';
    const primera = base.split(/[._-]/)[0] ?? '';
    return primera ? primera.charAt(0).toUpperCase() + primera.slice(1) : 'Estudiante';
  }

  get noLeidas(): boolean {
    return this.notificaciones.some((notificacion) => !notificacion.leida);
  }

  alternar(): void {
    this.abierto = !this.abierto;
  }

  marcarTodas(): void {
    this.notificaciones.forEach((notificacion) => {
      notificacion.leida = true;
    });
  }

  abrir(notificacion: Notificacion): void {
    notificacion.leida = true;
    this.abierto = false;
  }

  icono(tipo: Notificacion['tipo']): string {
    switch (tipo) {
      case 'mensaje':
        return 'mensaje';
      case 'evento':
        return 'calendario';
      case 'publicacion':
        return 'buscar';
    }
  }

  async ngOnInit() {

    const usuario = await this.authService.obtenerUsuario();

    if (usuario?.email) {
      this.correo = usuario.email;
    }

  }

  async cerrarSesion() {

    try {

      await this.authService.logout();

      await this.router.navigate(['/login']);

    } catch (error) {

      console.error(error);

    }
  }
}