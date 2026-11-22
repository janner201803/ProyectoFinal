import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ChatConversationRecord, ChatMessageRecord, ChatService } from '../../core/services/chat.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { Layout } from '../layout/layout';
import { Icono } from '../icono/icono';

interface Mensaje {
  id: string;
  texto: string;
  mio: boolean;
  hora: string;
}

interface Conversacion {
  id: string;
  otroUsuarioId: string;
  nombre: string;
  ultimo: string;
  hora: string;
  sinLeer: number;
  enLinea: boolean;
  mensajes: Mensaje[];
}

function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [Layout, Icono],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly chatService = inject(ChatService);
  private readonly notificacionesService = inject(NotificacionesService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private usuarioId = '';
  private onlineIds = new Set<string>();
  private dejarDeEscucharLista?: () => void;
  private dejarDeEscucharPresencia?: () => void;
  private dejarDeEscucharMensajes?: () => void;
  private routeSubscription?: Subscription;

  busqueda = '';
  seleccionada = '';
  correoContacto = '';
  mostrarNuevoChat = false;
  cargando = true;
  creandoChat = false;
  enviando = false;
  error = '';
  conversaciones: Conversacion[] = [];

  get visibles(): Conversacion[] {
    const texto = normalizar(this.busqueda);
    return this.conversaciones.filter((c) => !texto || normalizar(c.nombre).includes(texto));
  }

  get actual(): Conversacion | null {
    return this.conversaciones.find((c) => c.id === this.seleccionada) ?? null;
  }

  get invertidos(): Mensaje[] {
    return [...(this.actual?.mensajes ?? [])].reverse();
  }

  async ngOnInit(): Promise<void> {
    try {
      const usuario = await this.authService.obtenerUsuario();
      if (!usuario) {
        this.error = 'Inicia sesión para usar el chat.';
        this.cargando = false;
        return;
      }
      this.usuarioId = usuario.id;
      await this.actualizarConversaciones(false);
      this.dejarDeEscucharLista = this.chatService.escucharCambios(this.usuarioId, () => {
        void this.actualizarConversaciones(true);
      });
      this.dejarDeEscucharPresencia = this.chatService.escucharPresencia(this.usuarioId, (ids) => {
        this.onlineIds = new Set(ids);
        this.conversaciones = this.conversaciones.map((c) => ({ ...c, enLinea: this.onlineIds.has(c.otroUsuarioId) }));
        this.cdr.markForCheck();
      });
      this.routeSubscription = this.route.queryParamMap.subscribe((params) => this.seleccionarDesdeRuta(params));
      const targetId = this.route.snapshot.queryParamMap.get('conversation');
      const inicial = this.conversaciones.find((c) => c.id === targetId) ?? this.conversaciones[0];
      if (inicial && this.seleccionada !== inicial.id) await this.seleccionar(inicial);
    } catch {
      this.error = 'No se pudo cargar el chat. Verifica que ejecutaste el SQL de chat en Supabase.';
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.dejarDeEscucharLista?.();
    this.dejarDeEscucharPresencia?.();
    this.dejarDeEscucharMensajes?.();
    this.routeSubscription?.unsubscribe();
  }

  buscar(valor: string): void { this.busqueda = valor; }

  async seleccionar(conversacion: Conversacion): Promise<void> {
    this.seleccionada = conversacion.id;
    conversacion.sinLeer = 0;
    this.dejarDeEscucharMensajes?.();
    this.dejarDeEscucharMensajes = this.chatService.escucharMensajes(conversacion.id, () => {
      void this.cargarMensajes(conversacion.id, true);
    });
    await this.cargarMensajes(conversacion.id, true);
  }

  async iniciarContacto(correo: string): Promise<void> {
    const email = correo.trim();
    if (!email || this.creandoChat) return;
    this.creandoChat = true;
    this.error = '';
    try {
      const conversationId = await this.chatService.iniciarPorCorreo(email);
      await this.actualizarConversaciones(false);
      const conversacion = this.conversaciones.find((c) => c.id === conversationId);
      if (conversacion) await this.seleccionar(conversacion);
      this.correoContacto = '';
      this.mostrarNuevoChat = false;
    } catch (error) {
      this.error = this.mensajeError(error, 'No se pudo iniciar el chat. Verifica el correo del estudiante y el SQL de Supabase.');
    } finally {
      this.creandoChat = false;
      this.cdr.markForCheck();
    }
  }

  async enviar(caja: HTMLInputElement): Promise<void> {
    const conversacion = this.actual;
    const body = caja.value.trim();
    if (!conversacion || !body || this.enviando) return;
    this.enviando = true;
    this.error = '';
    try {
      await this.chatService.enviar(conversacion.id, this.usuarioId, body);
      caja.value = '';
      await this.cargarMensajes(conversacion.id, false);
      await this.actualizarConversaciones(true);
    } catch (error) {
      this.error = this.mensajeError(error, 'No se pudo enviar el mensaje. Vuelve a intentarlo.');
    } finally {
      this.enviando = false;
      this.cdr.markForCheck();
    }
  }

  private async actualizarConversaciones(seleccionaPrimera: boolean): Promise<void> {
    try {
      const records = await this.chatService.listarConversaciones();
      const anteriores = new Map(this.conversaciones.map((c) => [c.id, c]));
      this.conversaciones = records.map((record) => this.aConversacion(record, anteriores.get(record.conversation_id)));
      if (!this.conversaciones.some((c) => c.id === this.seleccionada)) {
        this.seleccionada = seleccionaPrimera ? (this.conversaciones[0]?.id ?? '') : this.seleccionada;
      }
      this.cdr.markForCheck();
      if (seleccionaPrimera && this.seleccionada) await this.cargarMensajes(this.seleccionada, true);
    } catch {
      this.error = 'No se pudo actualizar la lista de conversaciones.';
      this.cdr.markForCheck();
    }
  }

  private async cargarMensajes(conversationId: string, marcarLeida: boolean): Promise<void> {
    try {
      const records = await this.chatService.listarMensajes(conversationId);
      if (this.seleccionada !== conversationId) return;
      const conversacion = this.conversaciones.find((c) => c.id === conversationId);
      if (!conversacion) return;
      conversacion.mensajes = records.map((record) => this.aMensaje(record));
      if (records.length) {
        const ultimo = records[records.length - 1];
        conversacion.ultimo = ultimo.body;
        conversacion.hora = this.formatoLista(ultimo.created_at);
      }
      if (marcarLeida) {
        conversacion.sinLeer = 0;
        try {
          await this.chatService.marcarLeida(conversationId);
          await this.notificacionesService.marcarMensajesLeidos(conversationId, this.usuarioId);
        } catch {
          this.error = 'No se pudo actualizar el estado de lectura.';
        }
      }
      this.cdr.markForCheck();
    } catch {
      this.error = 'No se pudieron cargar los mensajes de esta conversación.';
      this.cdr.markForCheck();
    }
  }

  private aConversacion(record: ChatConversationRecord, anterior?: Conversacion): Conversacion {
    return {
      id: record.conversation_id,
      otroUsuarioId: record.other_user_id,
      nombre: record.other_name,
      ultimo: record.last_message || 'Iniciaste una conversación',
      hora: this.formatoLista(record.last_message_at),
      sinLeer: Number(record.unread_count) || 0,
      enLinea: this.onlineIds.has(record.other_user_id),
      mensajes: anterior?.mensajes ?? []
    };
  }

  private seleccionarDesdeRuta(params: ParamMap): void {
    const conversationId = params.get('conversation');
    if (!conversationId || conversationId === this.seleccionada) return;
    const conversation = this.conversaciones.find((item) => item.id === conversationId);
    if (conversation) void this.seleccionar(conversation);
  }

  private aMensaje(record: ChatMessageRecord): Mensaje {
    return {
      id: record.id,
      texto: record.body,
      mio: record.sender_id === this.usuarioId,
      hora: new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' }).format(new Date(record.created_at))
    };
  }

  private formatoLista(fecha: string): string {
    const date = new Date(fecha);
    const hoy = new Date();
    if (date.toDateString() === hoy.toDateString()) {
      return new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' }).format(date);
    }
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (date.toDateString() === ayer.toDateString()) return 'Ayer';
    if (Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(date);
    }
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit' }).format(date);
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = String((error as { message: unknown }).message);
      if (message.includes('No se encontró')) return 'No se encontró un estudiante con ese correo.';
      if (message.includes('ti mismo')) return 'No puedes iniciar una conversación contigo mismo.';
    }
    return fallback;
  }
}
