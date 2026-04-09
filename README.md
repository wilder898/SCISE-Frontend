# SCISE-Frontend

Frontend de SCISE construido con Astro para autenticacion, ingreso y salida de equipos, gestion de usuarios, reportes y configuracion.

## Modulos

- Login y logout
- Dashboard
- Ingreso
- Salida
- Gestion de usuarios y equipos
- Reportes
- Configuracion

Escaneo por camara habilitado en:

- ingreso
- salida
- modal de nuevo usuario
- modal de nuevo equipo

## Requisitos

- Node.js 20+ recomendado
- npm 10+ recomendado
- Backend SCISE corriendo, por defecto en `http://localhost:8000`

## Configuracion local

1. Copiar `.env.frontend.example` desde la raiz del proyecto o crear `.env` dentro de `SCISE-Frontend/`

Contenido esperado:

```env
PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

2. Instalar dependencias:

```bash
npm install
```

3. Levantar entorno local:

```bash
npm run dev
```

## Comandos

| Comando | Descripcion |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm run dev` | Levanta entorno local |
| `npm run build` | Genera build de produccion |
| `npm run preview` | Previsualiza el build |
| `npm run astro check` | Valida Astro y TypeScript |

## Stack y dependencias principales

- `astro`
- `typescript`
- `tailwindcss`
- `@tailwindcss/vite`
- `@zxing/browser` para lectura de codigo de barras por camara

## Rutas principales

| Ruta | Modulo |
| --- | --- |
| `/auth/login` | Login |
| `/dashboard` | Panel inicial |
| `/ingreso` | Registro de ingresos |
| `/salida` | Registro de salidas |
| `/usuarios` | Gestion de usuarios y equipos |
| `/reportes` | Historial y exportaciones |
| `/configuracion` | Configuracion de usuarios del sistema |

## Integracion API

Base URL consumida por frontend: `PUBLIC_API_BASE_URL`

### Auth

- `POST /auth/login`
- `POST /auth/logout`

### Ingreso

- `GET /estudiantes/by-documento/{identificador}`
- `GET /estudiantes/{estudiante_id}/equipos?solo_disponibles_ingreso=true`
- `POST /movimientos/ingresos`

### Salida

- `GET /estudiantes/by-documento/{identificador}`
- `GET /movimientos/activos/estudiante/{estudiante_id}`
- `POST /movimientos/salidas`

### Usuarios y Equipos

- `GET /estudiantes?skip=0&limit=500`
- `POST /estudiantes`
- `PATCH /estudiantes/{estudiante_id}`
- `PATCH /estudiantes/{estudiante_id}/estado`
- `GET /estudiantes/{estudiante_id}/equipos?solo_disponibles_ingreso=false`
- `GET /equipos?skip=0&limit=100`
- `GET /equipos?q={texto}&skip=0&limit=5`
- `POST /equipos`
- `PATCH /equipos/{equipo_id}`
- `DELETE /equipos/{equipo_id}`

### Dashboard y Reportes

- `GET /dashboard/resumen`
- `GET /dashboard/historial-reciente`
- `GET /reportes/movimientos/resumen`
- `GET /reportes/movimientos/historial`
- `GET /reportes/movimientos/export.csv`
- `GET /reportes/movimientos/export.xlsx`
- `GET /reportes/movimientos/export.pdf`

## Sesion en frontend

- Token: `localStorage["scise-auth-token"]`
- Datos de sesion: `localStorage["scise-session"]`
- En `401` se limpia la sesion y se redirige a `/auth/login`

## Camara y escaneo

- El escaneo usa `@zxing/browser` como fallback cuando `BarcodeDetector` no esta disponible.
- Para probar la camara:
  - usar `localhost` o un origen permitido por el navegador
  - conceder permisos de camara
  - verificar que el backend permita el origen via CORS
- Si una webcam no enfoca bien, el flujo permite:
  - cambiar de camara
  - capturar un frame y escanearlo

## Estructura del proyecto

```text
src/
  components/
    navigation/
    scanner/
  features/
    auth/
    configuracion/
    dashboard/
    ingreso/
    reportes/
    salida/
    usuarios/
  layouts/
  lib/
    scanner/
  pages/
    auth/
    configuracion/
    dashboard/
    ingreso/
    reportes/
    salida/
    usuarios/
  styles/
    configuracion/
    dashboard/
    gestion-usuarios/
    ingreso/
    panel-administracion/
    salida/
    shared/
```

## Notas operativas

- El frontend asume CORS habilitado en backend para el origen de desarrollo.
- Usar la misma base (`localhost` o `127.0.0.1`) en frontend y backend evita errores de sesion y CORS.
- El frontend depende de que el backend este levantado y respondiendo en la URL configurada en `PUBLIC_API_BASE_URL`.
