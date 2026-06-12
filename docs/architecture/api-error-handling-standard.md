# API Error Handling Standard

Fecha: 2026-06-11

## Respuesta JSON

Formato recomendado:

```json
{
  "error": "Human-readable message",
  "requestId": "optional-request-id"
}
```

## Status Codes

- `400`: input invalido.
- `401`: no autenticado.
- `403`: autenticado sin permisos o CSRF.
- `404`: recurso no encontrado o fuera de tenant.
- `409`: conflicto/unicidad.
- `422`: validacion semantica.
- `500`: error interno.

## Seguridad

- No devolver stack traces.
- No devolver SQL errors completos.
- No devolver tokens/passwords.
- Loggear con request id.

## Estado Actual

- Backend Express usa `errorHandler` central con `requestId`.
- Next API routes usan respuestas JSON por ruta.

## Pendiente

Crear helper comun para Next API en fase separada si se decide refactor controlado.

