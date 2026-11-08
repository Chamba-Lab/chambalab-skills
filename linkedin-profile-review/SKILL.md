---
name: linkedin-profile-review
description: Evalúa a fondo un perfil de LinkedIn (el del usuario o el de alguien que se lo pide) leyéndolo desde Chrome con la sesión del usuario, y entrega un informe firme en HTML y PDF con estilo Chamba Lab — nota de 0 a 100, semáforo por sección, maqueta del perfil con los errores marcados, qué está bien, qué está mal, reescrituras "antes → después" listas para copiar, qué agregar y qué quitar, aptitudes que faltan frente a ofertas reales, qué publicar, con quién conectar, qué empresas seguir y un plan de 30 días. Adapta el criterio al objetivo: buscar empleo, cambiar de trabajo o hacerse notar. Úsala cuando el usuario pase un link o un nombre de perfil de LinkedIn, pida revisar, evaluar, auditar, criticar, puntuar u optimizar un perfil, pregunte qué le falta o qué cambiar a su LinkedIn, o quiera feedback de titular, extracto, experiencia o aptitudes, aunque no diga "skill". Tiene un modo "revisión rápida" (lite, express) más barato, de máximo 4 hojas, para revisar perfiles de quienes lo piden.
---

# Evaluación de perfil de LinkedIn

Lees un perfil real y entregas un informe que la persona pueda aplicar esa misma tarde: cada error con su consecuencia y su arreglo ya escrito. Es la serie Chamba Lab: mismos criterios que los manuales 03 (CV ATS), 04 (LinkedIn), 05 (STAR), 06 (sin experiencia) y 09 (leer una oferta), y el mismo estilo visual.

**Reparto del trabajo**:
- Los scripts leen, arman y exportan. Tú solo analizas: juzgas, reescribes y buscas en el mercado.
- No escribas HTML a mano.
- No pegues páginas enteras de LinkedIn en el contexto.

`<skill>` = la carpeta de esta skill. `<datos>` = la carpeta de trabajo, guardada en `<skill>/local.json` (`{"datos": "<ruta>"}`). Si ese archivo no existe, pregunta una sola vez dónde guardar las evaluaciones (propón `Documentos/chambalab/linkedin` en la carpeta del usuario) y créalo. `local.json` no se versiona: es de cada instalación. Las evaluaciones tienen datos personales: `<datos>` debe quedar fuera de cualquier repositorio que se publique.

`<salida>` = `<datos>/reviews/<slug>/<AAAA-MM-DD>/`: una carpeta por perfil (`slug` = nombre-apellido en minúsculas, sin tildes) y dentro una por evaluación, para no pisar la anterior.

## Dos modos

- **Completa** (por defecto): los pasos 1-5 tal cual.
- **Revisión rápida** (`"modo": "lite"`): cuando el usuario diga "rápida", "lite", "express" o "revisión rápida". Es lo que el reclutador ve en los primeros 10 segundos, con los arreglos listos para copiar, en **máximo 4 hojas**: portada con nota y semáforo, maqueta, y cambios con la invitación a la evaluación completa. Mismos criterios y misma nota que la completa, para que sean comparables. Cambia esto en cada paso:
  - **Paso 1**: solo el objetivo y el puesto; mercado por defecto, Perú. Sin versión en inglés.
  - **Paso 2**: solo la página principal (`/in/<id>/`), más `/details/experience/` si la experiencia más reciente sale cortada. Una captura, y foto y portada recortadas igual que en la completa.
  - **Paso 3**: **una** búsqueda de 2-3 ofertas vigentes para sacar las palabras clave. Nada de empresas, cuentas, cursos ni comunidades.
  - **Paso 4**: lee `criterios.md` y, de `objetivos.md`, solo la sección del objetivo. No leas `estrategia.md`. El formato es `assets/ejemplo-lite.json`, no el completo. Se puntúan los 11 bloques con lo que muestra la principal. **Máximo 6 hallazgos, todos con `zona`**. Secciones: titular (3 opciones), Acerca de reescrito, solo la experiencia más reciente, y aptitudes (tabla de las 2-3 ofertas más top 5). Ubicación, Destacados y similares van como sección con solo su hallazgo: el script los junta en «Arreglos rápidos». Sin `estrategia`, `plan` ni `reevaluacion`.
  - **Carpeta**: `<salida>` termina en `<AAAA-MM-DD>-lite`, para no pisar una completa del mismo día.
  - **Paso 5**: igual. Si `generar.js` avisa de que pasa de 4 hojas, recorta los textos del JSON y regenera una vez.

