import { Component } from '@angular/core';
import { Layout } from '../layout/layout';
import { Icono } from '../icono/icono';

interface Mensaje {
  texto: string;
  mio: boolean;
  hora: string;
}

interface Conversacion {
  id: number;
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
export class Chat {

  busqueda = '';
  seleccionada = 1;

  conversaciones: Conversacion[] = [
    {
      id: 1,
      nombre: 'Laura M.',
      ultimo: 'Claro, nos vemos en la biblioteca.',
      hora: '10:42',
      sinLeer: 2,
      enLinea: true,
      mensajes: [
        { texto: 'Hola, vi que publicaste un morral negro.', mio: true, hora: '10:38' },
        { texto: 'Sí, lo encontré en la biblioteca, segundo piso.', mio: false, hora: '10:40' },
        { texto: '¡Creo que es mío! ¿Dónde lo puedo recoger?', mio: true, hora: '10:41' },
        { texto: 'Claro, nos vemos en la biblioteca.', mio: false, hora: '10:42' }
      ]
    },
    {
      id: 2,
      nombre: 'Carlos R.',
      ultimo: '¿Todavía ofreces las tutorías?',
      hora: '9:15',
      sinLeer: 0,
      enLinea: false,
      mensajes: [
        { texto: '¿Todavía ofreces las tutorías de cálculo?', mio: false, hora: '9:15' }
      ]
    },
    {
      id: 3,
      nombre: 'Andrea P.',
      ultimo: 'Gracias por avisarme del evento.',
      hora: 'Ayer',
      sinLeer: 0,
      enLinea: true,
      mensajes: [
        { texto: 'Te inscribí en la Feria de Bienestar.', mio: true, hora: 'Ayer' },
        { texto: 'Gracias por avisarme del evento.', mio: false, hora: 'Ayer' }
      ]
    },
    {
      id: 4,
      nombre: 'Juan S.',
      ultimo: 'Encontré tu calculadora.',
      hora: 'Lun',
      sinLeer: 1,
      enLinea: false,
      mensajes: [
        { texto: 'Encontré tu calculadora.', mio: false, hora: 'Lun' }
      ]
    }
  ];

  get visibles(): Conversacion[] {
    const texto = normalizar(this.busqueda);
    return this.conversaciones.filter((c) => !texto || normalizar(c.nombre).includes(texto));
  }

  get actual(): Conversacion {
    return this.conversaciones.find((c) => c.id === this.seleccionada) ?? this.conversaciones[0];
  }

  get invertidos(): Mensaje[] {
    return [...this.actual.mensajes].reverse();
  }

  buscar(valor: string): void {
    this.busqueda = valor;
  }

  seleccionar(conversacion: Conversacion): void {
    this.seleccionada = conversacion.id;
    conversacion.sinLeer = 0;
  }

  enviar(texto: string): void {
    const limpio = texto.trim();
    if (!limpio) {
      return;
    }
    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    this.actual.mensajes.push({ texto: limpio, mio: true, hora });
    this.actual.ultimo = limpio;
    this.actual.hora = hora;
  }
}