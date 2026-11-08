# CircuitLab

Plataforma web para modelar y simular circuitos digitales combinacionales y secuenciales.

## Desarrollo local

Requisitos:

- Node.js 18 o superior
- npm

Instala dependencias y arranca Vite:

```bash
npm install
npm run dev
```

## Compilación

```bash
npm run build
npm run preview
```

## Despliegue

El proyecto está preparado para Vercel mediante [vercel.json](./vercel.json). Desde la raíz:

```bash
vercel
```

Para producción:

```bash
vercel --prod
```

La especificación funcional del circuito del ascensor está en [componentes.md](./componentes.md).

## Arquitectura inicial del simulador

La especificación completa del producto está en [instrucciones.md](./instrucciones.md). La aplicación se está construyendo por fases:

- `src/domain/componentCatalog.js`: catálogo extensible con familia, encapsulado, tensión y nivel de simulación.
- `src/domain/electricalGraph.js`: grafo de nodos eléctricos, agrupación de conexiones y diagnósticos de cortocircuito.
- `src/App.jsx`: editor visual y experiencia de usuario.

Los niveles de simulación son:

- `complete`: comportamiento implementado dentro del alcance documentado.
- `partial`: comportamiento parcial y limitaciones conocidas.
- `visual`: colocación y conexión visual sin modelo funcional.
- `external`: requiere hardware o emulación externa.

Las siguientes fases incorporarán el motor digital, modelos TTL/CMOS, simulación analógica y temporal, emulación de placas, herramientas de depuración y gestión completa de proyectos. No se mostrarán como funcionales hasta que exista un modelo verificable.
