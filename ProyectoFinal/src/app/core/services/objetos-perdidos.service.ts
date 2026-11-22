import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

export interface ObjetoPerdidoRecord {
  id: string;
  title: string;
  description: string;
  status: 'Perdido' | 'Encontrado';
  location: string;
  image_url: string | null;
  author_name: string;
  user_id: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ObjetosPerdidosService {
  private readonly supabase = inject(SupabaseClientService).client;
  private readonly bucket = 'lost-items-images';

  async listar(): Promise<ObjetoPerdidoRecord[]> {
    const { data, error } = await this.supabase
      .from('lost_items')
      .select('id, title, description, status, location, image_url, author_name, user_id, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  async publicar(input: {
    title: string;
    description: string;
    status: 'Perdido' | 'Encontrado';
    location: string;
    author_name: string;
    user_id: string;
    image: File;
  }): Promise<void> {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposPermitidos.includes(input.image.type) || input.image.size > 5 * 1024 * 1024) {
      throw new Error('Usa una imagen JPG, PNG, WEBP o GIF de máximo 5 MB.');
    }

    const extension = input.image.name.split('.').pop()?.toLowerCase() || 'jpg';
    const ruta = `${input.user_id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(ruta, input.image, { contentType: input.image.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = this.supabase.storage.from(this.bucket).getPublicUrl(ruta);
    const { error: insertError } = await this.supabase.from('lost_items').insert({
      title: input.title,
      description: input.description,
      status: input.status,
      location: input.location,
      image_url: urlData.publicUrl,
      image_path: ruta,
      author_name: input.author_name,
      user_id: input.user_id
    });

    if (insertError) {
      await this.supabase.storage.from(this.bucket).remove([ruta]);
      throw insertError;
    }
  }

  async marcarComoEncontrado(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('lost_items')
      .update({ status: 'Encontrado' })
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('Sin permisos para actualizar esta publicación.');
  }

  escuchar(alCambiar: () => void): () => void {
    const channel = this.supabase
      .channel('objetos-perdidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_items' }, alCambiar)
      .subscribe();
    return () => { void this.supabase.removeChannel(channel); };
  }
}