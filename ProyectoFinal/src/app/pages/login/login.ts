import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  correo = '';
  password = '';
  error = '';
  cargando = false;

  async iniciarSesion() {

    this.error = '';

    if (!this.correo || !this.password) {
      this.error = 'Completa todos los campos';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo.trim())) {
      this.error = 'Escribe un correo válido.';
      return;
    }

    this.cargando = true;
    this.cdr.markForCheck();

    try {

      await this.authService.login(
        this.correo.trim(),
        this.password
      );

      await this.router.navigate(['/inicio']);

    } catch (error) {

      this.error = this.authService.mensajeError(error);

    } finally {

      this.cargando = false;
      this.cdr.markForCheck();
    }
  }
}