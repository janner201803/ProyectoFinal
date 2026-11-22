import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CORREO_ADMIN_EVENTOS, EventoRecord, EventosService } from '../../core/services/eventos.service';
import { Layout } from '../layout/layout';
import { Icono } from '../icono/icono';

interface EventoVista {
  id: string;
  titulo: string;
  dia: number;
  mes: string;
  hora: string;
  fechaInicio: Date;
  lugar: string;
  categoria: string;
  cupos: number;
  inscritosTotales: number;
  inscrito: boolean;
  procesando: boolean;
}

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [Layout, Icono, FormsModule],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css'
})
export class Eventos implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly eventosService = inject(EventosService);
  private readonly cdr = inject(ChangeDetectorRef);
  private usuarioId = '';
  private dejarDeEscuchar?: () => void;

  filtro = '';
  seleccion: number | null = null;
  cargando = true;
  error = '';
  mensaje = '';
  puedeCrearEventos = false;
  mostrarFormulario = false;
  guardandoEvento = false;
  formulario = this.formularioVacio();
  anio = new Date().getFullYear();
  mes = new Date().getMonth();
  semana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  eventos: EventoVista[] = [];

  get fechaMinima(): string {
    return this.fechaHoraLocal(new Date());
  }

  get nombreMes(): string {
    const mes = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(new Date(this.anio, this.mes));
    return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${this.anio}`;
  }

  get esMesActual(): boolean {
    const hoy = new Date();
    return hoy.getFullYear() === this.anio && hoy.getMonth() === this.mes;
  }

  get categorias(): string[] {
    return [...new Set(this.eventos.map((evento) => evento.categoria))];
  }

  get visibles(): EventoVista[] {
    const ahora = Date.now();
    return this.eventos.filter((evento) => {
      if (this.filtro && evento.categoria !== this.filtro) return false;
      if (this.seleccion !== null) return this.esDelDia(evento, this.seleccion);
      return evento.fechaInicio.getTime() >= ahora;
    });
  }

  get tituloLista(): string {
    const total = this.visibles.length;
    if (this.seleccion !== null) {
      const fecha = new Date(this.anio, this.mes, this.seleccion);
      const texto = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' }).format(fecha);
      return `${total} ${total === 1 ? 'evento' : 'eventos'} el ${texto}`;
    }
    return `${total} ${total === 1 ? 'evento próximo' : 'eventos próximos'}`;
  }

  get inscritos(): EventoVista[] {
    return this.eventos.filter((evento) => evento.inscrito);
  }

  get dias(): number[] {
    const primero = new Date(this.anio, this.mes, 1).getDay();
    const desfase = (primero + 6) % 7;
    const total = new Date(this.anio, this.mes + 1, 0).getDate();
    return [...Array<number>(desfase).fill(0), ...Array.from({ length: total }, (_, i) => i + 1)];
  }

  async ngOnInit(): Promise<void> {
    try {
      const usuario = await this.authService.obtenerUsuario();
      if (!usuario) {
        this.error = 'Inicia sesión para consultar los eventos.';
        this.cargando = false;
        return;
      }

      this.usuarioId = usuario.id;
      this.puedeCrearEventos = usuario.email?.toLowerCase() === CORREO_ADMIN_EVENTOS;
      this.dejarDeEscuchar = this.eventosService.escucharCambios(this.usuarioId, () => {
        void this.cargarEventos();
      });
      await this.cargarEventos();
    } catch {
      this.error = 'No se pudieron cargar los eventos. Revisa la conexión con Supabase.';
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.dejarDeEscuchar?.();
  }

  contar(categoria: string): number {
    return this.eventos.filter((evento) => evento.categoria === categoria).length;
  }

  esEvento(dia: number): boolean {
    return this.eventos.some((evento) => this.esDelDia(evento, dia));
  }

  esHoy(dia: number): boolean {
    const hoy = new Date();
    return hoy.getFullYear() === this.anio && hoy.getMonth() === this.mes && hoy.getDate() === dia;
  }

  filtrar(categoria: string): void {
    this.filtro = this.filtro === categoria ? '' : categoria;
  }

  cambiarMes(delta: number): void {
    const fecha = new Date(this.anio, this.mes + delta, 1);
    this.anio = fecha.getFullYear();
    this.mes = fecha.getMonth();
    this.seleccion = null;
  }

  irAHoy(): void {
    const hoy = new Date();
    this.anio = hoy.getFullYear();
    this.mes = hoy.getMonth();
    this.seleccion = null;
  }

  seleccionarDia(dia: number): void {
    if (!this.esEvento(dia)) return;
    this.seleccion = this.seleccion === dia ? null : dia;
  }

  async alternar(evento: EventoVista): Promise<void> {
    if (!this.usuarioId || evento.procesando) return;

    evento.procesando = true;
    this.error = '';
    this.mensaje = '';
    this.cdr.markForCheck();

    try {
      if (evento.inscrito) {
        await this.eventosService.cancelarInscripcion(evento.id, this.usuarioId);
        evento.inscrito = false;
        evento.inscritosTotales = Math.max(0, evento.inscritosTotales - 1);
        this.mensaje = `Cancelaste tu inscripción a ${evento.titulo}.`;
      } else {
        await this.eventosService.inscribirse(evento.id, this.usuarioId);
        evento.inscrito = true;
        evento.inscritosTotales += 1;
        this.mensaje = `Te inscribiste a ${evento.titulo}.`;
      }
    } catch (error) {
      this.error = this.mensajeError(error, evento.inscritosTotales >= evento.cupos
        ? 'Este evento ya no tiene cupos disponibles.'
        : 'No se pudo actualizar tu inscripción. Revisa que el SQL actualizado de eventos esté aplicado y vuelve a intentar.');
      await this.cargarEventos(false);
    } finally {
      evento.procesando = false;
      this.cdr.markForCheck();
    }
  }

  async crearEvento(): Promise<void> {
    if (!this.puedeCrearEventos) {
      this.mostrarFormulario = false;
      this.error = `Solo ${CORREO_ADMIN_EVENTOS} puede crear eventos.`;
      return;
    }
    if (!this.usuarioId || this.guardandoEvento) return;
    this.error = '';
    this.mensaje = '';

    const inicio = new Date(this.formulario.startsAt);
    const capacidad = Number(this.formulario.capacity);
    if (!this.formulario.startsAt || Number.isNaN(inicio.getTime()) || inicio <= new Date()) {
      this.error = 'Selecciona una fecha y hora futura para el evento.';
      return;
    }
    if (!Number.isInteger(capacidad) || capacidad < 1) {
      this.error = 'Los cupos deben ser un número entero mayor que cero.';
      return;
    }

    this.guardandoEvento = true;
    this.cdr.markForCheck();
    try {
      await this.eventosService.crear({
        title: this.formulario.title.trim(),
        description: this.formulario.description.trim() || null,
        starts_at: inicio.toISOString(),
        location: this.formulario.location.trim(),
        category: this.formulario.category.trim(),
        capacity: capacidad
      });
      this.formulario = this.formularioVacio();
      this.mostrarFormulario = false;
      this.mensaje = 'Evento creado. Se notificó a los usuarios y ya pueden inscribirse.';
      await this.cargarEventos(false);
    } catch (error) {
      this.error = this.mensajeError(error, 'No se pudo crear el evento. Verifica que ejecutaste el SQL actualizado de eventos.');
    } finally {
      this.guardandoEvento = false;
      this.cdr.markForCheck();
    }
  }

  private esDelDia(evento: EventoVista, dia: number): boolean {
    return evento.dia === dia
      && evento.fechaInicio.getMonth() === this.mes
      && evento.fechaInicio.getFullYear() === this.anio;
  }

  private formularioVacio() {
    return { title: '', description: '', startsAt: '', location: '', category: 'Bienestar', capacity: 30 };
  }

  private fechaHoraLocal(fecha: Date): string {
    const ajustada = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60_000);
    return ajustada.toISOString().slice(0, 16);
  }

  private mensajeError(error: unknown, alternativo: string): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const mensaje = String((error as { message: unknown }).message);
      if (mensaje.toLowerCase().includes('cupo')) return 'Este evento ya no tiene cupos disponibles.';
    }
    return alternativo;
  }

  private async cargarEventos(mostrarCarga = true): Promise<void> {
    if (!this.usuarioId) return;
    if (mostrarCarga) this.cargando = true;
    this.error = '';

    try {
      const registros = await this.eventosService.listar(this.usuarioId);
      this.eventos = registros.map((registro) => this.aVista(registro));
    } catch {
      this.error = 'No se pudieron cargar los eventos. Revisa que el SQL de eventos esté aplicado y vuelve a intentar.';
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  private aVista(registro: EventoRecord & { inscrito: boolean }): EventoVista {
    const fecha = new Date(registro.starts_at);
    const mes = new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(fecha).replace('.', '').toUpperCase();
    const hora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(fecha);

    return {
      id: registro.id,
      titulo: registro.title,
      dia: fecha.getDate(),
      mes,
      hora,
      fechaInicio: fecha,
      lugar: registro.location,
      categoria: registro.category,
      cupos: registro.capacity,
      inscritosTotales: registro.registered_count,
      inscrito: registro.inscrito,
      procesando: false
    };
  }
}
