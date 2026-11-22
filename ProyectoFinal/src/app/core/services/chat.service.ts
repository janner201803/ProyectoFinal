import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

export interface ChatMessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface ChatConversationRecord {
  conversation_id: string;
  other_user_id: string;
  other_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly supabase = inject(SupabaseClientService).client;

  async listarConversaciones(): Promise<ChatConversationRecord[]> {
    const { data, error } = await this.supabase.rpc('get_my_chat_conversations');
    if (error) throw error;
    return (data ?? []) as ChatConversationRecord[];
  }

  async listarMensajes(conversationId: string): Promise<ChatMessageRecord[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async iniciarPorCorreo(email: string): Promise<string> {
    const { data, error } = await this.supabase.rpc('start_direct_chat', { p_email: email.trim() });
    if (error) throw error;
    if (typeof data !== 'string') throw new Error('Supabase no devolvió el identificador de conversación.');
    return data;
  }

  async iniciarPorUsuario(otherUserId: string): Promise<string> {
    const { data, error } = await this.supabase.rpc('start_direct_chat_with_user', {
      p_other_user_id: otherUserId
    });
    if (error) throw error;
    if (typeof data !== 'string') throw new Error('Supabase no devolvió el identificador de conversación.');
    return data;
  }

  async enviar(conversationId: string, senderId: string, body: string): Promise<void> {
    const { error } = await this.supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: body.trim()
    });
    if (error) throw error;
  }

  async marcarLeida(conversationId: string): Promise<void> {
    const { error } = await this.supabase.rpc('mark_direct_chat_read', { p_conversation_id: conversationId });
    if (error) throw error;
  }

  escucharCambios(usuarioId: string, alCambiar: () => void): () => void {
    const channel = this.supabase
      .channel(`chat-list-${usuarioId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_conversations', filter: `user_one=eq.${usuarioId}`
      }, alCambiar)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_conversations', filter: `user_two=eq.${usuarioId}`
      }, alCambiar)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages'
      }, alCambiar)
      .subscribe();
    return () => { void this.supabase.removeChannel(channel); };
  }

  escucharMensajes(conversationId: string, alCambiar: () => void): () => void {
    const channel = this.supabase
      .channel(`chat-messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}`
      }, alCambiar)
      .subscribe();
    return () => { void this.supabase.removeChannel(channel); };
  }

  escucharPresencia(usuarioId: string, alCambiar: (usuariosEnLinea: string[]) => void): () => void {
    const channel = this.supabase.channel('uao-chat-presence', {
      config: { presence: { key: usuarioId } }
    });
    channel.on('presence', { event: 'sync' }, () => {
      alCambiar(Object.keys(channel.presenceState()));
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: usuarioId });
      }
    });
    return () => { void this.supabase.removeChannel(channel); };
  }
}
