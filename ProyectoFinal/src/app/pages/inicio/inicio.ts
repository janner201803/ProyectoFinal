import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {

  private authService = inject(AuthService);
  private router = inject(Router);

  correo = '';

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