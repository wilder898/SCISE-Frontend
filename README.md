# SCISE-Frontend

Frontend de SCISE construido con Astro para autenticacion, ingreso/salida de equipos, gestión de usuarios y consulta de reportes.

## Estado actual

- Login/logout conectados a backend real (`/auth/login`, `/auth/logout`).
- Modulo Ingreso conectado a API (buscar estudiante, cargar equipos, registrar ingresos).
- Modulo Salida conectado a API (buscar estudiante, consultar movimientos activos, registrar salidas).
- Modulo Usuarios conectado a API para CRUD operativo de estudiantes/equipos (sin mocks locales).
- Dashboard y Reportes conectados a endpoints de resumen, historial y exportaciones.

## Requisitos

- Node.js 20+ recomendado.
- npm 10+ recomendado.
- Backend SCISE corriendo (por defecto en `http://localhost:8000`).

## Configuracion local

1. Instalar dependencias:

```bash
npm install
```

2. Levanta entorno local de desarrollo  con:

```bash
npm run dev
```

## Comandos

| Comando | Descripcion |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm run dev` | Levanta entorno local de desarrollo |
| `npm run build` | Genera build de produccion |
| `npm run preview` | Previsualiza el build generado |


## Stack y dependencias principales

- `astro` `^5.17.1`
- `tailwindcss` `^4.2.1`
- `@tailwindcss/vite` `^4.2.1`
- `@zxing/browser` `^0.1.5` (scanner de codigos de barras/carnet)
- `typescript` `^5.9.3` (dev)
- `@astrojs/check` `^0.9.8` (dev)

## Rutas principales

| Ruta | Modulo |
| --- | --- |
| `/auth/login` | Login |
| `/dashboard` | Panel inicial |
| `/ingreso` | Registro de ingresos |
| `/salida` | Registro de salidas |
| `/usuarios` | Gestión de usuarios y equipos |
| `/reportes` | Historial y exportaciones |
| `/configuracion` | Configuracion de usuarios de sistema |

## Integracion API (contratos consumidos)

Base URL: `PUBLIC_API_BASE_URL`

### Auth

- `POST /auth/login`
- `POST /auth/logout`

### Ingreso

- `GET /estudiantes/by-documento/{identificador}` (documento o carnet)
- `GET /estudiantes/{estudiante_id}/equipos?solo_disponibles_ingreso=true`
- `POST /movimientos/ingresos`

### Salida

- `GET /estudiantes/by-documento/{identificador}` (documento o carnet)
- `GET /movimientos/activos/estudiante/{estudiante_id}`
- `POST /movimientos/salidas`

### Usuarios + Equipos

- `GET /estudiantes?skip=0&limit=500`
- `POST /estudiantes`
- `PATCH /estudiantes/{estudiante_id}`
- `PATCH /estudiantes/{estudiante_id}/estado`
- `GET /estudiantes/{estudiante_id}/equipos?solo_disponibles_ingreso=false`
- `GET /equipos?skip=0&limit=100`
- `GET /equipos?q={texto}&skip=0&limit=5`
- `POST /equipos`
- `PATCH /equipos/{equipo_id}` (incluye asociar equipo a estudiante)

### Dashboard y Reportes

- `GET /dashboard/resumen`
- `GET /dashboard/historial-reciente`
- `GET /reportes/movimientos/resumen`
- `GET /reportes/movimientos/historial`
- Exportacion: variantes `xlsx/csv/pdf` en `/reportes/movimientos/*`

## Sesión en frontend

- Token: `localStorage["scise-auth-token"]`
- Datos de Sesión: `localStorage["scise-session"]`
- En `401` se limpia Sesión y se redirige a `/auth/login`.

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
- Usar la misma base (`localhost` o `127.0.0.1`) en frontend/backend evita errores de Sesión y CORS.
- Para cambios de contrato API, actualizar primero este README y luego el modulo afectado.
