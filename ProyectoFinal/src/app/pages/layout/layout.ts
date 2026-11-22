import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AvatarService } from '../../core/services/avatar.service';
import { NotificacionRecord, NotificacionesService } from '../../core/services/notificaciones.service';
import { Icono } from '../icono/icono';

interface Notificacion {
  id: string;
  titulo: string;
  detalle: string;
  tiempo: string;
  ruta: string;
  tipo: 'mensaje' | 'evento' | 'publicacion';
  conversationId: string | null;
  leida: boolean;
  creada: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, Icono],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit, OnDestroy {

  @Input() activo = 'inicio';

  private authService = inject(AuthService);
  private avatarService = inject(AvatarService);
  private notificacionesService = inject(NotificacionesService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private usuarioId = '';
  private dejarDeEscuchar?: () => void;

  correo = this.authService.correoActual;
  abierto = false;

  notificaciones: Notificacion[] = [];

  menu = [
    { clave: 'inicio', etiqueta: 'Inicio', icono: 'inicio', ruta: '/inicio' },
    { clave: 'servicios', etiqueta: 'Servicios', icono: 'servicios', ruta: '/servicios' },
    { clave: 'objetos-perdidos', etiqueta: 'Objetos Perdidos', icono: 'buscar', ruta: '/objetos-perdidos' },
    { clave: 'eventos', etiqueta: 'Eventos', icono: 'calendario', ruta: '/eventos' },
    { clave: 'chat', etiqueta: 'Chat', icono: 'chat', ruta: '/chat' },
    { clave: 'mapa', etiqueta: 'Mapa', icono: 'mapa', ruta: '/mapa' },
    { clave: 'perfil', etiqueta: 'Perfil', icono: 'perfil', ruta: '/perfil' }
  ];

  get avatarUrl(): string | null {
    return this.avatarService.avatarActual;
  }

  get iniciales(): string {
    const partes = this.nombre.split(/\s+/).filter(Boolean);
    if (partes.length > 1) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    return (partes[0]?.slice(0, 2) || 'U').toUpperCase();
  }

  get nombre(): string {
    if (this.authService.nombreActual) return this.authService.nombreActual;
    const base = this.correo.split('@')[0] ?? '';
    const primera = base.split(/[._-]/)[0] ?? '';
    return primera ? primera.charAt(0).toUpperCase() + primera.slice(1) : 'Estudiante';
  }

  get noLeidas(): boolean {
    return this.notificaciones.some((notificacion) => !notificacion.leida);
  }

  alternar(): void {
    this.abierto = !this.abierto;
  }

  marcarTodas(): void {
    this.notificaciones.forEach((notificacion) => {
      notificacion.leida = true;
    });
    if (this.usuarioId) {
      void this.notificacionesService.marcarTodasLeidas(this.usuarioId).catch(() => this.cargarNotificaciones());
    }
  }

  abrir(notificacion: Notificacion): void {
    notificacion.leida = true;
    this.abierto = false;
    if (this.usuarioId) {
      void this.notificacionesService.marcarLeida(notificacion.id, this.usuarioId)
        .catch(() => this.cargarNotificaciones());
    }
  }

  icono(tipo: Notificacion['tipo']): string {
    switch (tipo) {
      case 'mensaje':
        return 'mensaje';
      case 'evento':
        return 'calendario';
      case 'publicacion':
        return 'buscar';
    }
  }

  async ngOnInit() {

    const usuario = await this.authService.obtenerUsuario();

    if (usuario?.email) {
      this.correo = usuario.email;
    }

    if (usuario) {
      this.usuarioId = usuario.id;
      void this.avatarService.cargarActual(usuario.id).then(() => this.cdr.markForCheck());
      this.dejarDeEscuchar = this.notificacionesService.escucharNuevas(usuario.id, (record) => {
        const actualizada = this.aVista(record);
        this.notificaciones = this.combinarNotificaciones([
          ...this.notificaciones.filter((item) => item.id !== actualizada.id),
          actualizada
        ]);
        this.cdr.markForCheck();
      });
      await this.cargarNotificaciones();
    }

  }

  ngOnDestroy(): void {
    this.dejarDeEscuchar?.();
  }

  private async cargarNotificaciones(): Promise<void> {
    if (!this.usuarioId) return;
    try {
      const records = await this.notificacionesService.listar(this.usuarioId);
      this.notificaciones = this.combinarNotificaciones([
        ...records.map((record) => this.aVista(record)),
        ...this.notificaciones
      ]);
      this.cdr.markForCheck();
    } catch (error) {
      console.error('No se pudieron cargar las notificaciones.', error);
    }
  }

  private combinarNotificaciones(items: Notificacion[]): Notificacion[] {
    const unicas = new Map(items.map((notificacion) => [notificacion.id, notificacion]));
    return [...unicas.values()]
      .sort((a, b) => new Date(b.creada).getTime() - new Date(a.creada).getTime())
      .slice(0, 20);
  }

  private aVista(record: NotificacionRecord): Notificacion {
    return {
      id: record.id,
      titulo: record.title,
      detalle: record.body,
      tiempo: this.tiempoTranscurrido(record.created_at),
      ruta: record.route,
      tipo: record.type,
      conversationId: record.conversation_id,
      leida: record.read_at !== null,
      creada: record.created_at
    };
  }

  private tiempoTranscurrido(fecha: string): string {
    const minutos = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 60_000));
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
  }

  async cerrarSesion() {

    try {

      this.avatarService.limpiar();

      await this.authService.logout();

      await this.router.navigate(['/login']);

    } catch (error) {

      console.error(error);

    }
  }
}