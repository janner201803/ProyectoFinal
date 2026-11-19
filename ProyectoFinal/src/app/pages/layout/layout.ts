import { Component, Input, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Icono } from '../inicio/inicio';

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

  correo = '';

  menu = [
    { clave: 'inicio', etiqueta: 'Inicio', icono: 'inicio', ruta: '/inicio' },
    { clave: 'servicios', etiqueta: 'Servicios', icono: 'servicios', ruta: '/servicios' },
    { clave: 'objetos-perdidos', etiqueta: 'Objetos Perdidos', icono: 'buscar', ruta: '/objetos-perdidos' },
    { clave: 'eventos', etiqueta: 'Eventos', icono: 'calendario', ruta: '' },
    { clave: 'chat', etiqueta: 'Chat', icono: 'chat', ruta: '' },
    { clave: 'mapa', etiqueta: 'Mapa', icono: 'mapa', ruta: '/mapa' },
    { clave: 'perfil', etiqueta: 'Perfil', icono: 'perfil', ruta: '/perfil' }
  ];

  get iniciales(): string {
    return (this.correo.slice(0, 2) || 'U').toUpperCase();
  }

  async ngOnInit() {

    const usuario = await this.authService.obtenerUsuario();

    this.correo = usuario?.email ?? '';

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