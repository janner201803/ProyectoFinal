import { ChangeDetectorRef, Component, inject } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo.trim())) {
      this.error = 'Escribe un correo válido.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener mínimo 6 caracteres';
      return;
    }

    this.cargando = true;
    this.cdr.markForCheck();

    try {

      const data = await this.authService.registrar(
        this.correo.trim(),
        this.password
      );

      if (data.user && data.user.identities?.length === 0) {
        this.error = 'Este correo ya está registrado. Inicia sesión.';
        return;
      }

      if (data.session) {

        await this.router.navigate(['/inicio']);

      } else {

        this.mensaje = 'Registro exitoso. Revisa tu correo para confirmar tu cuenta.';

      }

    } catch (error) {

      this.error = this.authService.mensajeError(error);

    } finally {

      this.cargando = false;
      this.cdr.markForCheck();
    }
  }
}