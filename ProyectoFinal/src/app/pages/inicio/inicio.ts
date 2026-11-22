import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EventoRecord, EventosService } from '../../core/services/eventos.service';
import { ObjetoPerdidoRecord, ObjetosPerdidosService } from '../../core/services/objetos-perdidos.service';
import { Layout } from '../layout/layout';
import { Icono } from '../icono/icono';

interface ObjetoReciente {
  id: string;
  nombre: string;
  detalle: string;
  estado: 'Perdido' | 'Encontrado';
  tiempo: string;
  imagen: string | null;
}

interface EventoInicio {
  id: string;
  titulo: string;
  fecha: string;
  lugar: string;
  categoria: string;
  cupos: number;
  inscritosTotales: number;
  inscrito: boolean;
  procesando: boolean;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [Layout, Icono, RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {

  private authService = inject(AuthService);
  private objetosService = inject(ObjetosPerdidosService);
  private eventosService = inject(EventosService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private usuarioId = '';

  correo = this.authService.correoActual;

  eventos: EventoInicio[] = [];
  eventoActual = 0;
  cargandoEventos = true;
  errorEvento = '';

  objetos: ObjetoReciente[] = [];
  cargandoObjetos = true;

  actividad = [
    { texto: 'Tienes 2 mensajes nuevos', icono: 'mensaje', tono: 'azul' },
    { texto: '1 evento próximo', icono: 'calendario', tono: 'rojo' },
    { texto: '3 notificaciones', icono: 'campana', tono: 'rojo' }
  ];

  get nombre(): string {
    const base = this.correo.split('@')[0] ?? '';
    const primera = base.split(/[._-]/)[0] ?? '';
    return primera ? primera.charAt(0).toUpperCase() + primera.slice(1) : 'Estudiante';
  }

  async ngOnInit() {
    void this.cargarObjetos();

    const usuario = await this.authService.obtenerUsuario();

    if (usuario?.email) {
      this.correo = usuario.email;
    }

    if (usuario) {
      this.usuarioId = usuario.id;
      await this.cargarEventos();
    } else {
      this.cargandoEventos = false;
    }

    this.cdr.markForCheck();
  }

  ejecutar(accion?: string): void {
    const rutas = ['servicios', 'mapa', 'objetos-perdidos', 'eventos', 'perfil', 'chat'];
    if (accion && rutas.includes(accion)) {
      void this.router.navigate([`/${accion}`]);
    }
  }

  seleccionarEvento(indice: number): void {
    this.eventoActual = indice;
  }

  async alternarInscripcion(evento: EventoInicio): Promise<void> {
    if (!this.usuarioId || evento.procesando) return;

    evento.procesando = true;
    this.errorEvento = '';
    this.cdr.markForCheck();

    try {
      if (evento.inscrito) {
        await this.eventosService.cancelarInscripcion(evento.id, this.usuarioId);
        evento.inscrito = false;
        evento.inscritosTotales = Math.max(0, evento.inscritosTotales - 1);
      } else {
        await this.eventosService.inscribirse(evento.id, this.usuarioId);
        evento.inscrito = true;
        evento.inscritosTotales += 1;
      }
    } catch (error) {
      this.errorEvento = this.mensajeError(error);
      await this.cargarEventos();
    } finally {
      evento.procesando = false;
      this.cdr.markForCheck();
    }
  }

  private async cargarEventos(): Promise<void> {
    try {
      const registros = await this.eventosService.listar(this.usuarioId);
      const ahora = Date.now();
      this.eventos = registros
        .filter((registro) => new Date(registro.starts_at).getTime() >= ahora)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        .slice(0, 5)
        .map((registro) => this.eventoAVista(registro));
      if (this.eventoActual >= this.eventos.length) this.eventoActual = 0;
    } catch {
      this.eventos = [];
    } finally {
      this.cargandoEventos = false;
      this.cdr.markForCheck();
    }
  }

  private eventoAVista(registro: EventoRecord & { inscrito: boolean }): EventoInicio {
    const fecha = new Date(registro.starts_at);
    const dia = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(fecha);
    const hora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(fecha);

    return {
      id: registro.id,
      titulo: registro.title,
      fecha: `${dia} • ${hora}`,
      lugar: registro.location,
      categoria: registro.category,
      cupos: registro.capacity,
      inscritosTotales: registro.registered_count,
      inscrito: registro.inscrito,
      procesando: false
    };
  }

  private mensajeError(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const mensaje = String((error as { message: unknown }).message);
      if (mensaje.toLowerCase().includes('cupo')) return 'Este evento ya no tiene cupos disponibles.';
    }
    return 'No se pudo actualizar tu inscripción. Intenta de nuevo.';
  }

  private async cargarObjetos(): Promise<void> {
    try {
      const registros = await this.objetosService.listar();
      this.objetos = registros.slice(0, 2).map((registro) => this.objetoAVista(registro));
    } catch {
      this.objetos = [];
    } finally {
      this.cargandoObjetos = false;
      this.cdr.markForCheck();
    }
  }

  private objetoAVista(registro: ObjetoPerdidoRecord): ObjetoReciente {
    return {
      id: registro.id,
      nombre: registro.title,
      detalle: `${registro.status === 'Encontrado' ? 'Encontrado' : 'Perdido'} en ${registro.location}.`,
      estado: registro.status,
      tiempo: this.tiempoTranscurrido(registro.created_at),
      imagen: registro.image_url
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
}