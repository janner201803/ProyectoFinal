import { Injectable } from '@angular/core';
import { Queue } from '../data-structures/structures';

export interface CampusPlace {
  id: string;
  name: string;
}

export interface CampusRoute {
  places: CampusPlace[];
  instructions: string[];
  path: MapPoint[];
}

export interface MapPoint {
  id: string;
  x: number;
  y: number;
}

const MAP_POINTS: Record<string, [number, number]> = {
  'porteria-1': [399, 669], 'porteria-2': [283, 117], 'porteria-3': [451, 235],
  'porteria-4': [293, 518], 'porteria-5': [500, 418], 'almacen': [295, 346],
  'sotanos': [399, 505], 'xepia': [335, 294], 'quincha': [380, 368],
  'yquinde': [425, 423], 'lile': [400, 563], 'biblioteca': [347, 610],
  'admisiones': [445, 610], 'recepcion': [400, 584], 'cafeteria': [430, 294],
  'plazoleta': [399, 478], 'casa': [480, 365], 'cruce-superior': [400, 258],
  'sendero-oeste': [320, 355], 'cruce-central': [400, 450], 'sendero-este': [485, 430],
  'sendero-inferior': [400, 640], 'lateral-arco': [425, 520]
};

interface Connection {
  to: string;
  instruction: string;
}

const PLACES: CampusPlace[] = [
  { id: 'porteria-1', name: '1 · Portería peatonal principal' },
  { id: 'porteria-2', name: '2 · Portería vehicular · Parqueadero #2' },
  { id: 'porteria-3', name: '3 · Portería peatonal' },
  { id: 'porteria-4', name: '4 · Portería vehicular · Parqueadero #4' },
  { id: 'porteria-5', name: '5 · Portería vehicular estudiantes · Parqueadero #5' },
  { id: 'almacen', name: '6 · Entrada a Almacén' },
  { id: 'sotanos', name: '7 · Entrada a sótanos · frente a la plazoleta' },
  { id: 'xepia', name: '8 · Auditorio Xepia · ala norte, segundo piso' },
  { id: 'quincha', name: '9 · Auditorio Quincha · ala sur, segundo piso' },
  { id: 'yquinde', name: '10 · Auditorio Yquinde · ala sur, primer piso' },
  { id: 'lile', name: '11 · Arco Central · Salón Lile, cuarto piso' },
  { id: 'biblioteca', name: '12 · Biblioteca · ala sur, primer piso' },
  { id: 'admisiones', name: '13 · Admisiones y Registro Académico · ala norte' },
  { id: 'recepcion', name: '14 · Recepción e información' },
  { id: 'cafeteria', name: '15 · Cafetería' },
  { id: 'plazoleta', name: '16 · Plazoleta Las Acacias · zona de referencia del Ágora' },
  { id: 'casa', name: '17 · CASA' },
  { id: 'cruce-superior', name: 'Cruce del acceso superior' },
  { id: 'sendero-oeste', name: 'Sendero junto al ala occidental' },
  { id: 'cruce-central', name: 'Cruce central de los senderos' },
  { id: 'sendero-este', name: 'Sendero junto al ala oriental' },
  { id: 'sendero-inferior', name: 'Sendero del acceso inferior' },
  { id: 'lateral-arco', name: 'Lateral del Arco Central hacia la plazoleta' }
];

const INTERNAL_WAYPOINTS = new Set([
  'cruce-superior', 'sendero-oeste', 'cruce-central', 'sendero-este', 'sendero-inferior', 'lateral-arco'
]);

/** The labeled campus map is modeled as a graph. Each edge carries directions. */
@Injectable({ providedIn: 'root' })
export class CampusMapService {
  readonly places = PLACES.filter(({ id }) => !INTERNAL_WAYPOINTS.has(id));
  private readonly graph = this.createGraph();

  findRoute(origin: string, destination: string): CampusRoute | null {
    if (!this.graph.has(origin) || !this.graph.has(destination)) return null;
    if (origin === destination) {
      return {
        places: [this.placeById(origin)],
        instructions: ['Ya estás en el lugar que seleccionaste.'],
        path: [this.pointById(origin)]
      };
    }

    const queue = new Queue<string>();
    const previous = new Map<string, { from: string | null; instruction: string }>([
      [origin, { from: null, instruction: '' }]
    ]);
    queue.enqueue(origin);

    while (!queue.isEmpty) {
      const current = queue.dequeue()!;
      if (current === destination) break;

      for (const connection of this.graph.get(current) ?? []) {
        if (previous.has(connection.to)) continue;
        previous.set(connection.to, { from: current, instruction: connection.instruction });
        queue.enqueue(connection.to);
      }
    }

    if (!previous.has(destination)) return null;

    const rawPath: string[] = [];
    let current: string | null = destination;
    while (current !== null) {
      rawPath.unshift(current);
      const step: { from: string | null; instruction: string } = previous.get(current)!;
      current = step.from;
    }
    const places = rawPath
      .filter((id) => !INTERNAL_WAYPOINTS.has(id))
      .map((id) => this.placeById(id));
    const instructions = places.slice(0, -1).map((place, index) =>
      this.instructionBetween(place.id, places[index + 1].id)
    );
    const path = rawPath.map((id) => this.pointById(id));
    return { places, instructions, path };
  }

