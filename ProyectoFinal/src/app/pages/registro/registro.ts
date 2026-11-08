import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {

  private authService = inject(AuthService);
  private router = inject(Router);

  correo = '';
  password = '';
  error = '';
  mensaje = '';
  cargando = false;

  async registrar() {

    this.error = '';
    this.mensaje = '';

    if (!this.correo || !this.password) {
      this.error = 'Completa todos los campos';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener mínimo 6 caracteres';
      return;
    }

    this.cargando = true;

    try {

      const data = await this.authService.registrar(
        this.correo,
        this.password
      );

      if (data.session) {

        await this.router.navigate(['/inicio']);

      } else {

        this.mensaje = 'Registro exitoso. Revisa tu correo para confirmar tu cuenta.';

      }

    } catch (error: any) {

      this.error = error.message;

    } finally {

      this.cargando = false;
    }
  }
}