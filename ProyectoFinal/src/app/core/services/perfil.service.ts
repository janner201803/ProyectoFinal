import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

export interface PerfilPreferencias {
  display_name: string;
  profile_public: boolean;
  show_email: boolean;
  show_publications: boolean;
}

export interface PublicacionPerfil {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  estado: string;
  icono: string;
}

export interface ResumenPerfil {
  publicaciones: number;
  inscripciones: number;
  eventos: number;
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly supabase = inject(SupabaseClientService).client;

  async cargarPreferencias(userId: string, nombrePredeterminado: string): Promise<PerfilPreferencias> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('display_name, profile_public, show_email, show_publications')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;

    const inicial: PerfilPreferencias = {
      display_name: nombrePredeterminado,
      profile_public: true,
      show_email: true,
      show_publications: true
    };
    const { error: insertError } = await this.supabase.from('profiles').upsert({ id: userId, ...inicial });
    if (insertError) throw insertError;
    return inicial;
  }

  async guardarPreferencias(userId: string, preferencias: PerfilPreferencias): Promise<void> {
    const { error } = await this.supabase.from('profiles').upsert({ id: userId, ...preferencias });
    if (error) throw error;
  }

  async cargarActividad(userId: string): Promise<{ resumen: ResumenPerfil; publicaciones: PublicacionPerfil[] }> {
    const [objetos, eventos, inscripciones] = await Promise.all([
      this.supabase.from('lost_items')
        .select('id, title, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      this.supabase.from('events')
        .select('id, title, starts_at, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false }),
      this.supabase.from('event_registrations')
        .select('event_id', { count: 'exact', head: true })
        .eq('user_id', userId)
    ]);

    if (objetos.error) throw objetos.error;
    if (eventos.error) throw eventos.error;
    if (inscripciones.error) throw inscripciones.error;

    const posts: PublicacionPerfil[] = [
      ...(objetos.data ?? []).map((item) => ({
        id: `objeto-${item.id}`,
        titulo: item.title,
        tipo: item.status === 'Encontrado' ? 'Objeto encontrado' : 'Objeto perdido',
        fecha: item.created_at,
        estado: 'Activa',
        icono: 'buscar'
      })),
      ...(eventos.data ?? []).map((evento) => ({
        id: `evento-${evento.id}`,
        titulo: evento.title,
        tipo: 'Evento publicado',
        fecha: evento.created_at,
        estado: new Date(evento.starts_at) < new Date() ? 'Finalizado' : 'Activo',
        icono: 'calendario'
      }))
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return {
      publicaciones: posts,
      resumen: {
        publicaciones: posts.length,
        inscripciones: inscripciones.count ?? 0,
        eventos: eventos.data?.length ?? 0
      }
    };
  }
}