  private instructionBetween(from: string, to: string): string {
    const key = `${from}>${to}`;
    const directions: Record<string, string> = {
      'porteria-1>lile': 'Desde la Portería peatonal principal (1), entra al campus y sigue el sendero principal hasta el Arco Central (11).',
      'lile>porteria-1': 'Desde el Arco Central (11), sigue el sendero principal hacia la Portería peatonal principal (1).',
      'lile>plazoleta': 'Desde el Arco Central (11), baja por uno de los laterales y continúa hacia la Plazoleta Las Acacias (16), en la zona del Ágora.',
      'plazoleta>lile': 'Desde la Plazoleta Las Acacias (16), toma el lateral de regreso al Arco Central (11).',
      'plazoleta>sotanos': 'Al llegar a la Plazoleta Las Acacias (16), cruza hacia la entrada que queda al frente: Entrada a sótanos (7).',
      'sotanos>plazoleta': 'Desde la Entrada a sótanos (7), cruza de regreso a la plazoleta que está justo enfrente.'
    };
    if (directions[key]) return directions[key];

    const fromPlace = this.placeById(from).name;
    const toPlace = this.placeById(to).name;
    return `Desde ${fromPlace}, sigue los senderos peatonales del plano hasta ${toPlace}, guiándote por los rótulos numerados.`;
  }

