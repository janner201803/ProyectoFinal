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

  // REGISTRO
  async registrar(correo: string, password: string) {

    const { data, error } = await this.supabase.auth.signUp({
      email: correo,
      password: password
    });

    if (error) throw error;

    this.correoEnCache = data.user?.email ?? '';
    return data;
  }

  // LOGIN
  async login(correo: string, password: string) {

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: correo,
      password: password
    });

    if (error) throw error;

    this.correoEnCache = data.user?.email ?? '';
    return data;
  }

  // CERRAR SESIÓN
  async logout() {

    const { error } = await this.supabase.auth.signOut();

    if (error) throw error;

    this.correoEnCache = '';
    this.nombreEnCache = '';
  }

  // OBTENER USUARIO ACTUAL
  async obtenerUsuario() {

    const { data, error } = await this.supabase.auth.getUser();

    if (error) return null;

    this.correoEnCache = data.user?.email ?? '';
    return data.user;
  }

}
