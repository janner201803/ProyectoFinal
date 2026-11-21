# Estructuras de datos de Uau Vibe

En la rama `logica` se implementan dos funciones accesibles desde la página de inicio: búsqueda de servicios universitarios y cálculo de una ruta esquemática entre lugares del campus.

## Búsqueda de servicios

- **Lista enlazada (`LinkedList`)**: conserva el catálogo de servicios y permite recorrerlo para mostrar y filtrar resultados.
- **Árbol (`CategoryNode`)**: organiza los servicios por categoría (Académico, Bienestar, Alimentación y Administrativo), lo que alimenta los filtros de categoría.
- **Trie (`Trie`)**: guarda nombres y palabras clave para encontrar coincidencias por prefijo, incluyendo búsquedas sin distinguir mayúsculas ni tildes.

## Rutas del campus

- **Grafo (`CampusMapService`)**: representa como vértices las cinco porterías, las 17 ubicaciones rotuladas en el mapa general (auditorios, Biblioteca, Admisiones, Recepción, Cafetería, Plazoleta Las Acacias y CASA) y los cruces de senderos. Las conexiones del mapa son aristas con indicaciones textuales en ambos sentidos.
- **Cola (`Queue`)**: el recorrido BFS en anchura visita los vértices por niveles para devolver una ruta con el menor número de tramos y reconstruir las indicaciones paso a paso. La página permite calcular el recorrido desde distintos puntos hasta la Salida.

Los servicios y conexiones del campus son datos de demostración locales. No requieren cambios en Supabase. Las rutas son esquemáticas, basadas en el plano del campus compartido por el usuario; no representan instrucciones GPS ni distancias reales. El mapa oficial 360 de la UAO sigue disponible desde la página de rutas.
