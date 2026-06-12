# XLSX Risk and Replacement Plan

Fecha: 2026-06-11

## Actualizacion 2026-06-12

`xlsx` fue eliminado del frontend.

La exportacion de paquetes del cliente en `frontend/app/client/dashboard/page.jsx` se migro a CSV generado con APIs nativas del navegador (`Blob`, `URL.createObjectURL`). Ya no hay import dinamico de `xlsx` ni dependencia directa en `frontend/package.json`.

Estado: riesgo cerrado.

## Estado Actual

Historicamente, `xlsx` estaba declarado como dependencia directa en `frontend/package.json`.

Riesgos reportados por `npm audit`:

- Prototype Pollution en SheetJS.
- ReDoS en SheetJS.
- Sin fix disponible en npm audit para la version instalada.

## Uso Detectado

Uso real encontrado:

- `frontend/app/client/dashboard/page.jsx`

Funcion:

- Exportacion client-side de paquetes del cliente.
- Import dinamico: `await import('xlsx')`.
- Escritura local: `XLSX.writeFile(...)`.

## Riesgo

Si se procesan archivos no confiables en servidor o cliente, un archivo XLSX malicioso podria provocar consumo excesivo o manipulacion de objetos.

## Medidas Temporales

- No aceptar archivos XLSX publicos hasta aislar parser.
- Limitar tamano maximo de archivo.
- Validar MIME y extension.
- Ejecutar parsing en worker/proceso aislado si se mantiene.
- Nunca parsear XLSX en endpoints autenticados sin control de tenant y rate limit.

## Alternativas

- Reemplazar por CSV para flujos operativos simples.
- Evaluar libreria mantenida con advisories resueltos.
- Delegar importacion a job aislado con sandbox y limites de recursos.

## Plan Recomendado

1. Mantener temporalmente solo como export client-side, sin procesar archivos no confiables.
2. Extraer la exportacion a un modulo unico `frontend/lib/exportPackages.ts` o equivalente.
3. Migrar exportacion a CSV si el negocio lo acepta.
4. Si se mantiene XLSX, evaluar libreria alternativa mantenida o servicio aislado de export.
5. Anadir tests para export con dataset pequeno y controlar tamano maximo de filas.

## Decision 2026-06-11

Riesgo aceptable temporalmente solo si se firma como excepcion:

- Uso actual limitado a export client-side.
- No se detecto import/parsing de archivos XLSX no confiables.
- No debe exponerse ningun endpoint de import XLSX hasta reemplazar o aislar parser.

Siguiente mejora tecnica: encapsular la exportacion en un modulo unico para facilitar sustitucion por CSV u otra libreria mantenida.