## Tono: firme

- Di el error tal cual y su costo: "Tu titular no contiene ninguna palabra que un reclutador escriba; no apareces en la búsqueda de *Frontend React*". Nada de "podrías considerar quizá".
- Cero elogios de relleno. Un acierto solo se nombra si es concreto y explica por qué funciona.
- La nota no se infla para animar: usa las anclas de `references/criterios.md`. Un perfil promedio saca 45-60.
- Firme no es cruel: se critica el perfil, nunca a la persona. Cada crítica va con su solución.
- **Nunca inventes** logros, cifras, empresas, fechas ni tecnologías en las reescrituras. Lo que falte va como `[completar: cifra de usuarios]`. Un dato falso en LinkedIn se cae en la primera entrevista.

## Paso 1: tres preguntas (solo las que falten)

1. **Objetivo**: buscar empleo · cambiar de trabajo · hacerse notar. Cambia los pesos de la nota y la mitad de los consejos (`references/objetivos.md`). Si no lo dice, pregúntalo después de leer el perfil, con opciones informadas por lo que viste.
2. **Puesto objetivo** (y nivel: practicante, junior, semi senior, senior, líder). Si el perfil lo deja claro, propónlo en vez de preguntarlo en blanco.
3. **País o ciudad, y si acepta remoto.** Por defecto, Perú y hora de Lima.
4. **Perfil en inglés**: si la barra lateral muestra un segundo idioma o la persona apunta a remoto internacional, pide **el link de la versión en inglés** y léela igual que la principal. Sin link, esa versión va como "no evaluado".

Si el perfil es de otra persona, se asume que esa persona pidió la evaluación.

## Paso 2: leer el perfil desde Chrome

Sigue `references/lectura-chrome.md`:
- Ejecuta `scripts/extractor.js` en cada página del perfil con la extensión de Chrome. Devuelve un JSON compacto por página.
- Haz una sola captura de la cabecera para juzgar la foto y la portada.
- Descarga la foto y la portada en `<salida>/imagenes/`.
- Guarda lo leído en `<salida>/perfil.json`.

**Solo lectura**: no conectes, no sigas, no reacciones, no escribas, no edites nada.

- Con solo un nombre: búscalo en LinkedIn desde Chrome y confirma con el usuario cuál es el perfil antes de evaluarlo (puede haber homónimos).
- Si Chrome no responde tras 2 intentos, pide el PDF del perfil (Perfil → Más → Guardar en PDF) y capturas de la foto, la portada, los Destacados y la actividad. Lo que no se pueda ver va como "no evaluado".
- Si existe una evaluación anterior (`<datos>/reviews/<slug>/` con otra fecha), lee solo de su `evaluacion.json` las claves `bloques`, `fecha` y `persona`. Pon `"anterior": {"fecha": …, "total": …}` en la nueva y comenta la evolución.

## Paso 3: contrastar con el mercado

