import { Component, inject } from '@angular/core';
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

    this.cargando = true;

    try {

      await this.authService.login(
        this.correo,
        this.password
      );

      await this.router.navigate(['/inicio']);

    } catch (error: any) {

      this.error = error.message;

    } finally {

      this.cargando = false;
    }
  }
}