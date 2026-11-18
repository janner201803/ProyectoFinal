import { CategoryNode, LinkedList, Trie } from './structures';

export interface CampusService {
  name: string;
  category: string;
  location: string;
  description: string;
  keywords: string[];
}

export const CAMPUS_SERVICES: CampusService[] = [
  { name: 'Biblioteca', category: 'Académico', location: 'Edificio central', description: 'Préstamo de libros, salas de estudio y recursos digitales.', keywords: ['libros', 'estudio', 'investigación'] },
  { name: 'Bienestar Universitario', category: 'Bienestar', location: 'Centro de Bienestar', description: 'Acompañamiento psicológico, salud y actividades deportivas.', keywords: ['salud', 'psicología', 'deportes'] },
  { name: 'Cafetería Central', category: 'Alimentación', location: 'Plazoleta central', description: 'Opciones de alimentación y bebidas dentro del campus.', keywords: ['comida', 'almuerzo', 'café'] },
  { name: 'Registro Académico', category: 'Académico', location: 'Edificio administrativo', description: 'Certificados, matrícula y trámites académicos.', keywords: ['certificados', 'matrícula', 'notas'] },
  { name: 'Centro de Atención', category: 'Administrativo', location: 'Edificio administrativo', description: 'Orientación para solicitudes y servicios universitarios.', keywords: ['ayuda', 'solicitudes', 'información'] },
  { name: 'Laboratorios', category: 'Académico', location: 'Bloque de laboratorios', description: 'Espacios y equipos para prácticas y proyectos.', keywords: ['prácticas', 'equipos', 'tecnología'] }
];

export interface ServiceCatalog {
  list: LinkedList<CampusService>;
  categories: CategoryNode<CampusService>;
  trie: Trie;
}

export function createServiceCatalog(services: CampusService[]): ServiceCatalog {
  const list = new LinkedList<CampusService>();
  const categories = new CategoryNode<CampusService>('Servicios del campus');
  const categoryNodes = new Map<string, CategoryNode<CampusService>>();
  const trie = new Trie();

  for (const service of services) {
    list.append(service);
    let category = categoryNodes.get(service.category);
    if (!category) {
      category = categories.addChild(service.category);
      categoryNodes.set(service.category, category);
    }
    category.values.push(service);
    trie.insert(service.name);
    for (const keyword of service.keywords) trie.insert(keyword);
  }

  return { list, categories, trie };
}
