Frontend de SCISE construido con Astro.

## Estructura del proyecto

```text
/                                        # Raiz del proyecto
|-- public/                              # Archivos estaticos publicos (favicon, imagenes, etc.)
|-- src/                                 # Codigo fuente principal
|   |-- assets/                          # Recursos graficos internos
|   |   |-- astro.svg                    # Icono SVG de Astro
|   |   `-- background.svg               # Fondo SVG base
|   |-- components/                      # Componentes reutilizables de UI
|   |   `-- navigation/                  # Componentes de navegacion
|   |       |-- AppHeader.astro          # Encabezado de la aplicacion
|   |       |-- AppNavbar.astro          # Barra de navegacion lateral/principal
|   |       `-- AppSidebar.astro         # Sidebar de navegacion
|   |-- features/                        # Vistas agrupadas por modulo funcional
|   |   |-- auth/                        # Modulo de autenticacion
|   |   |   |-- LoginView.astro          # Vista principal de login
|   |   |   `-- views/                   # Carpeta reservada para vistas adicionales de auth
|   |   |-- dashboard/                   # Modulo de dashboard
|   |   |   `-- DashboardView.astro      # Vista de dashboard
|   |   |-- ingreso/                     # Modulo de ingreso
|   |   |   `-- IngresoView.astro        # Vista de ingreso
|   |   |-- reportes/                    # Modulo de reportes
|   |   |   `-- ReportesView.astro       # Vista de reportes
|   |   |-- salida/                      # Modulo de salida
|   |   |   `-- SalidaView.astro         # Vista de salida
|   |   `-- usuarios/                    # Modulo de usuarios
|   |       `-- UsuariosView.astro       # Vista de usuarios
|   |-- layouts/                         # Layouts compartidos de la app
|   |   |-- AppLayout.astro              # Layout del area interna con navegacion
|   |   |-- AuthLayout.astro             # Layout para pantallas de autenticacion
|   |   |-- BaseLayout.astro             # Estructura HTML base y metadatos
|   |   `-- Layout.astro                 # Layout general/simple
|   |-- pages/                           # Rutas de Astro (enrutamiento por archivos)
|   |   |-- auth/                        # Grupo de rutas de autenticacion
|   |   |   `-- login.astro              # Ruta /auth/login
|   |   |-- dashboard/                   # Grupo de rutas de dashboard
|   |   |   `-- index.astro              # Ruta /dashboard
|   |   |-- ingreso/                     # Grupo de rutas de ingreso
|   |   |   `-- index.astro              # Ruta /ingreso
|   |   |-- reportes/                    # Grupo de rutas de reportes
|   |   |   `-- index.astro              # Ruta /reportes
|   |   |-- salida/                      # Grupo de rutas de salida
|   |   |   `-- index.astro              # Ruta /salida
|   |   |-- usuarios/                    # Grupo de rutas de usuarios
|   |   |   `-- index.astro              # Ruta /usuarios
|   |   `-- index.astro                  # Ruta principal /
|   `-- styles/                          # Estilos globales
|       `-- global.css                   # Hoja de estilos global de la aplicacion
|-- astro.config.mjs                     # Configuracion de Astro
|-- package.json                         # Scripts y dependencias directas del proyecto
|-- package-lock.json                    # Versiones bloqueadas de dependencias
|-- tsconfig.json                        # Configuracion de TypeScript
`-- README.md                            # Documentacion del proyecto
```

## Conexiones entre archivos

- `src/pages/*` importa vistas de `src/features/*`.
- `src/pages/*` usa `AppLayout` o `AuthLayout` segun el contexto.
- `AppLayout` renderiza `AppNavbar` para la navegacion global.
- `BaseLayout` define la base comun para los layouts.

## Dependencias usadas hasta el momento

### Instaladas en `package.json`

| Dependencia | Version | Uso actual |
| :--- | :--- | :--- |
| `astro` | `^5.17.1` | Framework principal para rutas, layouts y componentes `.astro`. |

### Referenciadas en el codigo

| Dependencia | Donde se usa | Estado |
| :--- | :--- | :--- |
| `tailwindcss` | `src/styles/global.css` con `@import "tailwindcss";` | Referenciada en estilos, no declarada en `package.json`. |

## Comandos

| Comando | Descripcion |
| :--- | :--- |
| `npm install` | Instala dependencias |
| `npm run dev` | Levanta entorno local |
| `npm run build` | Genera build de produccion |
| `npm run preview` | Previsualiza el build |
>>>>>>> main

Prueba