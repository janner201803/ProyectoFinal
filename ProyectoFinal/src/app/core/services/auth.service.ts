import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly supabase = inject(SupabaseClientService).client;

  private correoEnCache = '';
  private nombreEnCache = '';

  get correoActual(): string {
    return this.correoEnCache;
  }

  get nombreActual(): string {
    return this.nombreEnCache;
  }

  establecerNombreActual(nombre: string): void {
    this.nombreEnCache = nombre;
  }

  async registrar(correo: string, password: string) {

    const { data, error } = await this.supabase.auth.signUp({
      email: correo,
      password: password
    });

    if (error) throw error;

    this.correoEnCache = data.user?.email ?? '';
    return data;
  }

  async login(correo: string, password: string) {

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: correo,
      password: password
    });

    if (error) throw error;

    this.correoEnCache = data.user?.email ?? '';
    return data;
  }

  async logout() {

    const { error } = await this.supabase.auth.signOut();

    if (error) throw error;

    this.correoEnCache = '';
    this.nombreEnCache = '';
  }

  async obtenerUsuario() {

    const { data, error } = await this.supabase.auth.getUser();

    if (error) return null;

    this.correoEnCache = data.user?.email ?? '';
    return data.user;
  }

  mensajeError(error: unknown): string {
    const e = (error ?? {}) as { code?: string; message?: string; status?: number };

    switch (e.code) {
      case 'invalid_credentials':
        return 'Correo o contraseña incorrectos.';
      case 'email_not_confirmed':
        return 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.';
      case 'user_already_exists':
      case 'email_exists':
        return 'Este correo ya está registrado. Inicia sesión.';
      case 'weak_password':
        return 'La contraseña es muy débil. Usa una más segura.';
      case 'email_address_invalid':
      case 'validation_failed':
        return 'El correo no es válido.';
      case 'signup_disabled':
        return 'El registro de nuevas cuentas está deshabilitado.';
      case 'over_request_rate_limit':
      case 'over_email_send_rate_limit':
        return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    }

    const mensaje = e.message ?? '';
    if (mensaje.includes('Failed to fetch') || mensaje.includes('NetworkError')) {
      return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
    }
    return mensaje || 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  }

}
