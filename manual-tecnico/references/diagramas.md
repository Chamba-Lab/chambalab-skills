# Diagramas SVG

Para el **mecanismo** (orden, qué se re-renderiza, qué pasa en memoria); las imágenes son para la metáfora. Van en `<div class="diagrama">` del lado `.concepto` de un `split`, frente al código que los implementa. Usan `currentColor` = `--acento`. Texto y cajas sin `fill` toman el color del tema (claro u oscuro): no les pongas blanco fijo.

Reglas: reemplazan al párrafo, no lo acompañan · máximo 6 elementos · texto de 17 px o más · ámbar lo doloroso, marca (`currentColor`) lo correcto, gris (`#475569`) lo que no participa.

## Flujo horizontal

Para: pasos en orden, una petición atravesando capas, una transformación encadenada.

```html
<svg viewBox="0 0 680 150" style="width:100%;color:var(--acento)">
  <defs>
    <marker id="f" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
      <path d="M0,0 L9,4.5 L0,9 Z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="Inter,sans-serif" text-anchor="middle">
    <rect x="10"  y="42" width="170" height="66" rx="12"
          stroke="currentColor" stroke-opacity=".5"/>
    <text x="95"  y="80" font-size="21">Paso uno</text>

    <rect x="255" y="42" width="170" height="66" rx="12"
          stroke="currentColor" stroke-opacity=".5"/>
    <text x="340" y="80" font-size="21">Paso dos</text>

    <rect x="500" y="42" width="170" height="66" rx="12"
          stroke="currentColor" stroke-opacity=".5"/>
    <text x="585" y="80" font-size="21">Paso tres</text>

    <line x1="185" y1="75" x2="245" y2="75" stroke="currentColor"
          stroke-width="2" marker-end="url(#f)"/>
    <line x1="430" y1="75" x2="490" y2="75" stroke="currentColor"
          stroke-width="2" marker-end="url(#f)"/>
  </g>
</svg>
```

## Árbol de componentes

Para: jerarquías, propagación de re-render, prop drilling, scope de un contexto.

Nodos afectados en acento; no afectados en gris.

```html
<svg viewBox="0 0 560 300" style="width:100%;color:var(--acento)">
  <g font-family="Inter,sans-serif" text-anchor="middle" font-size="18">
    <!-- raíz: afectada -->
    <rect x="215" y="10" width="130" height="52" rx="10"
          stroke="currentColor"/>
    <text x="280" y="42">App</text>

    <!-- hijo afectado -->
    <rect x="70" y="124" width="130" height="52" rx="10"
          stroke="currentColor"/>
    <text x="135" y="156">Lista</text>

    <!-- hijo NO afectado: gris -->
    <rect x="360" y="124" width="130" height="52" rx="10"
          stroke="#475569"/>
    <text x="425" y="156" fill="#64748b">Barra</text>

    <rect x="70" y="238" width="130" height="52" rx="10"
          stroke="currentColor"/>
    <text x="135" y="270">Item</text>

    <g stroke="currentColor" stroke-width="2" fill="none">
      <path d="M280,62 L280,95 L135,95 L135,124"/>
      <path d="M135,176 L135,238"/>
    </g>
    <path d="M280,62 L280,95 L425,95 L425,124"
          stroke="#475569" stroke-width="2" fill="none"/>
  </g>
</svg>
```

## Cola de operaciones

Para: batching, event loop, colas de actualización, procesamiento por lotes.

```html
<svg viewBox="0 0 660 190" style="width:100%;color:var(--acento)">
  <defs>
    <marker id="q" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
      <path d="M0,0 L9,4.5 L0,9 Z" fill="currentColor"/>
    </marker>
  </defs>
  <g font-family="JetBrains Mono,monospace" text-anchor="middle" font-size="17">
    <!-- lo que entra -->
    <rect x="10" y="20"  width="180" height="42" rx="9"
          stroke="currentColor" stroke-opacity=".45"/>
    <text x="100" y="47">entrada A</text>
    <rect x="10" y="72"  width="180" height="42" rx="9"
          stroke="currentColor" stroke-opacity=".45"/>
    <text x="100" y="99">entrada B</text>
    <rect x="10" y="124" width="180" height="42" rx="9"
          stroke="currentColor" stroke-opacity=".45"/>
    <text x="100" y="151">entrada C</text>

    <!-- el procesador -->
    <rect x="265" y="52" width="130" height="82" rx="12"
          stroke="currentColor" stroke-width="2"/>
    <text x="330" y="99" font-family="Inter,sans-serif">cola</text>

    <!-- lo que sale -->
    <rect x="470" y="72" width="180" height="42" rx="9"
          stroke="currentColor"/>
    <text x="560" y="99">resultado</text>

    <g stroke="currentColor" stroke-width="2" marker-end="url(#q)" opacity=".75">
      <line x1="195" y1="41"  x2="258" y2="80"/>
      <line x1="195" y1="93"  x2="258" y2="93"/>
      <line x1="195" y1="145" x2="258" y2="106"/>
    </g>
    <line x1="400" y1="93" x2="462" y2="93" stroke="currentColor"
          stroke-width="2" marker-end="url(#q)"/>
  </g>
</svg>
```

## Antes y después de una estructura

Para: mutación vs copia, inmutabilidad, referencias en memoria.

```html
<svg viewBox="0 0 640 210" style="width:100%;color:var(--marca)">
  <g font-family="JetBrains Mono,monospace" font-size="17" text-anchor="middle">
    <!-- mutación: misma caja, color ámbar -->
    <text x="150" y="26" fill="#f59e0b" font-family="Inter,sans-serif"
          font-size="19">Mutación</text>
    <rect x="55" y="48" width="190" height="124" rx="12"
          fill="rgba(245,158,11,.10)" stroke="#f59e0b"/>
    <text x="150" y="98" >ref #1</text>
    <text x="150" y="136" fill="#94a3b8">valor nuevo</text>
    <text x="150" y="196" fill="#f59e0b" font-family="Inter,sans-serif"
          font-size="16">misma referencia</text>

    <!-- copia: caja nueva, color verde -->
    <text x="490" y="26" fill="currentColor" font-family="Inter,sans-serif"
          font-size="19">Copia</text>
    <rect x="360" y="38" width="175" height="110" rx="12"
          stroke="#475569" stroke-dasharray="5 4"/>
    <text x="447" y="96" fill="#64748b">ref #1</text>
    <rect x="420" y="72" width="175" height="110" rx="12"
          fill="currentColor" fill-opacity=".12" stroke="currentColor"/>
    <text x="507" y="132">ref #2</text>
    <text x="490" y="202" fill="currentColor" font-family="Inter,sans-serif"
          font-size="16">referencia nueva</text>
  </g>
</svg>
```
