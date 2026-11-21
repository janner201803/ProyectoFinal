import { Component } from '@angular/core';
import { Layout } from '../layout/layout';
import { Icono } from '../icono/icono';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [Layout, Icono],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css'
})
export class Eventos {

  filtro = '';

  anio = 2026;
  mes = 10;
  nombreMes = 'Noviembre 2026';
  semana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  eventos = [
    { titulo: 'Feria de Bienestar Universitario', dia: 15, mes: 'NOV', hora: '9:00 a.m.', lugar: 'Plazoleta Central', categoria: 'Bienestar', inscrito: false },
    { titulo: 'Muestra de Emprendimiento UAO', dia: 18, mes: 'NOV', hora: '2:00 p.m.', lugar: 'Auditorio Principal', categoria: 'Emprendimiento', inscrito: true },
    { titulo: 'Torneo Interfacultades de Fútbol', dia: 21, mes: 'NOV', hora: '8:00 a.m.', lugar: 'Canchas Deportivas', categoria: 'Deportes', inscrito: false },
    { titulo: 'Taller de Hoja de Vida', dia: 25, mes: 'NOV', hora: '10:00 a.m.', lugar: 'Sala de Conferencias', categoria: 'Emprendimiento', inscrito: false },
    { titulo: 'Jornada de Salud y Pausas Activas', dia: 27, mes: 'NOV', hora: '11:00 a.m.', lugar: 'Centro de Bienestar', categoria: 'Bienestar', inscrito: true }
  ];

  get categorias(): string[] {
    return [...new Set(this.eventos.map((evento) => evento.categoria))];
  }

  get visibles() {
    return this.eventos.filter((evento) => !this.filtro || evento.categoria === this.filtro);
  }

  get inscritos() {
    return this.eventos.filter((evento) => evento.inscrito);
  }

  get dias(): number[] {
    const primero = new Date(this.anio, this.mes, 1).getDay();
    const desfase = (primero + 6) % 7;
    const total = new Date(this.anio, this.mes + 1, 0).getDate();
    return [...Array<number>(desfase).fill(0), ...Array.from({ length: total }, (_, i) => i + 1)];
  }

  contar(categoria: string): number {
    return this.eventos.filter((evento) => evento.categoria === categoria).length;
  }

  esEvento(dia: number): boolean {
    return this.eventos.some((evento) => evento.dia === dia);
  }

  esHoy(dia: number): boolean {
    const hoy = new Date();
    return hoy.getFullYear() === this.anio && hoy.getMonth() === this.mes && hoy.getDate() === dia;
  }

  filtrar(categoria: string): void {
    this.filtro = this.filtro === categoria ? '' : categoria;
  }

  alternar(evento: { inscrito: boolean }): void {
    evento.inscrito = !evento.inscrito;
  }
}