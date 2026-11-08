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

  // REGISTRO
  async registrar(correo: string, password: string) {

    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: password
    });

    if (error) throw error;

    return data;
  }

  // LOGIN
  async login(correo: string, password: string) {

    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: password
    });

    if (error) throw error;

    return data;
  }

  // CERRAR SESIÓN
  async logout() {

    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  }

  // OBTENER USUARIO ACTUAL
  async obtenerUsuario() {

    const { data, error } = await supabase.auth.getUser();

    if (error) return null;

    return data.user;
  }

}