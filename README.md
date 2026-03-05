# SCISE-Frontend

Frontend de SCISE construido con Astro.

## Estructura del proyecto

```text
/
|-- .astro/                         # Cache y archivos generados por Astro (no editar manualmente)
|-- .vscode/                        # Configuracion del editor (debug, extensiones recomendadas)
|-- dist/                           # Build de produccion generado por `npm run build`
|-- node_modules/                   # Dependencias instaladas por npm (no editar manualmente)
|-- public/                         # Archivos estaticos servidos tal cual (favicon, imagenes publicas)
|-- src/                            # Codigo fuente de la aplicacion
|   |-- assets/                     # Recursos visuales internos (svg, imagenes, iconos)
|   |-- components/                 # Componentes reutilizables de UI
|   |   `-- navigation/             # Componentes de navegacion compartida (sidebar, header)
|   |-- features/                   # Modulos funcionales por dominio
|   |   |-- auth/                   # Modulo de autenticacion
|   |   |   `-- views/              # Vistas .astro del modulo auth
|   |   |-- dashboard/              # Modulo de panel principal
|   |   |   `-- views/              # Vistas .astro del dashboard
|   |   |-- usuarios/               # Modulo de gestion de usuarios
|   |   |   `-- views/              # Vistas .astro de usuarios
|   |   |-- roles/                  # Modulo de gestion de roles
|   |   |   `-- views/              # Vistas .astro de roles
|   |   |-- permisos/               # Modulo de gestion de permisos
|   |   |   `-- views/              # Vistas .astro de permisos
|   |   |-- cursos/                 # Modulo de gestion de cursos
|   |   |   `-- views/              # Vistas .astro de cursos
|   |   |-- grupos/                 # Modulo de gestion de grupos
|   |   |   `-- views/              # Vistas .astro de grupos
|   |   |-- inscripciones/          # Modulo de inscripciones
|   |   |   `-- views/              # Vistas .astro de inscripciones
|   |   `-- reportes/               # Modulo de reportes
|   |       `-- views/              # Vistas .astro de reportes
|   |-- layouts/                    # Layouts globales y plantillas base de pagina
|   |-- pages/                      # Definicion de rutas de Astro (cada archivo = ruta)
|   |   |-- auth/                   # Rutas de autenticacion (ej: /auth/login)
|   |   |-- dashboard/              # Ruta del dashboard
|   |   |-- usuarios/               # Rutas del modulo usuarios
|   |   |-- roles/                  # Rutas del modulo roles
|   |   |-- permisos/               # Rutas del modulo permisos
|   |   |-- cursos/                 # Rutas del modulo cursos
|   |   |-- grupos/                 # Rutas del modulo grupos
|   |   |-- inscripciones/          # Rutas del modulo inscripciones
|   |   `-- reportes/               # Rutas del modulo reportes
|   `-- styles/                     # Estilos globales (ej: global.css)
|-- astro.config.mjs                # Configuracion principal de Astro
|-- package.json                    # Scripts y dependencias del proyecto
|-- package-lock.json               # Versiones exactas bloqueadas de dependencias
|-- tsconfig.json                   # Configuracion de TypeScript
`-- README.md                       # Documentacion del proyecto
```

## Comandos

Todos los comandos se ejecutan desde la raiz del proyecto:

| Comando | Descripcion |
| :--- | :--- |
| `npm install` | Instala dependencias |
| `npm run dev` | Inicia servidor local en `localhost:4321` |
| `npm run build` | Genera build de produccion en `dist/` |
| `npm run preview` | Previsualiza el build generado |

## Referencias

- Estructura de Astro: https://docs.astro.build/en/basics/project-structure/
