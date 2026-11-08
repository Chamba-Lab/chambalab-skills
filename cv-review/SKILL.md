---
name: cv-review
description: Revisa a fondo un CV (PDF o Word) de cualquier rubro, sea el del usuario o el de alguien que se lo pide, y entrega un informe firme en HTML y PDF con estilo Chamba Lab. Incluye nota de 0 a 100, chequeo ATS automático (columnas, tablas, encabezado de Word, correo legible, hojas), la vista «lo que ves tú y lo que lee el ATS» con los errores marcados, palabras clave frente a ofertas reales, reescrituras «antes → después», contraste con sus constancias y certificados, y un CV propuesto en JSON y Markdown. Cuando el contenido ya está listo (normalmente en una revisión de seguimiento), le da el formato final con cv-factory: el usuario elige la plantilla y sale un PDF compatible con ATS en español e inglés. También dice dónde postular (Indeed, Bumeran, Computrabajo, bolsas del rubro), qué empresas seguir, cursos, comunidades y qué hacer en LinkedIn. Úsala cuando el usuario pase un CV o currículum, pida revisarlo, evaluarlo, mejorarlo, adaptarlo a una oferta o pasarlo a formato ATS, pregunte qué le falta o qué poner de sus certificados, o quiera saber por qué no lo llaman, aunque no diga "skill". No maqueta el CV mientras el contenido no esté listo.
---

# Revisión de CV

Lees un CV real, lo contrastas con ofertas y con los documentos que lo respaldan, y entregas un informe que se aplica esa misma tarde. Cada error va con su consecuencia y su arreglo ya escrito, y al final sale el **contenido** del CV corregido. Es la serie Chamba Lab: mismos criterios que los manuales 03 (CV ATS), 05 (STAR), 06 (sin experiencia) y 09 (leer una oferta), y el mismo estilo visual que `linkedin-profile-review`.

**Reparto del trabajo**:
- Los scripts leen, arman y exportan. Tú analizas: juzgas, reescribes y buscas en el mercado.
- No escribas HTML a mano ni maquetes el CV a mano. El formato final lo pone cv-factory (paso 6), y solo cuando el contenido está listo.
- No pegues el CV ni los documentos enteros en el contexto: lee `cv-leido.json` y `documentos.json` por tramos.

`<skill>` = la carpeta de esta skill. `<datos>` = la carpeta de trabajo, guardada en `<skill>/local.json` (`{"datos": "<ruta>"}`). Si ese archivo no existe, pregunta una sola vez dónde guardar las revisiones (propón `Documentos/chambalab/cv` en la carpeta del usuario) y créalo. `local.json` no se versiona: es de cada instalación.
- `<salida>` = `<datos>/reviews/<slug>/<AAAA-MM-DD>/`: una carpeta por persona (`slug` = nombre-apellido en minúsculas y sin tildes) y una por revisión. Si ya existe la del día, añade `-v2`.
- `<datos>/documentos/<slug>/`: constancias y certificados de esa persona, para no pedirlos cada vez.

Las revisiones tienen datos personales: `<datos>` debe quedar fuera de cualquier repositorio que se publique.

## Tono: firme

- Di el error y su costo: «Tu CV está a dos columnas: el ATS mezcla tu perfil con tus cursos y no encuentra tu correo». Nada de «podrías considerar quizá».
- Cero elogios de relleno. Un acierto solo se nombra si es concreto y explica por qué funciona.
- La nota no se infla: usa las anclas de `references/criterios.md`. Un CV promedio saca 45-60.
- Se critica el CV, nunca a la persona. Cada crítica va con su solución.
- **Nunca inventes** logros, cifras, empresas, fechas, cargos ni herramientas. Lo que falte va como `[completar: monto de la obra]`. Un dato falso se cae en la entrevista o en la verificación de antecedentes.

## Paso 1: lo mínimo para empezar (pregunta solo lo que falte)

1. **El CV**: ruta del PDF o el .docx. Si hay los dos, usa el PDF para la vista y el .docx para el texto.
2. **Objetivo**: buscar empleo · cambiar de trabajo · sector público. Cambia los pesos (`criterios.md`, tabla final).
3. **Puesto objetivo y nivel**, y **ciudad y modalidad** (por defecto, Perú). Si el CV lo deja claro, propónlo en vez de preguntarlo en blanco.
4. **Rubro**: elige el archivo de `references/rubros/` (`desarrollo.md`, `ingenieria-civil.md`). Si no hay, sigue `rubros/otros.md`.
5. **Documentos de respaldo**: pídelos cuando hagan falta (`references/documentos.md`): sector público, rubros que acreditan experiencia con constancias, o huecos y fechas dudosas. Propón la carpeta `<datos>/documentos/<slug>/`. Si no los hay, sigue sin ellos y dilo en el informe.

Si el CV es de otra persona, se asume que esa persona pidió la revisión.

