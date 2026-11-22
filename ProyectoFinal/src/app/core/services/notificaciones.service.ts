import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

export interface NotificacionRecord {
  id: string;
  title: string;
  body: string;
  route: string;
  type: 'mensaje' | 'evento' | 'publicacion';
  read_at: string | null;
  created_at: string;
  conversation_id: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly supabase = inject(SupabaseClientService).client;

  async listar(usuarioId: string): Promise<NotificacionRecord[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('id, title, body, route, type, read_at, created_at, conversation_id')
      .eq('user_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data ?? [];
  }

  async marcarLeida(notificacionId: string, usuarioId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificacionId)
      .eq('user_id', usuarioId);

    if (error) throw error;
  }

  async marcarTodasLeidas(usuarioId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', usuarioId)
      .is('read_at', null);

    if (error) throw error;
  }

  async marcarMensajesLeidos(conversationId: string, usuarioId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', usuarioId)
      .eq('conversation_id', conversationId)
      .eq('type', 'mensaje')
      .is('read_at', null);
    if (error) throw error;
  }

  escucharNuevas(usuarioId: string, alLlegar: (notificacion: NotificacionRecord) => void): () => void {
    const channel = this.supabase
      .channel(`notificaciones-${usuarioId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${usuarioId}`
      }, (payload) => alLlegar(payload.new as NotificacionRecord))
      .subscribe();

    return () => { void this.supabase.removeChannel(channel); };
  }
}
