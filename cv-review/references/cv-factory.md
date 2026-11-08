# Formato final con cv-factory

[cv-factory](https://github.com/MeloDev2111/cv-factory) convierte un CV en datos (`source.json`, formato JSON Resume) en PDFs compatibles con ATS. Cuando toca, la revisión pasa el `cv_propuesto` a esos datos y genera el PDF. cv-factory no tiene modelo dentro: tú escribes los datos y lanzas su línea de comandos.

## Cuándo toca

Lo decide `generar.js` y queda en `cv-propuesto.json` → `listo_formato`. Para estar listo, el CV necesita:
- 70 puntos o más de contenido, sin contar los bloques de formato y extensión;
- ningún hallazgo crítico de contenido;
- ningún `[completar]` pendiente.

- **No listo**: no se genera nada. El informe dice qué falta. Si el formato está mal, dice también que no pierda tiempo maquetando a mano.
- **Listo en una revisión de seguimiento** (`seguimiento: true`): pregunta la plantilla y genera el PDF.
- **Listo en la primera revisión**: solo ofrécelo en la entrega; genéralo si el usuario lo pide.
- Si la persona da en el chat los datos que faltaban, ponlos en `cv_propuesto` (en `revision.json`), regenera el informe y vuelve a mirar `listo_formato`.

## Dónde está

- Repositorio: `<datos>/cv-factory/`, fijado en el commit `bc3336a`. No hagas `git pull` por tu cuenta. Si el usuario quiere actualizar, haz `pull` y después `npm test`.
- Si no está, ofrécele instalarlo y hazlo solo con su ok: `git clone https://github.com/MeloDev2111/cv-factory.git <datos>/cv-factory`, después `git checkout bc3336a` y `npm ci` dentro de esa carpeta.
- Requisitos: Node ≥ 22, `typst` en el PATH y las dependencias instaladas una vez. Si `node_modules` no existe, pídelo antes de seguir: `npm ci` (no `npm install`, que modifica `package-lock.json`).
- Los comandos se lanzan desde la raíz del repositorio, con `npm run dev -- <comando>`.
- Datos de la persona: `people/<slug>/` (el mismo `slug` de la revisión). Git ignora esa carpeta. Comprueba con `git status` que no aparece nada de ella. Nada de crear repositorios remotos, hacer push ni subir PDFs a ningún sitio.

## Preguntar (una vez, juntas)

1. **Plantilla**: `classic` (la recomendada: la más sobria y segura para el ATS), `modern` o `clean`. Las vistas previas están en `docs/img/preview-<plantilla>.png`: dale las rutas. `clean` agrupa varios cargos de la misma empresa.
2. **Idiomas**: por defecto, español (el principal) e inglés. El inglés sale de la base que cv-factory exige igualmente.

## Pasar `cv_propuesto` a `source.json`

La regla de cv-factory es que la **base va en inglés** y el español va en `x-cv-factory.i18n.es` de cada elemento:
- El español es el texto **exacto** de `cv_propuesto`: no lo reescribas.
- El inglés es una traducción fiel, sin adornar ni añadir datos.
- Ningún dato nuevo: lo que no esté en `cv_propuesto` no entra.

| `cv_propuesto` | `source.json` |
|---|---|
| `encabezado.nombre` · `titulo` | `basics.name` · `basics.label` (+ `i18n.es.label`) |
| `ciudad` | `basics.location`: `city` y `countryCode` (`PE`) |
| `telefono` · `correo` | `basics.phone` · `basics.email` (así `--public` puede ocultarlos) |
| `enlaces` | `basics.profiles[]` (`network`: LinkedIn, GitHub…; `username`; `url`). Un portafolio propio va a `basics.url` |
| `extra` | Según lo que contenga: la colegiatura o la habilitación va a `certificates[]` (`name` «Colegiatura CIP n.º …», `issuer` «Colegio de Ingenieros del Perú»); los enlaces van a `basics.profiles[]` |
| `perfil` | `basics.summary` (+ `i18n.es.summary`) |
| Experiencia → `entradas` | `work[]`: `organizacion`→`name`, `cargo`→`position`, `lugar`→`location`, `descripcion`→`description`, `vinetas`→`highlights` |
| Proyectos u Obras | `projects[]`: `cargo`/`titulo`→`name`, `descripcion`→`description`, `vinetas`→`highlights` |
| Educación | `education[]`: `organizacion`→`institution`; `cargo` se parte en `area` («Ingeniería Civil») y `studyType` («Bachiller») |
| Cursos y certificaciones | `certificates[]`: `name`, `issuer`, `date` (sepáralos del texto del ítem) |
| Habilidades → `grupos` | `skills[]`: `t`→`name` (+ `i18n.es.name`), `items`→`keywords` |
| Idiomas → `items` | `languages[]`: `language`, `fluency` (+ `i18n.es`) |
| Logros → `texto` | `awards[]`: `title`, `summary` |

- **Fechas**: `MM/AAAA` pasa a `AAAA-MM`. «Actualidad» deja `endDate` sin poner. Nunca inventes un mes.
- **Varios cargos o periodos en la misma empresa**: van como entradas `work[]` separadas, seguidas, con el mismo `name`. Una entrada con dos periodos («09/2024 – 06/2025 · 06/2023 – 09/2023») se parte en dos; las viñetas van en la primera.
- **El orden de las entradas** es el de `cv_propuesto`: cv-factory no las reordena.
- **Títulos de sección**: cv-factory pone los suyos («Perfil Profesional», «Experiencia», «Proyectos», «Certificaciones»…). No se pueden cambiar sin tocar la herramienta. «Obras» sale como «Proyectos»: avísalo.
- **Variante**: crea `variants/<puesto>.yaml` (por ejemplo `analista-sistemas`), con `lang: es`, la `template` elegida y `sections` en el mismo orden que `cv_propuesto`. No va contenido en la variante, salvo `basics.label` si el puesto lo pide. Formato: `docs/data-schema.md` del repositorio.

## Generar y comprobar

```
npm run dev -- validate --person <slug>
npm run dev -- compose <variante> --person <slug> --lang es     (0 avisos)
npm run dev -- compose <variante> --person <slug> --lang en     (0 avisos)
npm run dev -- render <variante> --person <slug> --lang es --no-date
npm run dev -- render <variante> --person <slug> --lang en --no-date
```

- Valida después de cada tanda de cambios, no solo al final.
- Comprueba cada PDF con tu propio lector: `py <skill>/scripts/leer.py cv "<pdf>" <carpeta temporal>`. Exige el texto en orden (cada fecha junto a su cargo), correo y celular encontrados, el mismo número de entradas que `cv_propuesto` y que entre en `extension_objetivo`. Las fechas alineadas a la derecha hacen que el lector marque «2 columnas»: es un falso positivo si el texto sale en orden. Si se pasa de hojas, recorta en `source.json` (o con `limits` en la variante) y avisa de qué quitaste.
- Mira una sola miniatura, la hoja 1.
- Copia los PDFs a `<salida>\cv-final\`: el español con `archivo_sugerido` y el inglés con el sufijo `-EN`. Ofrece una copia sin datos de contacto (`--public`) para compartir en comunidades.

## Revisiones siguientes

Una vez generado, `people/<slug>/source.json` es la fuente de verdad:
- La próxima revisión lee el PDF de `cv-final\`.
- Si propone cambios, se aplican a `source.json` en los dos idiomas y se vuelve a generar. No se rehace el archivo desde cero.
- No se cambian las plantillas, los esquemas ni el código de cv-factory para que encajen los datos.
