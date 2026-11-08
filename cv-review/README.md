# 📄 cv-review

**Revisa un CV de cualquier rubro y entrega un informe firme, listo para aplicar esa misma tarde.**

Una skill de [Claude Code](https://claude.com/claude-code) de la comunidad [Chamba Lab](https://github.com/Chamba-Lab).

## ✨ Qué obtienes

| Archivo | Qué es |
|---|---|
| `informe.pdf` e `informe.html` | Nota de 0 a 100, chequeo ATS automático (columnas, tablas, encabezado de Word, correo legible, hojas), «lo que ves tú y lo que lee el ATS», palabras clave frente a ofertas reales, reescrituras «antes → después», dónde postular, empresas, cursos y un plan de 2 a 4 semanas |
| `cv-propuesto.json` y `.md` | El contenido del CV corregido, con lo que falta marcado como `[completar: …]` |
| `cv-final/` (opcional) | Cuando el contenido está listo, el CV maquetado con [cv-factory](https://github.com/MeloDev2111/cv-factory) en español e inglés |

Nunca inventa logros, cifras ni fechas: lo que falte queda para completar.

## 🧩 Necesitas

- Claude Code
- Node.js 18 o superior y Playwright con Chromium, para exportar el PDF:
  ```bash
  npm i -g playwright
  npx playwright install chromium
  ```
- Python 3 con PyMuPDF, para leer el CV: `pip install pymupdf` (en Windows, `py -m pip install pymupdf`)
- Opcional, para el formato final: cv-factory (Node 22 o superior y `typst`). La skill te ofrece instalarlo cuando haga falta.

Instalación: mira el [README principal](../README.md#-instalar).

## 💬 Pídela así

```text
Revisa este CV: C:\Users\yo\Descargas\cv-maria.pdf. Busca trabajo de analista de datos junior en Lima.
```

```text
Mi amigo es ingeniero civil y quiere pasar a oficina técnica. Revisa su CV y dime qué le falta.
```

```text
Adapta mi CV a esta oferta: <pega la oferta>
```

La primera vez te pregunta en qué carpeta guardar las revisiones y lo recuerda en `local.json`.

## 🔒 Privacidad

El CV, los documentos y los informes quedan en tu equipo, en esa carpeta. Tienen datos personales: no los subas a repositorios ni servicios públicos sin permiso de la persona.

## 📄 Licencia

Código y documentación bajo [licencia MIT](LICENSE). Rakim y sus ilustraciones no: mira [NOTICE.md](NOTICE.md).
