# Documento final — UAO Vibe

## 1. Descripción y alcance

UAO Vibe es una aplicación web para la comunidad estudiantil de la Universidad Autónoma de Occidente. Reúne en una sola plataforma información y herramientas de uso cotidiano dentro del campus.

El alcance implementado incluye:

- Registro, inicio y cierre de sesión de usuarios mediante Supabase Auth.
- Área privada de estudiantes con navegación protegida.
- Catálogo de servicios universitarios con búsqueda por nombre y palabras clave, y filtros por categoría.
- Mapa del campus con selección de origen y destino, cálculo de ruta, dibujo del recorrido sobre el plano e indicaciones paso a paso. También ofrece un enlace al recorrido 360° de la UAO.
- Publicación y consulta de objetos perdidos o encontrados, con imágenes almacenadas en Supabase Storage y opción de contactar al autor por chat.
- Consulta y creación de eventos, inscripción con cupos y visualización de las inscripciones del usuario.
- Chat directo entre estudiantes, con mensajes, presencia y actualizaciones en tiempo real.
- Notificaciones de eventos, publicaciones y mensajes nuevos.
- Perfil con nombre, foto, correo y actividad/publicaciones del usuario.
- Vista de administrador de eventos asociada al correo `admin@uao.edu.co`.

El frontend se despliega en Netlify. Supabase proporciona autenticación, base de datos, almacenamiento de archivos y canales en tiempo real. La configuración de tablas, funciones SQL, políticas RLS y buckets se realiza en Supabase; las claves locales se guardan en `ProyectoFinal/.env` y no se deben subir al repositorio.

## 2. Tecnologías utilizadas

| Tecnología | Uso en el proyecto |
| --- | --- |
| Angular 21 | Aplicación web y componentes de interfaz. |
| TypeScript | Lógica de páginas, servicios y estructuras de datos. |
| Angular Router | Navegación entre páginas públicas y privadas. |
| Angular Forms | Formularios de acceso, registro, eventos y publicaciones. |
| Supabase Auth | Registro e inicio de sesión. |
| Supabase Database (PostgreSQL) | Persistencia de eventos, inscripciones, publicaciones, perfiles, notificaciones y chat. |
| Supabase Realtime | Actualizaciones de chat, eventos, objetos y notificaciones. |
| Supabase Storage | Imágenes de publicaciones y avatares. |
| Netlify | Publicación del frontend Angular. |

## 3. Organización de la aplicación

El código Angular se organiza dentro de `ProyectoFinal/src/app`:

- `pages/`: pantallas de acceso, inicio, servicios, mapa, eventos, objetos perdidos, chat y perfil.
- `core/services/`: acceso a Supabase y lógica compartida de autenticación, datos, chat, mapa, perfil, avatares y notificaciones.
- `core/guards/`: protección de rutas para usuarios autenticados y visitantes.
- `core/data-structures/`: implementaciones de estructuras de datos y catálogo de servicios.
- `app.routes.ts`: rutas de la aplicación. Inicio de sesión y registro usan `guestGuard`; las páginas internas usan `authGuard`.

Las páginas privadas comparten el componente de layout con navegación lateral, notificaciones, acceso al perfil y cierre de sesión.

## 4. Estructuras de datos implementadas

Las implementaciones se encuentran en `ProyectoFinal/src/app/core/data-structures/structures.ts`. El catálogo de servicios y el algoritmo de rutas las utilizan en funciones visibles de la aplicación.

### 4.1 Lista enlazada — `LinkedList<T>`

La lista enlazada conserva los servicios en el orden en que se incorporan al catálogo. Cada nodo apunta al siguiente; agregar al final es O(1) porque la estructura conserva una referencia a la cola. `toArray()` recorre la lista en O(n) para entregar los servicios a la interfaz.

**Por qué se utiliza:** permite almacenar el catálogo de forma secuencial con una implementación propia y mantener orden de inserción para presentar y filtrar servicios.

**Uso:** `createServiceCatalog()` crea la lista y `Servicios` la consulta para construir los resultados.

### 4.2 Cola FIFO — `Queue<T>`

