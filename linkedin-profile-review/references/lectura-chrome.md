# Leer el perfil desde Chrome (sesión del usuario)

LinkedIn no muestra perfiles completos sin sesión y bloquea la lectura automática desde fuera, así que se lee en el Chrome real del usuario, con la extensión y a ritmo humano. No se usa Playwright contra LinkedIn: sus condiciones prohíben la automatización y detectan los navegadores controlados, y la cuenta en riesgo es la del usuario.

## Reglas de solo lectura

- Nunca hagas clic en **Conectar, Seguir, Mensaje, Me gusta, Recomendar, Guardar ni Editar**. Solo navegación por URL, scroll y lectura.
- Máximo ~12 páginas por perfil, una tras otra, esperando a que cada una cargue. Si aparece un captcha, un aviso de "actividad inusual" o el extractor devuelve `aviso`, **para** y avisa al usuario.
- Si el perfil es de otra persona, dile al usuario una vez que esa persona puede verlo en "Quién vio tu perfil" según su configuración de privacidad.

## Herramientas

Carga en **una** llamada con `ToolSearch`: `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__tabs_close_mcp`.

1. `tabs_context_mcp` y luego `tabs_create_mcp`: trabaja en una pestaña nueva y no toques las del usuario.
2. Si la página pide iniciar sesión, para y pide al usuario que inicie sesión en LinkedIn en Chrome.

## Recorrido (base = `https://www.linkedin.com/in/<id>`)

| Página | Ruta |
|---|---|
| Principal (cabecera, Acerca de, Destacados, resumen de secciones) | `/in/<id>/` |
| Contacto | `/in/<id>/overlay/contact-info/` |
| Experiencia | `/in/<id>/details/experience/` |
| Educación | `/in/<id>/details/education/` |
| Licencias | `/in/<id>/details/certifications/` |
| Proyectos | `/in/<id>/details/projects/` |
| Aptitudes | `/in/<id>/details/skills/` |
| Recomendaciones | `/in/<id>/details/recommendations/` |
| Actividad | `/in/<id>/recent-activity/all/` |

Solo si la página principal muestra que existen: `/details/featured/`, `/details/languages/` y `/details/volunteering-experiences/`. Una subpágina que redirige a la principal o queda vacía = **la sección no existe** (es un hallazgo).

## Cómo leer cada página

1. `navigate` a la ruta.
2. Ejecuta con `javascript_tool` el contenido de `<skill>/scripts/extractor.js`. Léelo una vez con `cat` y pégalo tal cual en cada página: la página nueva borra lo inyectado antes.
   - El extractor espera a que cargue la página y hace scroll para traer lo diferido.
   - Limpia duplicados, botones, la barra lateral y el pie.
   - Deja todo en `window.__perfil` y devuelve `longitud · primer tramo`.
3. **La herramienta corta cada respuesta hacia los 1 000 caracteres.** Lee el resto por tramos de 900: `window.__perfil.slice(900, 1800)`, `slice(1800, 2700)`… hasta cubrir la longitud. Si un tramo termina en `[TRUNCATED]`, pide tramos más cortos.
4. Para listas largas (actividad), resume en la página antes de leer: fecha, primera línea y métricas de cada publicación, no el texto entero.
5. Si el extractor devuelve vacío o sin sentido (LinkedIn cambió su estructura), cae a `get_page_text` en esa página y avísalo al entregar, para revisar el extractor.
6. La ventana de contacto no siempre se puede leer con JavaScript (comparte página con otras extensiones). En ese caso, una captura a escala 0,5 de esa ventana basta.
7. **Una sola captura** de la cabecera (`computer` → `screenshot`, arriba del todo en la principal). Con ella evalúas la foto, la portada, el marco Open to Work y la primera impresión.

## Foto y portada

La extensión bloquea las respuestas con URL firmadas, así que no se descargan con `curl`: se recortan de la pantalla.

1. En la principal, arriba del todo, el extractor devuelve `imagenes.foto`, `imagenes.portada` (`[x, y, ancho, alto]` en px CSS) y `vista` (`[ancho, alto]` de la ventana).
2. Convierte a coordenadas de captura. La captura informa su tamaño ("coordinate frame", por ejemplo 1568 × 744). Factor = ancho de la captura / ancho de la vista; multiplica cada valor por él.
3. `computer` → `zoom` con `region: [x0, y0, x1, y1]` y `save_to_disk: true`, **a escala 1**: a menor escala se guarda pequeña. Una vez para la portada y otra para la foto.
4. Copia los PNG guardados (la herramienta dice la ruta) a `<salida>/imagenes/portada.jpg` y `foto.jpg` con `ffmpeg -i <png> -q:v 3 <jpg>`.

En `evaluacion.json`, `cabecera.foto: "imagenes/foto.jpg"` y `cabecera.portada: "imagenes/portada.jpg"`.

- Sin `portada` = la **genérica de LinkedIn**: hallazgo, y la maqueta usa un degradado neutro (`portada: null`).
- Sin `foto`: la maqueta muestra las iniciales.

## `perfil.json`

Antes de evaluar, guarda en `<salida>/perfil.json` un objeto con `fecha`, `url`, `paginas` (ruta → secciones extraídas, tal cual) y `no_leido` (lo que falló y por qué). Es la prueba de qué se leyó y la base de la re-evaluación. Los textos "antes" de las reescrituras se copian **literales** de aquí. Al terminar, cierra la pestaña que abriste.
