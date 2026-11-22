import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

@Injectable({ providedIn: 'root' })
export class AvatarService {
  private readonly supabase = inject(SupabaseClientService).client;
  private readonly bucket = 'avatars';

  // Foto del usuario actual, compartida por todas las páginas (header)
  avatarActual: string | null = null;
  private cargadoPara = '';

  async cargarActual(userId: string): Promise<void> {
    if (this.cargadoPara === userId) return;
    this.avatarActual = await this.obtener(userId).catch(() => null);
    this.cargadoPara = userId;
  }

  establecerActual(userId: string, url: string | null): void {
    this.avatarActual = url;
    this.cargadoPara = userId;
  }

  limpiar(): void {
    this.avatarActual = null;
    this.cargadoPara = '';
  }

  async obtener(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data?.avatar_url ?? null;
  }

  // Para el chat: trae las fotos de varios usuarios en una sola consulta
  async obtenerVarios(ids: string[]): Promise<Map<string, string | null>> {
    const mapa = new Map<string, string | null>();
    if (!ids.length) return mapa;
    ids.forEach((id) => mapa.set(id, null));
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, avatar_url')
      .in('id', ids);
    if (error) throw error;
    (data ?? []).forEach((fila) => mapa.set(fila.id, fila.avatar_url ?? null));
    return mapa;
  }

  async subir(userId: string, nombre: string, archivo: File): Promise<string> {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!permitidos.includes(archivo.type) || archivo.size > 2 * 1024 * 1024) {
      throw new Error('Usa una imagen JPG, PNG o WEBP de máximo 2 MB.');
    }

    const ruta = `${userId}/avatar`;
    const { error: errorSubida } = await this.supabase.storage
      .from(this.bucket)
      .upload(ruta, archivo, { contentType: archivo.type, upsert: true });
    if (errorSubida) throw errorSubida;

    const { data: publica } = this.supabase.storage.from(this.bucket).getPublicUrl(ruta);
    const url = `${publica.publicUrl}?v=${Date.now()}`;

    const { data, error } = await this.supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', userId)
      .select('id');
    if (error) throw error;

    if (!data?.length) {
      const { error: errorCrear } = await this.supabase
        .from('profiles')
        .upsert({ id: userId, display_name: nombre, avatar_url: url });
      if (errorCrear) throw errorCrear;
    }

    this.establecerActual(userId, url);
    return url;
  }

  async quitar(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', userId);
    if (error) throw error;
    await this.supabase.storage.from(this.bucket).remove([`${userId}/avatar`]);
    this.establecerActual(userId, null);
  }
}