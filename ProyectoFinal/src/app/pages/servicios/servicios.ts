import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CAMPUS_SERVICES, CampusService, createServiceCatalog } from '../../core/data-structures/campus-data';

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './servicios.html',
  styleUrl: './servicios.css'
})
export class Servicios {
  private readonly catalog = createServiceCatalog(CAMPUS_SERVICES);
  readonly categorias = this.catalog.categories.children;
  query = '';
  categoriaSeleccionada = '';
  resultados = this.catalog.list.toArray();

  buscar(query: string): void {
    this.query = query;
    this.actualizarResultados();
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada = this.categoriaSeleccionada === categoria ? '' : categoria;
    this.actualizarResultados();
  }

  private actualizarResultados(): void {
    const prefix = normalize(this.query);
    const matchedTerms = new Set(this.catalog.trie.search(prefix).map(normalize));
    this.resultados = this.catalog.list.toArray().filter((service) => {
      const matchesCategory = !this.categoriaSeleccionada || service.category === this.categoriaSeleccionada;
      const matchesQuery = !prefix || [service.name, ...service.keywords]
        .some((term) => matchedTerms.has(normalize(term)));
      return matchesCategory && matchesQuery;
    });
  }

  trackService(_index: number, service: CampusService): string {
    return service.name;
  }
}
