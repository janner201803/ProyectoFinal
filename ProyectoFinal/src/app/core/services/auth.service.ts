import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseKey
);

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private correoEnCache = '';

  get correoActual(): string {
    return this.correoEnCache;
  }

  // REGISTRO
  async registrar(correo: string, password: string) {

    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: password
    });

    if (error) throw error;

    this.correoEnCache = data.user?.email ?? '';
    return data;
  }

  // LOGIN
  async login(correo: string, password: string) {

    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: password
    });

    if (error) throw error;

    this.correoEnCache = data.user?.email ?? '';
    return data;
  }

  // CERRAR SESIÓN
  async logout() {

    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    this.correoEnCache = '';
  }

  // OBTENER USUARIO ACTUAL
  async obtenerUsuario() {

    const { data, error } = await supabase.auth.getUser();

    if (error) return null;

    this.correoEnCache = data.user?.email ?? '';
    return data.user;
  }

}