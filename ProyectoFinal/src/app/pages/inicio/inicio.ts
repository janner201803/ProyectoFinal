import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
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
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  correo = this.authService.correoActual;

  eventos = [
    {
      titulo: 'Feria de Bienestar Universitario',
      fecha: '15 de Noviembre, 2026 • 9:00 a.m.',
      lugar: 'Plazoleta Central',
      categoria: 'Bienestar'
    },
    {
      titulo: 'Muestra de Emprendimiento UAO',
      fecha: '18 de Noviembre, 2026 • 2:00 p.m.',
      lugar: 'Auditorio Principal',
      categoria: 'Emprendimiento'
    },
    {
      titulo: 'Torneo Interfacultades de Fútbol',
      fecha: '21 de Noviembre, 2026 • 8:00 a.m.',
      lugar: 'Canchas Deportivas',
      categoria: 'Deportes'
    }
  ];

  eventoActual = 0;

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

  private async cargarObjetos(): Promise<void> {
    try {
      const registros = await this.objetosService.listar();
      this.objetos = registros.slice(0, 3).map((registro) => this.aVista(registro));
    } catch {
      this.objetos = [];
    } finally {
      this.cargandoObjetos = false;
      this.cdr.markForCheck();
    }
  }

  private aVista(registro: ObjetoPerdidoRecord): ObjetoReciente {
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