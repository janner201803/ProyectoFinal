Integrantes:
Janner Adrian Hoyos Espinosa 2240739
Melanie Parra Larrahondo 2240440

# UAO Vibe

Aplicación web para la comunidad estudiantil de la Universidad Autónoma de Occidente. Está construida con Angular y usa Supabase para autenticación, base de datos, almacenamiento de imágenes y actualizaciones en tiempo real.

## Funcionalidades

- Registro e inicio de sesión de estudiantes.
- Eventos con cupos e inscripción de estudiantes.
- Creación de eventos disponible para la cuenta administradora.
- Publicaciones de objetos perdidos o encontrados con imágenes.
- Notificaciones de eventos, objetos publicados y mensajes nuevos.
- Chat entre estudiantes en tiempo real.
- Perfil con correo y actividad del usuario.
- Mapa del campus y consulta de servicios.

La descripción del alcance, las tecnologías y las estructuras de datos está en el [Documento final](DOCUMENTO_FINAL.md).

## Requisitos

- Node.js compatible con Angular CLI 21 y npm.
- Un proyecto de Supabase configurado con las tablas, políticas RLS, funciones y bucket de almacenamiento que usa la aplicación.

## Configuración local

La aplicación está dentro de la carpeta `ProyectoFinal`.

```bash
cd ProyectoFinal
npm ci
```

Crea el archivo `.env` dentro de `ProyectoFinal`, usando como referencia `.env.example`:

```env
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_KEY=TU_CLAVE_PUBLICABLE_DE_SUPABASE
```

Luego inicia la aplicación:

```bash
npm start
```

Abre `http://localhost:4200`. El comando de inicio genera `src/app/environments/environment.ts` a partir de las variables de entorno.

## Despliegue en Netlify

Conecta el repositorio de GitHub desde Netlify y configura estos valores:

| Ajuste | Valor |
| --- | --- |
| Base directory | `ProyectoFinal` |
| Build command | `npm run build` |
| Publish directory | `dist/ProyectoFinal/browser` |

En **Project configuration → Environment variables**, crea estas variables y habilita su alcance para **Builds**:

| Variable | Valor |
| --- | --- |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_KEY` | Clave publicable (publishable/anon) de Supabase |

Guarda las variables y lanza un nuevo deploy. Netlify ejecutará `npm run build`, que corre `scripts/generate-env.mjs` y después `ng build`. El resultado que se debe publicar es `ProyectoFinal/dist/ProyectoFinal/browser` desde la raíz del repositorio, equivalente a `dist/ProyectoFinal/browser` si la base es `ProyectoFinal`.

Netlify no carga automáticamente el archivo `.env` del computador. Por eso las dos variables deben configurarse en Netlify. El archivo `.env` está excluido por `.gitignore` y no debe subirse al repositorio.

### Clave de Supabase en una aplicación web

El build de Angular incorpora `SUPABASE_KEY` en los archivos JavaScript del sitio para que el navegador se conecte a Supabase. Usa únicamente la clave publicable/anon y protege los datos con políticas RLS. Nunca uses aquí una clave `service_role` o una clave secreta del servidor: el navegador permite inspeccionar los valores que se empaquetan en el frontend.

### Rutas de Angular

Se incluye `public/_redirects` para que Netlify entregue la aplicación Angular al abrir o recargar rutas internas como `/eventos`, `/chat` o `/perfil`.

## Cuentas y permisos

- **Estudiantes:** se registran o inician sesión y pueden usar las funciones disponibles para la comunidad, como inscribirse a eventos, publicar objetos, consultar notificaciones y chatear.
- **Administrador de eventos:** la cuenta con correo `admin@uao.edu.co` puede crear eventos. Las demás cuentas no tienen habilitado ese permiso en la interfaz.

Credenciales de la cuenta administradora indicada para la demostración:

- Correo: `admin@uao.edu.co`
- Contraseña: `admin123@`

La cuenta debe existir en **Supabase Authentication** antes de iniciar sesión. Esta contraseña escrita en el README será visible para cualquier persona con acceso al repositorio; cámbiala antes de usar la cuenta en un entorno público o real. La restricción visual del frontend no reemplaza reglas de autorización en Supabase.

## Compilación manual

Desde `ProyectoFinal`, con las variables disponibles en `.env`:

```bash
npm run build
```

Angular genera la aplicación para publicar en `dist/ProyectoFinal/browser`.

## Enlaces de entrega

- **Repositorio GitHub:** [ProyectoFinal](https://github.com/janner201803/ProyectoFinal)
- **Propuesta gráfica Figma:** [Uao Vibe - Escritorio](https://www.figma.com/design/A9abcuzCdXNLnqwbCjVd4c/UAO-Vibe-%E2%80%94-Escritorio?node-id=5-714&t=EEx3TwMppKFhQyZe-1)
- **Aplicación desplegada en Netlify:** [uaovibe.netlify.app](https://uaovibe.netlify.app)
- **Documento final:** [DOCUMENTO_FINAL.md](DOCUMENTO_FINAL.md)
