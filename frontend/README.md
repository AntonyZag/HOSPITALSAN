# Frontend — Hospital San Gabriel

Angular 22 standalone, Signal Forms, Bootstrap 5, Bootstrap Icons y SweetAlert2.
Node compatible: `^22.22.3 || ^24.15.0 || >=26.0.0`.

Desde **frontend/**:

```powershell
npm ci
npm start
```

Abrir `http://localhost:4200`. FastAPI debe funcionar en el puerto 8000 y conectar
a SQL Server. La dirección está en `src/environments/environment.ts`.

El panel tiene Indicadores, Productos, Categorías, Entradas, Salidas, Historial
y Vencimientos. Categorías, áreas, lotes e indicadores se consultan en la API.
Después de preparar la demo, recargar el listado o actualizar el panel.

El login guarda una sesión local de demostración; **no autentica solicitudes del
backend**. Cerrar sesión elimina esa sesión. Las credenciales de demo se entregan
por separado y no se muestran en la pantalla.

## Comprobaciones

```powershell
npm run build
npm test -- --watch=false
```

Vitest y jsdom comprueban rutas/login, formularios y alertas. El build no inicia
servidores ni prepara la base. Prettier: comillas simples, 100 columnas y parser
Angular para HTML (`.prettierrc`). No hay script de ESLint.

Ver [preparación completa](../README.md) y [solución de errores](../docs/ENTREGA.md).
