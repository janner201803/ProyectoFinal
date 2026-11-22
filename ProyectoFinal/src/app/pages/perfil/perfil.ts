import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AvatarService } from '../../core/services/avatar.service';
import { PerfilPreferencias, PerfilService, PublicacionPerfil, ResumenPerfil } from '../../core/services/perfil.service';
import { Layout } from '../layout/layout';
import { Icono } from '../icono/icono';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [Layout, Icono],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly perfilService = inject(PerfilService);
  private readonly avatarService = inject(AvatarService);
  private readonly cdr = inject(ChangeDetectorRef);
  private userId = '';

  correo = this.authService.correoActual;
  nombre = 'Estudiante';
  nombreEditado = '';
  avatarUrl: string | null = null;
  subiendoFoto = false;
  editando = false;
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';
  verTodas = false;
  resumenDatos: ResumenPerfil = { publicaciones: 0, inscripciones: 0, eventos: 0 };
  publicaciones: PublicacionPerfil[] = [];
  preferencias: PerfilPreferencias = {
    display_name: 'Estudiante',
    profile_public: true,
    show_email: true,
    show_publications: true
  };

  get iniciales(): string {
    const partes = this.nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length > 1) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    return (partes[0]?.slice(0, 2) || this.correo.slice(0, 2) || 'U').toUpperCase();
  }

  get resumen(): Array<{ valor: number; etiqueta: string }> {
    return [
      { valor: this.resumenDatos.publicaciones, etiqueta: 'Publicaciones' },
      { valor: this.resumenDatos.inscripciones, etiqueta: 'Inscripciones' },
      { valor: this.resumenDatos.eventos, etiqueta: 'Eventos' }
    ];
  }

  get publicacionesVisibles(): PublicacionPerfil[] {
    return this.verTodas ? this.publicaciones : this.publicaciones.slice(0, 4);
  }

  async ngOnInit(): Promise<void> {
    try {
      const usuario = await this.authService.obtenerUsuario();
      if (!usuario) {
        this.error = 'Inicia sesión para consultar tu perfil.';
        return;
      }
      this.userId = usuario.id;
      this.correo = usuario.email ?? '';
      const nombrePredeterminado = this.nombreDesdeCorreo(this.correo);
      const [preferencias, actividad, avatar] = await Promise.all([
        this.perfilService.cargarPreferencias(usuario.id, nombrePredeterminado),
        this.perfilService.cargarActividad(usuario.id),
        this.avatarService.obtener(usuario.id).catch(() => null)
      ]);
      this.preferencias = preferencias;
      this.nombre = preferencias.display_name || nombrePredeterminado;
      this.authService.establecerNombreActual(this.nombre);
      this.nombreEditado = this.nombre;
      this.publicaciones = actividad.publicaciones;
      this.resumenDatos = actividad.resumen;
      this.avatarUrl = avatar;
      this.avatarService.establecerActual(usuario.id, avatar);
    } catch {
      this.error = 'No se pudo cargar toda la información del perfil. Verifica que ejecutaste el SQL actualizado en Supabase.';
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  comenzarEdicion(): void {
    this.nombreEditado = this.nombre;
    this.editando = true;
    this.error = '';
  }

  cancelarEdicion(): void {
    this.editando = false;
    this.nombreEditado = this.nombre;
  }

  async guardarNombre(): Promise<void> {
    const nuevoNombre = this.nombreEditado.trim();
    if (!nuevoNombre || !this.userId || this.guardando) {
      if (!nuevoNombre) this.error = 'Escribe un nombre para guardar el perfil.';
      return;
    }
    this.guardando = true;
    this.error = '';
    this.mensaje = '';
    try {
      const actualizadas = { ...this.preferencias, display_name: nuevoNombre };
      await this.perfilService.guardarPreferencias(this.userId, actualizadas);
      this.preferencias = actualizadas;
      this.nombre = nuevoNombre;
      this.authService.establecerNombreActual(nuevoNombre);
      this.editando = false;
      this.mensaje = 'Perfil actualizado.';
    } catch {
      this.error = 'No se pudo guardar el nombre. Revisa el SQL de perfiles en Supabase.';
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  async cambiarFoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo || !this.userId || this.subiendoFoto) return;

    this.error = '';
    this.mensaje = '';
    this.subiendoFoto = true;
    this.cdr.markForCheck();
    try {
      this.avatarUrl = await this.avatarService.subir(this.userId, this.nombre, archivo);
      this.mensaje = 'Foto de perfil actualizada.';
    } catch (error) {
      this.error = error instanceof Error && error.message.includes('2 MB')
        ? error.message
        : 'No se pudo subir la foto. Verifica el SQL y el bucket "avatars" en Supabase.';
    } finally {
      this.subiendoFoto = false;
      this.cdr.markForCheck();
    }
  }

  async quitarFoto(): Promise<void> {
    if (!this.userId || !this.avatarUrl || this.subiendoFoto) return;
    this.error = '';
    this.mensaje = '';
    this.subiendoFoto = true;
    this.cdr.markForCheck();
    try {
      await this.avatarService.quitar(this.userId);
      this.avatarUrl = null;
      this.mensaje = 'Foto de perfil eliminada.';
    } catch {
      this.error = 'No se pudo quitar la foto.';
    } finally {
      this.subiendoFoto = false;
      this.cdr.markForCheck();
    }
  }

  tiempo(fecha: string): string {
    const minutos = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 60_000));
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
  }

  private nombreDesdeCorreo(correo: string): string {
    const base = correo.split('@')[0] ?? '';
    return base.split(/[._-]/).filter(Boolean)
      .map((parte) => parte.charAt(0).toLocaleUpperCase('es') + parte.slice(1))
      .join(' ') || 'Estudiante';
  }
}