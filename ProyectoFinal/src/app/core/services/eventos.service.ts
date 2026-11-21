import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

export interface EventoRecord {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  location: string;
  category: string;
  capacity: number;
  registered_count: number;
}

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly supabase = inject(SupabaseClientService).client;

  async listar(usuarioId: string): Promise<Array<EventoRecord & { inscrito: boolean }>> {
    const { data, error } = await this.supabase
      .from('events')
      .select('id, title, description, starts_at, location, category, capacity, registered_count')
      .eq('published', true)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    if (error) throw error;
    const events = data ?? [];
    if (events.length === 0) return [];

    const { data: registrations, error: registrationError } = await this.supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', usuarioId)
      .in('event_id', events.map((evento) => evento.id));

    if (registrationError) throw registrationError;
    const registeredIds = new Set((registrations ?? []).map((row) => row.event_id));

    return events.map((evento) => ({ ...evento, inscrito: registeredIds.has(evento.id) }));
  }

  async crear(evento: {
    title: string;
    description: string | null;
    starts_at: string;
    location: string;
    category: string;
    capacity: number;
    created_by: string;
  }): Promise<void> {
    const { error } = await this.supabase.from('events').insert({ ...evento, published: true });
    if (error) throw error;
  }

  async inscribirse(eventoId: string, usuarioId: string): Promise<void> {
    const { error } = await this.supabase
      .from('event_registrations')
      .insert({ event_id: eventoId, user_id: usuarioId });

    if (error) throw error;
  }

  async cancelarInscripcion(eventoId: string, usuarioId: string): Promise<void> {
    const { error } = await this.supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventoId)
      .eq('user_id', usuarioId);

    if (error) throw error;
  }

  escucharCambios(usuarioId: string, alCambiar: () => void): () => void {
    const channel = this.supabase
      .channel(`eventos-${usuarioId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, alCambiar)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_registrations',
        filter: `user_id=eq.${usuarioId}`
      }, alCambiar)
      .subscribe();

    return () => { void this.supabase.removeChannel(channel); };
  }
}
