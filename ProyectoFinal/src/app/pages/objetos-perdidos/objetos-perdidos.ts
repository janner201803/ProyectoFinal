import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { ObjetoPerdidoRecord, ObjetosPerdidosService } from '../../core/services/objetos-perdidos.service';
import { Layout } from '../layout/layout';
import { Icono } from '../icono/icono';

interface ObjetoPerdidoVista extends ObjetoPerdidoRecord {
  tiempo: string;
}

function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

@Component({
  selector: 'app-objetos-perdidos',
  standalone: true,
  imports: [Layout, Icono, FormsModule],
  templateUrl: './objetos-perdidos.html',
  styleUrl: './objetos-perdidos.css'
})
export class ObjetosPerdidos implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly objetosService = inject(ObjetosPerdidosService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly chatService = inject(ChatService);
  private userId = '';
  private userEmail = '';
  private irAlDestacado = false;
  private dejarDeEscuchar?: () => void;

  busqueda = '';
  filtro = '';
  objetos: ObjetoPerdidoVista[] = [];
  cargando = true;
  publicando = false;
  mostrarFormulario = false;
  error = '';
  mensaje = '';
  actualizandoId = '';
  contactandoId = '';
  destacadoId = '';
  imagenAmpliada: ObjetoPerdidoVista | null = null;
  imagen?: File;
  formulario: { title: string; description: string; status: 'Perdido' | 'Encontrado'; location: string } = {
    title: '', description: '', status: 'Perdido', location: ''
  };

  get visibles(): ObjetoPerdidoVista[] {
    const texto = normalizar(this.busqueda);
    return this.objetos.filter((objeto) => {
      const coincideEstado = !this.filtro || objeto.status === this.filtro;
      const coincideTexto = !texto || normalizar(`${objeto.title} ${objeto.location}`).includes(texto);
      return coincideEstado && coincideTexto;
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const user = await this.auth.obtenerUsuario();
      if (!user) {
        this.error = 'Inicia sesión para consultar y publicar objetos.';
        this.cargando = false;
        return;
      }
      this.userId = user.id;
      this.userEmail = user.email ?? '';
      this.destacadoId = this.route.snapshot.queryParamMap.get('id') ?? '';
      this.irAlDestacado = !!this.destacadoId;
      this.dejarDeEscuchar = this.objetosService.escuchar(() => { void this.cargar(); });
      await this.cargar();
    } catch {
      this.error = 'No se pudieron cargar las publicaciones. Revisa la conexión con Supabase.';
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.dejarDeEscuchar?.();
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    this.imagenAmpliada = null;
  }

  contar(estado: string): number {
    return this.objetos.filter((objeto) => objeto.status === estado).length;
  }

  buscar(valor: string): void { this.busqueda = valor; }
  filtrar(estado: string): void { this.filtro = this.filtro === estado ? '' : estado; }

  ampliar(objeto: ObjetoPerdidoVista): void {
    if (objeto.image_url) this.imagenAmpliada = objeto;
  }

  cerrarImagen(): void {
    this.imagenAmpliada = null;
  }

  esMio(objeto: ObjetoPerdidoVista): boolean {
    return !!this.userId && objeto.user_id === this.userId;
  }

  async marcarEncontrado(objeto: ObjetoPerdidoVista): Promise<void> {
    if (!this.esMio(objeto) || objeto.status !== 'Perdido' || this.actualizandoId) return;
    if (!confirm(`¿Marcar "${objeto.title}" como encontrado?`)) return;

    this.error = '';
    this.mensaje = '';
    this.actualizandoId = objeto.id;
    this.cdr.markForCheck();
    try {
      await this.objetosService.marcarComoEncontrado(objeto.id);
      this.mensaje = 'Listo, el objeto quedó marcado como encontrado.';
      await this.cargar();
    } catch {
      this.error = 'No se pudo actualizar el objeto. Verifica la política de actualización en Supabase.';
    } finally {
      this.actualizandoId = '';
      this.cdr.markForCheck();
    }
  }

  async contactar(objeto: ObjetoPerdidoVista): Promise<void> {
    if (!this.userId || this.esMio(objeto) || this.contactandoId) return;
    this.error = '';
    this.contactandoId = objeto.id;
    this.cdr.markForCheck();
    try {
      const conversacionId = await this.chatService.iniciarPorUsuario(objeto.user_id);
      const navego = await this.router.navigate(['/chat'], { queryParams: { conversation: conversacionId } });
      if (!navego) this.error = 'No se pudo abrir el chat. Intenta nuevamente.';
    } catch {
      this.error = 'No se pudo iniciar el chat. Verifica que ejecutaste la actualización SQL para contactar desde objetos perdidos.';
    } finally {
      this.contactandoId = '';
      this.cdr.markForCheck();
    }
  }

  seleccionarImagen(event: Event): void {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    this.imagen = archivo;
    this.error = '';
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (archivo && (!tiposPermitidos.includes(archivo.type) || archivo.size > 5 * 1024 * 1024)) {
      this.error = 'Usa una imagen JPG, PNG, WEBP o GIF de máximo 5 MB.';
      this.imagen = undefined;
      (event.target as HTMLInputElement).value = '';
    }
  }

  async publicar(): Promise<void> {
    if (!this.userId || !this.imagen || this.publicando) return;
    this.error = '';
    this.mensaje = '';
    this.publicando = true;
    this.cdr.markForCheck();
    try {
      const nombreAutor = (this.userEmail.split('@')[0] || 'Estudiante').replace(/[._-]/g, ' ');
      await this.objetosService.publicar({
        ...this.formulario,
        status: 'Perdido',
        title: this.formulario.title.trim(),
        description: this.formulario.description.trim(),
        location: this.formulario.location.trim(),
        author_name: nombreAutor,
        user_id: this.userId,
        image: this.imagen
      });
      this.formulario = { title: '', description: '', status: 'Perdido', location: '' };
      this.imagen = undefined;
      this.mostrarFormulario = false;
      this.mensaje = 'Objeto publicado. Se notificó a la comunidad.';
      await this.cargar();
    } catch (error) {
      this.error = this.errorDe(error);
    } finally {
      this.publicando = false;
      this.cdr.markForCheck();
    }
  }

  private async cargar(): Promise<void> {
    try {
      const records = await this.objetosService.listar();
      this.objetos = records.map((record) => ({ ...record, tiempo: this.tiempoTranscurrido(record.created_at) }));
      this.cargando = false;
      this.resaltar();
    } catch {
      this.error = 'No se pudieron cargar las publicaciones. Ejecuta el SQL de objetos perdidos en Supabase.';
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  private resaltar(): void {
    if (!this.irAlDestacado) return;
    this.irAlDestacado = false;
    this.busqueda = '';
    this.filtro = '';
    this.cdr.detectChanges();

    const id = this.destacadoId;
    const buscarTarjeta = (intentos = 0): void => {
      const el = document.getElementById(`objeto-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (intentos < 10) setTimeout(() => buscarTarjeta(intentos + 1), 100);
    };
    buscarTarjeta();

    setTimeout(() => {
      this.destacadoId = '';
      this.cdr.markForCheck();
    }, 1500);
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

  private errorDe(error: unknown): string {
    if (error instanceof Error && error.message.includes('5 MB')) return error.message;
    return 'No se pudo publicar el objeto. Verifica el SQL, el bucket de imágenes y vuelve a intentar.';
  }
}
