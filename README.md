# SCISE-Frontend

Frontend de SCISE construido con Astro para autenticación, ingreso/salida de equipos, gestión de usuarios y consulta de reportes.

## Modulos

- Login/logout.
- Módulo `Ingreso` conectado a API:
  - buscar estudiante por documento/carnet
  - cargar equipos asociados
  - registrar ingresos
- Módulo `Salida` conectado a API:
  - buscar estudiante por documento/carnet
  - consultar equipos con ingreso activo
  - registrar salidas
- Módulo `Usuarios` conectado a API para CRUD operativo de estudiantes/equipos, sin mocks locales.
- Dashboard y Reportes conectados a endpoints de resumen, historial y exportaciones.
- Escaneo por cámara habilitado para:
  - ingreso
  - salida
  - modal de nuevo usuario
  - modal de nuevo equipo

## Requisitos

- Node.js 20+ recomendado
- npm 10+ recomendado
- Backend SCISE corriendo, por defecto en `http://localhost:8000`

## Configuración local

1. Instalar dependencias:

```bash
npm install
```

2. Levantar entorno local de desarrollo:

```bash
npm run dev
```

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm run dev` | Levanta entorno local de desarrollo |
| `npm run build` | Genera build de producción |
| `npm run preview` | Previsualiza el build generado |
| `npm run astro check` | Valida Astro/TypeScript |

## Stack y dependencias principales

- `astro` `^5.17.1`
- `tailwindcss` `^4.2.1`
- `@tailwindcss/vite` `^4.2.1`
- `@zxing/browser` `^0.1.5` para lectura de código de barras por cámara
- `typescript` `^5.9.3` (dev)
- `@astrojs/check` `^0.9.8` (dev)

## Rutas principales

| Ruta | Módulo |
| --- | --- |
| `/auth/login` | Login |
| `/dashboard` | Panel inicial |
| `/ingreso` | Registro de ingresos |
| `/salida` | Registro de salidas |
| `/usuarios` | Gestión de usuarios y equipos |
| `/reportes` | Historial y exportaciones |
| `/configuracion` | Configuración de usuarios del sistema |

## Integración API

Base URL consumida por frontend: `PUBLIC_API_BASE_URL`

### Auth

- `POST /auth/login`
- `POST /auth/logout`

### Ingreso

- `GET /estudiantes/by-documento/{identificador}`  
  Nota: el frontend usa documento/carnet; backend resuelve documento o código de barras.
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
  Incluye actualización y asociación de equipo a estudiante.
- `DELETE /equipos/{equipo_id}`

### Dashboard y Reportes

- `GET /dashboard/resumen`
- `GET /dashboard/historial-reciente`
- `GET /reportes/movimientos/resumen`
- `GET /reportes/movimientos/historial`
- `GET /reportes/movimientos/export.csv`
- `GET /reportes/movimientos/export.xlsx`
- `GET /reportes/movimientos/export.pdf`

## Sesión en frontend

- Token: `localStorage["scise-auth-token"]`
- Datos de sesión: `localStorage["scise-session"]`
- En `401` se limpia la sesión y se redirige a `/auth/login`

## Cámara y escaneo

- El escaneo usa `@zxing/browser` como fallback cuando `BarcodeDetector` no está disponible.
- Para probar la cámara:
  - usar `localhost` o un origen permitido por el navegador
  - conceder permisos de cámara
  - verificar que el backend permita el origen vía CORS
- Si una webcam no enfoca bien, el flujo permite:
  - cambiar de cámara
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
- Usar la misma base (`localhost` o `127.0.0.1`) en frontend y backend evita errores de sesión y CORS.