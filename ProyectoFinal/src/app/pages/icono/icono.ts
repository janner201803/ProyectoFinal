import { Component, Input } from '@angular/core';

const ICONOS: Record<string, string[]> = {
  inicio: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5', 'M10 21v-6h4v6'],
  servicios: ['M3 7h18v13H3z', 'M8 7V4h8v3', 'M3 13h18'],
  buscar: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'm21 21-4.3-4.3'],
  calendario: ['M3 5h18v16H3z', 'M3 10h18', 'M8 3v4', 'M16 3v4'],
  chat: ['M21 12a8 8 0 0 1-11.8 7L3 21l2-5.5A8 8 0 1 1 21 12z'],
  mapa: ['M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  perfil: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21a8 8 0 0 1 16 0'],
  salir: ['M9 21H4V3h5', 'M16 17l5-5-5-5', 'M21 12H9'],
  campana: ['M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z', 'M10 21h4'],
  reloj: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
  derecha: ['m9 6 6 6-6 6'],
  abajo: ['m6 9 6 6 6-6'],
  mensaje: ['M4 4h16v12H9l-5 4z']
};

@Component({
  selector: 'app-icono',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @for (d of trazos(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: `
    :host { display: inline-flex; width: 1em; height: 1em; }
    svg { width: 100%; height: 100%; }
  `
})
export class Icono {
  @Input() nombre = 'inicio';

  trazos(): string[] {
    return ICONOS[this.nombre] ?? [];
  }
}