Si existe una revisión anterior de esa persona (`<datos>/reviews/<slug>/` con otra fecha), lee solo de su `revision.json` las claves `bloques` y `fecha`, pon `"anterior": {"fecha": …, "total": …}` y comenta la evolución. Si ya existe `<datos>/cv-factory/people/<slug>/source.json`, el CV ya pasó por cv-factory: revisa el PDF de `cv-final\` de la última revisión, y los cambios que propongas se aplicarán a ese `source.json` (`references/cv-factory.md`).

## Paso 2: leer el CV y los documentos

```
py <skill>/scripts/leer.py cv "<ruta del CV>" <salida>
py <skill>/scripts/leer.py docs "<carpeta de documentos>" <salida>     (si hay documentos)
```

- `cv-leido.json` trae el texto por página, en el orden en que lo lee un ATS. También trae las señales (columnas, tablas, cuadros de texto, encabezado de Word, imágenes, iconos, correos y correos partidos, teléfonos, DNI o datos de más, fuentes), la posición de cada sección y las miniaturas `imagenes/cv-pN.png`.
- Mira **una** miniatura (la hoja 1) con `Read` para confirmar el diseño. No abras más imágenes salvo que algo no cuadre.
- Si el texto sale vacío, es un escaneo: es un hallazgo crítico. Lee la miniatura y sigue con lo que se vea.
- Para los documentos, sigue `references/documentos.md`. **No copies DNI, sueldos ni firmas** a ningún archivo.

## Paso 3: contrastar con el mercado

Sigue `references/mercado.md` y el archivo del rubro:
- **De 5 a 8 ofertas vigentes** del puesto en su mercado, en varias fuentes: Indeed (herramienta si está), Bumeran, Computrabajo, LinkedIn Jobs y las del rubro (Get on Board, bolsa del CIP, Talento Perú). De ahí salen `palabras_clave` y la tabla del bloque 7. Cítalas en `fuentes`.
- **Portales con búsquedas listas**, de 6 a 10 **empresas** que hoy contratan ese perfil, de 2 a 4 **comunidades**, de 3 a 5 **cuentas** y de 3 a 5 **cursos** para las brechas, con el precio verificado el mismo día.
- Nada de memoria: si no se pudo verificar, no va o va marcado.

## Paso 4: analizar y escribir `revision.json`

Lee `references/criterios.md` y el archivo del rubro. Para el CV propuesto, `references/cv-propuesto.md`. El formato es `assets/ejemplo-revision.json`: léelo una vez y escribe `<salida>/revision.json` de una sola vez, bien pensado.

- **`bloques`**: nota de 0 a 10 en los 12 bloques. El total, el estado y los pesos los calcula el script.
- **`secciones`**: una por bloque con algo que decir, en orden de impacto. Cada problema es un `hallazgo` (gravedad, por qué cuesta, arreglo) seguido de su `cambio` antes → después. Si se ve en la hoja (encabezado, perfil, experiencia…), ponle `zona` y el script lo marca en la miniatura.
- **Obligatorio**:
  - un hallazgo de **formato** apoyado en el chequeo automático (o un «bien» explícito si pasa)
  - **extensión**: cuántas hojas tiene y cuántas debería tener, y qué recortar o qué completar para llegar
  - perfil reescrito
  - cada experiencia relevante con viñetas reescritas: verbo + qué + con qué + resultado
  - tabla de **palabras clave** frente a las ofertas
  - con documentos: tabla **«Tus pruebas»** (qué está documentado y no figura, qué no coincide) y el cálculo de experiencia, si sirve
  - **`cv_propuesto`** completo, ajustado a `extension_objetivo`
  - `resumen.funciona` con aciertos concretos y `resumen.tres_cosas`
- **`estrategia`**: `portales` (con `portales_intro` opcional), `adaptar`, `empresas`, `linkedin`, `comunidades`, `cuentas` y `cursos`. En `linkedin`, recomienda siempre alinear el perfil con el CV y remite a `linkedin-profile-review`. Después, un `plan` de 2 a 4 semanas y la fecha de `reevaluacion`.

## Paso 5: generar, exportar y revisar

```
node <skill>/scripts/generar.js <salida>/revision.json
node <skill>/scripts/exportar.js <salida>/informe.html
```

- `generar.js` calcula la nota, numera los hallazgos, marca la miniatura, añade el chequeo ATS, reparte en hojas A4 y escribe `cv-propuesto.json` y `cv-propuesto.md` (lista los `[completar: …]`).
- `exportar.js` deja `informe.pdf` (texto seleccionable, enlaces que funcionan), avisa de las páginas que desbordan y genera `contacto.png` en una carpeta temporal (imprime la ruta).

Abre **solo** `contacto.png`. Si algo falla, corrige el JSON (no el HTML) en una sola pasada, regenera y mira una vez más.

`generar.js` imprime también **«Listo para formato»** y lo guarda en `cv-propuesto.json` → `listo_formato`. Cuenta solo el contenido: el formato y la extensión los arregla cv-factory.

## Paso 6: formato final con cv-factory (solo si está listo)

Sigue `references/cv-factory.md`.
- **No listo**: no se maqueta nada. El informe ya dice qué falta.
- **Listo en una revisión de seguimiento**: pregunta la plantilla (`classic`, `modern` o `clean`) y si quiere también la versión en inglés (por defecto, sí). Pasa el contenido a `source.json`, genera los PDFs, compruébalos con `leer.py` y déjalos en `<salida>\cv-final\`.
- **Listo en la primera revisión**: no lo hagas por tu cuenta; ofrécelo en la entrega.

## Entrega

Durante la ejecución, el usuario solo ve las preguntas del paso 1 (si faltan) y esta entrega. En el chat, pocas líneas:
- la ruta del PDF del informe y la de `cv-propuesto.json` y `cv-propuesto.md`
- la nota global con su veredicto en una frase
- los 3 cambios de mayor impacto
- los datos que quedaron como `[completar]` y qué documentos faltaron
- lo que no se pudo evaluar y por qué
- si está listo para el formato final: si no lo está, qué falta para llegar en la próxima revisión; si se generó, la ruta de `cv-final\` y la plantilla usada

Si está listo y no se generó (primera revisión), ofrece darle el formato con cv-factory. Ofrece también revisar su LinkedIn con `linkedin-profile-review`. No publiques el informe ni el CV en ningún servicio: tienen datos personales y quedan en local salvo que el usuario pida otra cosa.
