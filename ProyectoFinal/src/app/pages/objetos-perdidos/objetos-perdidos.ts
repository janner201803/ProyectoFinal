import { Component } from '@angular/core';
import { Layout } from '../layout/layout';
import { Icono } from '../icono/icono';

function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

@Component({
  selector: 'app-objetos-perdidos',
  standalone: true,
  imports: [Layout, Icono],
  templateUrl: './objetos-perdidos.html',
  styleUrl: './objetos-perdidos.css'
})
export class ObjetosPerdidos {

  busqueda = '';
  filtro = '';

  objetos = [
    { nombre: 'Morral negro', detalle: 'Encontrado en la biblioteca, segundo piso.', estado: 'Encontrado', lugar: 'Biblioteca', tiempo: 'Hace 2 horas', autor: 'Laura M.' },
    { nombre: 'Audífonos inalámbricos', detalle: 'Perdidos en el edificio C, cerca de los salones.', estado: 'Perdido', lugar: 'Edificio C', tiempo: 'Hace 1 día', autor: 'Carlos R.' },
    { nombre: 'Carné estudiantil', detalle: 'Encontrado en una mesa de la cafetería.', estado: 'Encontrado', lugar: 'Cafetería Central', tiempo: 'Hace 3 horas', autor: 'Andrea P.' },
    { nombre: 'Calculadora científica', detalle: 'Perdida después de una clase de cálculo.', estado: 'Perdido', lugar: 'Edificio de Ingenierías', tiempo: 'Hace 2 días', autor: 'Juan S.' },
    { nombre: 'Termo azul', detalle: 'Encontrado junto a las bancas de la plazoleta.', estado: 'Encontrado', lugar: 'Plazoleta central', tiempo: 'Hace 5 horas', autor: 'Valentina G.' },
    { nombre: 'Llaves con llavero rojo', detalle: 'Perdidas cerca del parqueadero.', estado: 'Perdido', lugar: 'Parqueadero', tiempo: 'Hace 3 días', autor: 'Mateo L.' }
  ];

  solicitudes = [
    { titulo: 'Audífonos inalámbricos', detalle: 'Solicitud de devolución', prioridad: 'Alta' },
    { titulo: 'Calculadora científica', detalle: 'Alguien dice haberla encontrado', prioridad: 'Media' },
    { titulo: 'Termo azul', detalle: 'Solicitud de reclamo', prioridad: 'Baja' }
  ];

  get visibles() {
    const texto = normalizar(this.busqueda);
    return this.objetos.filter((objeto) => {
      const coincideEstado = !this.filtro || objeto.estado === this.filtro;
      const coincideTexto = !texto || normalizar(`${objeto.nombre} ${objeto.lugar}`).includes(texto);
      return coincideEstado && coincideTexto;
    });
  }

  contar(estado: string): number {
    return this.objetos.filter((objeto) => objeto.estado === estado).length;
  }

  buscar(valor: string): void {
    this.busqueda = valor;
  }

  filtrar(estado: string): void {
    this.filtro = this.filtro === estado ? '' : estado;
  }
}