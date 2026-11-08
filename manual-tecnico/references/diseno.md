# Diseño: arco, tema visual y marca

## Arco (12-18 diapositivas): del concepto al detalle

Se enseña como a alguien que nunca lo vio explicado: primero qué es, luego de qué está hecho, qué variantes hay, quién participa, cómo funciona y qué se configura. El código llega cuando el concepto ya se entiende. Cada bloque baja a ejemplos reales y con nombre (`.com` frente a `.pe`, Cloudflare frente a Namecheap), nunca genéricos. **Siempre**: portada, qué es, cómo funciona, dolor, matriz y cierre; el resto según el tema, en este orden. Aquí se aprende leyendo: no hay ejercicios.

| Bloque | Pregunta | Layout · acento | Contenido |
|---|---|---|---|
| Portada | — | `portada` · marca · imagen + logo | Título + subtítulo con la **transformación** + tecnología con versión |
| **Qué es** | ¿Qué es y para qué sirve? | `declaracion` · marca · imagen | Definición en una frase + el problema que resuelve, con la metáfora |
| Anatomía | ¿De qué partes está hecho? | `anatomia` · marca | Un ejemplo real partido en piezas, cada una con su nombre |
| Tipos | ¿Qué variantes existen? | `tipos` · alterno | 3-4 familias con ejemplos reales y cuánto se usa cada una (incluye las raras o con requisitos) |
| Actores | ¿Quién participa? | `hub` o `split` · imagen | Herramientas, proveedores o piezas del ecosistema y qué hace cada uno |
| **Cómo funciona** | ¿Qué pasa por dentro? | `split` + diagrama · marca | El mecanismo paso a paso; si son más de 3 pasos, en secuencia |
| Reglas | ¿Qué puedo configurar? | `codigo-anotado` / `split` | Setup imprescindible y las reglas o patrones, con una llamada por bloque |
| Variantes | ¿De qué formas se hace? | `comparacion` | Dos o tres formas que compiten, espejadas |
| **Dolor** | ¿Dónde se rompe? | `split codigo-viejo` · dolor | El error concreto que el lector ya sufrió, con un `.aviso` que lo nombre |
| **Matriz** | ¿Qué elijo? | `tabla` · neutro | 3 criterios × opciones + veredicto que decide ("Depende" no vale) |
| Cierre | ¿Dónde sigo? | `cierre` · marca | 3 ideas clave + 2-3 enlaces a la doc oficial + marca |

Si una herramienta tiene tantos bloques que pasa de 18, son dos manuales. Otros layouts: `mapa` (anuncia el recorrido), `comparacion` (`--izq`/`--der`) y `hub` (nodo central + 4 satélites).

**Recursos didácticos** (el PDF no admite clics; esto mantiene al lector pasando páginas):
- **Secuencia**: el mismo diagrama en 2-3 diapositivas seguidas; en cada una se enciende un paso más (lo que aún no ocurre, en gris `#475569`). Para "cómo funciona".
- **Pregunta → respuesta**: una `declaracion` sin lista con la pregunta ("¿Por qué no basta con la IP?") y la respuesta en la siguiente. Una o dos por manual.

**Diapositivas nuevas.** Si el tema pide algo que no existe (línea de tiempo, paso a paso, ciclo de vida…), diséñalo tú: un `<style>` al inicio del fragmento, con clases propias y solo las variables del tema (`--fuerte`, `--texto`, `--suave`, `--superficie`, `--borde`, `--acento`), sin colores fijos, para que funcione en claro y en oscuro. Si sirve para otros manuales, al entregar propón añadirlo a la plantilla.

## Tema visual (lo eliges tú por manual)

- **Paleta**: `--marca` sale del color de la tecnología (React: azul; `logo.js` imprime el oficial). Ajústalo si no funciona como acento: un oficial negro (Angular) o crema (TanStack) se cambia por el tono que la gente asocia a esa marca. `--alterno` es un segundo color que contraste con la marca, para el patrón B y las técnicas. Ninguno de los dos puede parecerse al ámbar del dolor ni al rojo del peligro: si la marca es naranja o roja, usa ese color solo en el logo y la portada, y elige otro `--marca`.
- **Claro u oscuro**: oscuro por defecto; claro si la identidad de la tecnología es clara o si la marca se lee mejor sobre blanco. En claro, oscurece `--marca` hasta que se lea como texto (React: `#087ea4`, como react.dev).
- **Fijos en todos los temas**, porque cargan significado: `acento-dolor` (ámbar) y `acento-peligro` (rojo, producción o datos). `acento-neutro` para mapa y tablas. Un patrón conserva su acento en todo el manual (en la tabla, `op-a` = marca, `op-b` = alterno).
- **Logo**: `node <skill>/scripts/logo.js <tecnología> <carpeta>/imagenes [#color]` lo deja en `imagenes/logo.svg`, que ya usan la portada y la de LinkedIn. Si no está en Simple Icons, descarga el SVG oficial (repo o press kit) con `curl`; si no hay, sin logo.
- El código siempre va en bloque oscuro, también en el tema claro; el del dolor, en bloque claro (`codigo-viejo`).

## Reglas de diapositiva

- Una idea por diapositiva; si hay un párrafo, sobra.
- Títulos en dos partes: `<h2><b>Parte fuerte:</b> continuación</h2>`.
- Código real y ejecutable, con un mismo dominio en todo el manual (nada de `foo`/`bar`). Máximo 14 líneas por bloque y 60 caracteres por línea: se lee en un teléfono.
- Una sola llamada con flecha por bloque, sobre la línea clave (`.anclaje.con-llamada` + `.llamada` con `top`).
- Clases de Prism: `language-js|jsx|ts|tsx|java|xml|bash|json|properties`.
- **Nunca texto encima de una imagen**: la imagen va completa y el texto al lado o debajo (`.pie-figura` bajo una `.figura`). Las etiquetas que la imagen necesite, en el pie o en la lista.

## Formato 9:16 (TikTok e Instagram)

No se recorta el 16:9: la misma diapositiva se recompone en columna con `assets/vertical.css`, a 1080×1920. El contenido queda entre y=220 e y=1401 reales, libre de la interfaz de TikTok, y el contador `3/14` se añade solo. El ajuste automático reduce primero el código y luego lo denso, hasta un 85 %.

Si `revisar.js` avisa de que algo se sale, o el texto queda muy pequeño:
- **Acorta el texto**: `<span class="solo-pdf">versión larga</span><span class="solo-vertical">versión corta</span>`, sin cambiar el sentido. Vale también para líneas de código: deja solo la parte clave.
- **Ajusta una diapositiva nueva**: sus reglas van en `<carpeta>/vertical.css`, que se carga solo.
- En el cierre, escribe los enlaces como `<a href>` para que funcionen en el PDF; en la imagen no son clicables.

## Marca de la serie

Chamba Lab · github.com/Chamba-Lab. Va en la portada (`Chamba Lab · <año>`, discreto), en el cierre junto a los enlaces y en el pie de la imagen de LinkedIn. Lo que hace reconocible la serie es Rakim, la tipografía, la estructura y esta firma; el color cambia con cada tema. Si el manual se apoya en material de otra persona, se cita en el cierre; su logo nunca va.
