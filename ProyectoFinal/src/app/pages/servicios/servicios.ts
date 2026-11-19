import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CAMPUS_SERVICES, CampusService, createServiceCatalog } from '../../core/data-structures/campus-data';
import { Icono } from '../inicio/inicio';

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
}

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [RouterLink, Icono],
  templateUrl: './servicios.html',
  styleUrl: './servicios.css'
})
export class Servicios implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  private readonly catalog = createServiceCatalog(CAMPUS_SERVICES);
  readonly categorias = this.catalog.categories.children;
  query = '';
  categoriaSeleccionada = '';
  resultados = this.catalog.list.toArray();
  correo = '';

  get iniciales(): string {
    return (this.correo.slice(0, 2) || 'U').toUpperCase();
  }

  async ngOnInit() {

    const usuario = await this.authService.obtenerUsuario();

    this.correo = usuario?.email ?? '';

  }

  buscar(query: string): void {
    this.query = query;
    this.actualizarResultados();
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada = this.categoriaSeleccionada === categoria ? '' : categoria;
    this.actualizarResultados();
  }

  async cerrarSesion() {

    try {

      await this.authService.logout();

      await this.router.navigate(['/login']);

    } catch (error) {

      console.error(error);

    }
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