---
name: manual-tecnico
description: Manuales visuales didácticos (12-18 diapositivas HTML → PDF, del concepto al detalle, más portada para LinkedIn) sobre un concepto de desarrollo — reactividad, estado, Zustand, contexto, router, asincronía, TanStack, Angular, backend, bases de datos, seguridad, DevOps. Fase 1 entrega el esquema y los prompts de imagen para ChatGPT con la mascota Rakim; fase 2 arma el manual con esas imágenes. Úsala cuando pidan un manual, una guía visual, diapositivas o material didáctico de un tema técnico, los prompts de imagen de un manual, o la portada o el índice de la serie.
---

# Manual técnico

**Un** concepto explicado de cero para quien lo aprende leyendo: de 12 a 18 diapositivas que van de qué es y para qué sirve a sus partes, tipos, actores, cómo funciona y qué se configura, con ejemplos reales en cada paso, y siempre con el dolor y la matriz de decisión. El código se verifica contra la doc oficial con la versión fijada, y el cierre manda a la documentación. Es una serie de Chamba Lab: cada tema lleva su color y su logo, y Rakim y la estructura le dan la familia.

`<skill>` = la carpeta de esta skill.

## Trato y contexto

- Pregunta solo si estás bloqueado: un tema que da para varios manuales o un pedido contradictorio. El público es junior-mid; el dolor y la extensión los decides tú. Cada decisión propia, en una línea, y sigue.
- Lee cada archivo de apoyo solo en el paso que lo pide. Investiga la página concreta de la doc, no guías enteras.
- **Nunca abras imágenes** (las del usuario, las de `assets/personaje/` ni los PNG o PDF exportados): lista la carpeta y nada más. La única excepción es `revision/contacto.png`. No releas lo que acabas de editar.
- **Ahorra contexto**: nunca leas `manual.html` entero (lleva todo el CSS); ubica con `grep -n` y lee solo ese tramo. Escribe `diapositivas.html` de una vez, bien pensado, para que la revisión no necesite rondas: cada ronda de captura cuesta más que escribir con cuidado. Corrige todo lo visto en `contacto.png` en una sola pasada y vuelve a mirarla una vez.

## Fase 1: esquema y prompts (un solo mensaje)

1. **Tema, recorrido y dolor.** Acota a un concepto y recórrelo como en `diseno.md`: qué es → partes → tipos → actores → cómo funciona → reglas → variantes, con ejemplos reales y con nombre en cada bloque. El dolor va después del concepto, no lo abre. Búscalo tú: un error concreto que el lector ya sufrió y que contenga la lección (tres `setCount(count + 1)` que dan +1 enseñan que el estado es una instantánea). En un tema fundacional, el dolor es el código de antes. Si el tema es enorme ("React"), propón 3 o 4 manuales y pregunta por cuál empezar.
2. **Verifica** con WebSearch/WebFetch contra la doc oficial actual; nunca escribas código de memoria. Fija la versión ("Zustand v5"). Si la API cambió hace poco, vale una diapositiva de "qué cambió". Lo que no puedas confirmar va fuera, o marcado `[verificar]` y avisado.
3. **Esquema y tema visual.** Lee `references/diseno.md`. Una línea con el tema (claro u oscuro, `--marca` y `--alterno`) y una tabla: nº · fase · layout · acento · visual (imagen / diagrama / nada).
4. **Prompts.** Lee `references/imagenes.md` y entrega de 6 a 9 con su nombre de archivo exacto. El usuario los pega en ChatGPT y guarda las imágenes él mismo.
5. Pide al usuario que cree la carpeta del manual con `imagenes/` dentro (por ejemplo `ZUSTAND/imagenes/`) y que te pase la ruta cuando estén las imágenes. Si el usuario quiere el manual ya, salta a la fase 2 sin imágenes.

## Fase 2: construir

6. **Imágenes y logo.** `ls -tr` en la carpeta que te dio. Si los nombres no coinciden con los pedidos, renómbralos por orden de llegada y di el mapeo en una línea para que lo confirme. Si falta alguna, sigue: el hueco se ve como un degradado del acento y el archivo se agrega después sin tocar el HTML. Trae el logo con `node <skill>/scripts/logo.js <tecnología> <carpeta>/imagenes [#color]`; si no está, sigue lo indicado en `diseno.md`.
7. **HTML.** El manual va en la carpeta padre de `imagenes/`. Mira los layouts con `sed -n '/<!-- DIAPOSITIVAS -->/,/<!-- \/DIAPOSITIVAS -->/p' <skill>/assets/plantilla.html`. Si hay diagramas, lee `references/diagramas.md`. Escribe **solo las diapositivas** (y el `<style>` de las diapositivas nuevas, si las hay) en `diapositivas.html` y ensambla con `node <skill>/scripts/armar.js <carpeta>/diapositivas.html --tema claro|oscuro --marca '#hex' --alterno '#hex'`, que genera `manual.html` y borra el fragmento. Nunca leas ni reescribas el CSS de la plantilla. En un `split` con llamada, el código cabe en ≤40 caracteres por línea (el carril de la llamada le quita ancho); la llamada va en `top` ≈ 30 × línea − 28 px. Ninguna imagen lleva texto encima.
8. **Portada de LinkedIn.** Copia `<skill>/assets/portada-linkedin.html` a la carpeta y edita `--acento` (la marca) y `--alterno`, la clase `tema-claro` si toca, el número de manual, la tecnología con versión, un título corto y el subtítulo.
9. **Revisa.** `node <skill>/scripts/revisar.js <carpeta>/manual.html` y abre **solo** `revision/contacto.png`; abre una `sNN.png` únicamente si algo se ve raro. Después de corregir, mira solo lo tocado. Repasa también:
   - versión en la portada
   - qué es, partes y tipos antes del código, con ejemplos reales
   - ninguna imagen tapada por texto
   - un dolor concreto
   - matriz con veredicto
   - el mismo dominio de ejemplo de principio a fin
   - bloques de ≤14 líneas y ≤60 caracteres
   - cierre con la doc oficial
   - ≤18 diapositivas
   - `revisar.js` también genera `revision/contacto-9x16.png` (ábrela igual que `contacto.png`) e informa de lo que se sale de la zona segura de 9:16. Corrígelo como indica `diseno.md` § Formato 9:16.
10. **Exporta tú**: `node <skill>/scripts/exportar.js` con `manual.html` y con `portada-linkedin.html`. Generan `manual.pdf` (ligero: una imagen por página, enlaces clicables, sin texto seleccionable), `slides-9x16/01.jpg…` (1080×1920) y `portada-linkedin.png`. `--pdf nombre.pdf` evita sobrescribir un PDF existente. Si falta Playwright, el script imprime los pasos manuales: pásaselos al usuario y no lo instales.
11. **Cierre.** Agrega una fila a `indice.md` en la raíz de la serie (la carpeta que contiene los manuales; créalo si no existe): nº, tema, tecnología con versión, fecha y ruta. Borra `revision/`. Entrega en pocas líneas dónde quedó todo, qué decidiste y una sola pregunta abierta. Sugiere 2 o 3 temas siguientes.

## Después

- **Cambios**: edita el `manual.html` existente; no lo regeneres.
- **Publicar**: el PDF funciona como carrusel de LinkedIn; usa `linkedin-post-coach` si está disponible. En TikTok e Instagram se suben las imágenes de `slides-9x16/` en una sola publicación, seleccionándolas en orden.
- **Contenido propio del usuario**: respétalo; solo ordénalo en el arco y dale formato.