  private createGraph(): Map<string, Connection[]> {
    const graph = new Map(PLACES.map(({ id }) => [id, [] as Connection[]]));
    const connect = (from: string, to: string, forward: string, backward: string): void => {
      graph.get(from)!.push({ to, instruction: forward });
      graph.get(to)!.push({ to: from, instruction: backward });
    };

    connect('porteria-1', 'sendero-inferior',
      'Ingresa por la Portería peatonal principal (1) y sigue de frente por el sendero central hacia el Arco Central.',
      'Desde el sendero central, continúa hacia la salida por la Portería peatonal principal (1).');
    connect('porteria-2', 'cruce-superior',
      'Sal del Parqueadero #2 por la Portería 2 y avanza hasta el sendero superior.',
      'Sigue el sendero superior hacia el Parqueadero #2 y la Portería 2.');
    connect('porteria-3', 'cruce-superior',
      'Ingresa por la Portería peatonal (3) y continúa por el camino hasta el cruce superior.',
      'Desde el cruce superior sigue el camino hacia la Portería peatonal (3).');
    connect('porteria-4', 'sendero-este',
      'Ingresa por la Portería vehicular (4) y toma el sendero interior junto al parqueadero.',
      'Sigue el sendero junto al ala oriental hasta la Portería vehicular (4).');
    connect('porteria-5', 'sendero-inferior',
      'Ingresa por la Portería de estudiantes (5) y avanza desde el parqueadero hasta el sendero inferior.',
      'Sigue el sendero inferior hacia el Parqueadero #5 y la Portería de estudiantes (5).');

    connect('cruce-superior', 'xepia',
      'Desde el cruce superior dirígete al Auditorio Xepia, en el ala norte, segundo piso.',
      'Sal del Auditorio Xepia y sigue el corredor hacia el cruce superior.');
    connect('cruce-superior', 'admisiones',
      'En el ala norte, busca la Oficina de Admisiones y Registro Académico (13), en el primer piso.',
      'Desde Admisiones y Registro Académico vuelve por el corredor del ala norte al cruce superior.');
    connect('cruce-superior', 'casa',
      'Sigue el sendero desde el acceso superior hacia CASA (17), señalada en la zona verde.',
      'Desde CASA sigue el camino interior de regreso al acceso superior.');
    connect('cruce-superior', 'sendero-oeste',
      'Toma el sendero que bordea el lado izquierdo del conjunto de edificios.',
      'Continúa por el sendero occidental hacia las porterías de la parte superior.');
    connect('cruce-superior', 'sendero-este',
      'Cruza hacia el sendero del lado derecho, junto al campo deportivo.',
      'Desde el sendero oriental vuelve por el camino hacia el acceso superior.');

    connect('sendero-oeste', 'almacen',
      'Sigue el corredor del lado izquierdo hasta la Entrada a Almacén (6).',
      'Desde la Entrada a Almacén regresa al sendero junto al ala occidental.');
    connect('sendero-oeste', 'quincha',
      'Continúa por el lado izquierdo hasta el Auditorio Quincha (9), ala sur, segundo piso.',
      'Sal del Auditorio Quincha y sigue el corredor hacia el sendero occidental.');
    connect('sendero-oeste', 'biblioteca',
      'Bordea el ala occidental hacia la Biblioteca (12), ubicada en el ala sur, primer piso.',
      'Desde la Biblioteca sigue el corredor junto al ala occidental.');
    connect('sendero-oeste', 'cruce-central',
      'Sigue el sendero hacia el centro del campus hasta el cruce central.',
      'Desde el cruce central toma el camino que bordea el ala occidental.');

    connect('quincha', 'cruce-central',
      'Desde Quincha sigue el paso interior hacia el cruce central de los senderos.',
      'En el cruce central, toma el camino hacia el Auditorio Quincha.');
    connect('quincha', 'yquinde',
      'Sigue el corredor interior hasta el Auditorio Yquinde (10), ala sur, primer piso.',
      'Desde Yquinde continúa por el corredor hacia el Auditorio Quincha.');
    connect('yquinde', 'sendero-este',
      'Desde Yquinde, en el ala sur, toma el corredor que conduce al sendero del lado derecho.',
      'Desde el sendero oriental dirígete al Auditorio Yquinde, ala sur, primer piso.');

    connect('sendero-este', 'cafeteria',
      'Continúa por el sendero interior hacia la Cafetería (15).',
      'Desde la Cafetería sigue el camino que bordea el ala oriental.');
    connect('sendero-este', 'cruce-central',
      'Sigue el corredor junto al ala oriental hasta el cruce central.',
      'Desde el cruce central toma el sendero junto al ala oriental.');

    connect('cruce-central', 'lile',
      'Desde el cruce central sigue el sendero hasta el Arco Central, junto al Salón Lile (11).',
      'Desde el Arco Central vuelve por el sendero al cruce central.');
    connect('lile', 'lateral-arco',
      'Desde el Arco Central baja por uno de sus laterales, siguiendo el sendero hacia la plazoleta; no subas al Salón Lile.',
      'Desde el lateral sube por el costado hasta el Arco Central.' );
    connect('lateral-arco', 'plazoleta',
      'Continúa por el lateral como si fueras hacia el Ágora, hasta la Plazoleta Las Acacias (16).',
      'Desde la plazoleta toma el sendero lateral que regresa al Arco Central.');
    connect('plazoleta', 'sotanos',
      'Al llegar a la plazoleta, cruza hacia la entrada que queda al frente: Entrada a sótanos (7).',
      'Desde la Entrada a sótanos vuelve a la plazoleta que está justo enfrente.');
    connect('cruce-central', 'sendero-inferior',
      'Continúa por el sendero interior hacia la recepción y las salidas de la parte inferior del plano.',
      'Desde el acceso inferior sigue el camino hacia el cruce central.');
    connect('sendero-inferior', 'lile',
      'Sigue de frente por el sendero central hasta el Arco Central (11).',
      'Desde el Arco Central continúa por el sendero central hacia la Portería principal (1).');
    connect('cruce-central', 'biblioteca',
      'Toma el corredor hacia la Biblioteca (12), ala sur, primer piso.',
      'Desde la Biblioteca sigue el sendero interior hasta el cruce central.');
    connect('cruce-central', 'cafeteria',
      'Sigue el sendero interior hacia la Cafetería (15).',
      'Desde la Cafetería toma el sendero que vuelve al cruce central.');

    connect('sendero-inferior', 'recepcion',
      'Sigue el camino hasta Recepción e información (14), cerca del acceso inferior.',
      'Desde Recepción e información vuelve al sendero del acceso inferior.');
    connect('sendero-inferior', 'biblioteca',
      'Sigue el sendero inferior hacia la Biblioteca, en el ala sur, primer piso.',
      'Desde la Biblioteca continúa por el camino que lleva al acceso inferior.');

    return graph;
  }

  private placeById(id: string): CampusPlace {
    return PLACES.find((place) => place.id === id)!;
  }

  private pointById(id: string): MapPoint {
    const [x, y] = MAP_POINTS[id];
    return { id, x, y };
  }
}
