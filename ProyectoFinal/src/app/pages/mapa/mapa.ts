import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CampusMapService, CampusRoute } from '../../core/services/campus-map.service';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './mapa.html',
  styleUrl: './mapa.css'
})
export class Mapa {
  private readonly campusMap = inject(CampusMapService);
  readonly lugares = this.campusMap.places;
  origen = 'porteria-1';
  destino = 'sotanos';
  ruta: CampusRoute | null = this.campusMap.findRoute(this.origen, this.destino);
  busquedaRealizada = true;

  get puntosRuta(): string {
    return this.ruta?.path.map(({ x, y }) => `${x},${y}`).join(' ') ?? '';
  }

  calcularRuta(): void {
    this.busquedaRealizada = true;
    this.ruta = this.campusMap.findRoute(this.origen, this.destino);
  }
}