La cola implementa `enqueue` y `dequeue` en orden FIFO. Se usa en la búsqueda en anchura (BFS) de rutas del campus: los lugares se exploran por niveles, desde el origen hacia vecinos cada vez más distantes.

**Por qué se utiliza:** BFS con cola permite hallar una ruta con el menor número de tramos en un grafo no ponderado. Las operaciones de encolar y desencolar son O(1).

**Uso:** `CampusMapService.findRoute()`.

### 4.3 Árbol de categorías — `CategoryNode<T>`

Cada nodo puede contener servicios y una colección de nodos hijos. El nodo raíz agrupa categorías y cada hijo agrupa los servicios de una categoría.

**Por qué se utiliza:** representa de forma jerárquica la clasificación del catálogo y permite generar los filtros de categoría desde los datos.

**Uso:** `createServiceCatalog()` organiza las categorías; la página `Servicios` presenta los filtros a partir de sus nodos hijos.

### 4.4 Trie — `Trie`

El trie inserta nombres de servicios y palabras clave carácter por carácter. `search(prefix)` localiza términos que comienzan por el texto escrito. Antes de insertar o buscar, normaliza minúsculas y elimina tildes.

**Por qué se utiliza:** permite sugerir coincidencias por prefijo y buscar tanto nombres como palabras relacionadas con un servicio. La búsqueda recorre los caracteres del prefijo y luego recoge los términos del subárbol correspondiente.

**Uso:** `Servicios.buscar()` consulta el trie y combina los resultados con el filtro por categoría.

### 4.5 Grafo de ubicaciones del campus

`CampusMapService` modela ubicaciones y senderos como un grafo de listas de adyacencia. Los vértices representan porterías, edificios, plazoletas y puntos intermedios; las aristas conectan tramos peatonales y guardan instrucciones asociadas. El servicio ejecuta BFS usando la cola para reconstruir el recorrido y proyectarlo sobre el mapa.

**Por qué se utiliza:** el campus tiene múltiples conexiones posibles entre ubicaciones. El grafo representa esos caminos y permite calcular rutas entre cualquier par conectado, incluyendo porterías como origen o destino. El recorrido se dibuja con puntos de mapa y se acompaña de instrucciones.

**Uso:** `CampusMapService.findRoute()` y la página `Mapa`.

### Relación con los requisitos de estructuras

| Grupo solicitado | Estructuras implementadas |
| --- | --- |
| Dos entre listas, pilas o colas | Lista enlazada y cola FIFO. |
| Dos entre árboles, tries o heaps | Árbol de categorías y trie. |
| Grafos | Grafo de senderos y ubicaciones del campus. |

## 5. Persistencia y datos

El cliente Supabase se configura desde las variables `SUPABASE_URL` y `SUPABASE_KEY`. Entre los recursos consultados por el frontend están:

- Tablas: `events`, `event_registrations`, `lost_items`, `profiles`, `notifications` y `chat_messages`.
- Funciones RPC del chat: `get_my_chat_conversations`, `start_direct_chat`, `start_direct_chat_with_user` y `mark_direct_chat_read`.
- Buckets de Storage: `lost-items-images` y `avatars`.
- Canales Realtime para cambios de eventos, publicaciones, notificaciones y chat.

La aplicación depende de que estos recursos existan y tengan políticas de acceso correctas en Supabase. Las políticas RLS deben limitar la lectura y escritura de acuerdo con el usuario autenticado y validar permisos en el backend. El control de interfaz para ocultar la creación de eventos a estudiantes no sustituye una política de autorización en la base de datos.

## 6. Despliegue

La guía de configuración local, variables y despliegue en Netlify se encuentra en el [README principal](README.md). El proyecto Angular está en `ProyectoFinal`; el comando de producción es `npm run build` y la carpeta de publicación es `dist/ProyectoFinal/browser` relativa a esa carpeta.

## 7. Equipo y enlaces de entrega

Los integrantes y enlaces de GitHub, propuesta gráfica Figma y frontend publicado se encuentran en el README principal. El enlace del diseño Figma debe completarse cuando el archivo final esté disponible.