- **Ofertas reales**: busca de 5 a 8 ofertas vigentes del puesto objetivo en su mercado, en varias bolsas: Indeed (herramienta, si cubre el país), Bumeran, Computrabajo, Get on Board, LinkedIn Jobs y las páginas de empleo de las empresas. No te quedes en una sola fuente. Extrae las palabras que se repiten (tecnologías, títulos de puesto, requisitos): esa lista alimenta el titular, las aptitudes y la tabla de brecha. Cita las ofertas en `fuentes`.
- **Empresas a seguir**: entre 8 y 12 empresas reales que hoy contratan ese perfil en ese mercado, verificadas en la web, mezclando tamaños (grande local, consultora tech, startup, remota para LatAm). Comunidades, igual (Chamba Lab va siempre la primera: es nuestra comunidad y el script la añade solo). Nunca de memoria.
- **Cuentas para aprender**: de 4 a 6, **no solo de LinkedIn**: canales de YouTube, blogs, newsletters, podcasts o escuelas en línea de su stack y en su idioma (por ejemplo, DevTalles de Fernando Herrera para el ecosistema JavaScript en español). Verifica que sigan activas y di dónde está cada una.
- **Cursos**: de 3 a 5, solo para cerrar las brechas de la tabla de aptitudes o del siguiente nivel del puesto. Mezcla gratuitos (documentación oficial, freeCodeCamp, YouTube) y de pago (DevTalles, Udemy, Platzi u otros), con precio o modalidad verificados el día de la evaluación. Prioriza los que dejan un proyecto o una credencial que se pueda mostrar en el perfil.
- Lo volátil de LinkedIn (límites, funciones nuevas) solo se vuelve a verificar si un hallazgo depende de ello; los valores de referencia están en `criterios.md`.

## Paso 4: analizar y escribir `evaluacion.json`

Lee `references/criterios.md` y `references/objetivos.md`. Para la estrategia, `references/estrategia.md`. El formato es `assets/ejemplo-evaluacion.json`: léelo una vez y escribe `<salida>/evaluacion.json` de una sola vez, bien pensado.

- **`bloques`**: nota de 0 a 10 por bloque según las anclas. La nota total, el estado (bien, mejorable, falta) y los pesos por objetivo los calcula el script: no los escribas.
- **`secciones`**: una por bloque con algo que decir, en orden de impacto. Cada problema es un `hallazgo` (gravedad, por qué cuesta, arreglo) seguido de su `cambio` antes → después, listo para copiar. Si el hallazgo se ve en la cabecera o en el inicio del perfil, ponle una `zona` y el script lo marca en la maqueta.
- **Obligatorio**:
  - titular con 3 opciones (la recomendada marcada; el conteo sale solo)
  - "Acerca de" reescrito completo
  - cada experiencia con viñetas reescritas: Verbo + qué + herramienta + resultado
  - tabla de aptitudes frente a las ofertas y el top 5 ordenado
  - URL propuesta
  - `resumen.funciona` con aciertos concretos y `resumen.tres_cosas`
- **`estrategia`**: 5 ideas de publicación sacadas de su propio perfil, grupos de red con búsqueda lista, nota de invitación, empresas, comunidades, cuentas (con plataforma) y cursos verificados, más un `plan` de 4 semanas. Para redactar publicaciones concretas, remite a `linkedin-post-coach`; no la dupliques.

## Paso 5: generar, exportar y revisar

```
node <skill>/scripts/generar.js <salida>/evaluacion.json
node <skill>/scripts/exportar.js <salida>/informe.html
```

`generar.js`:
- calcula la nota y numera los hallazgos
- coloca los marcadores en la maqueta, con la foto y la portada si están en `imagenes/`
- copia las ilustraciones de Rakim y reparte el contenido en hojas A4

`exportar.js`:
- deja `informe.pdf`, con texto seleccionable y enlaces que funcionan
- avisa de las páginas que desbordan
- genera `contacto.png` en una carpeta temporal del sistema (imprime la ruta)

Abre **solo** `contacto.png`. Si algo falla, corrige el JSON (no el HTML) en una sola pasada, regenera y mira una vez más. No abras la foto ni las imágenes de Rakim desde disco.

## Entrega

Durante la ejecución, el usuario solo ve las preguntas del paso 1 (si faltan) y esta entrega. Los ajustes de reparto o de JSON se resuelven sin narrarlos. Si un script falla de verdad (por ejemplo, LinkedIn cambió su estructura y el extractor no lee), dilo en una línea y sigue con la alternativa documentada.

En el chat, pocas líneas:
- la ruta del PDF y del HTML
- la nota global con su veredicto en una frase
- los 3 cambios de mayor impacto
- lo que no se pudo evaluar y por qué

Ofrece redactar el primer post con `linkedin-post-coach`. No publiques el informe en ningún servicio: contiene datos personales y queda en local salvo que el usuario pida otra cosa.
