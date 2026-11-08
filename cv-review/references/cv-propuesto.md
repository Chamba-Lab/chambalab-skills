# Contrato `cv-propuesto` v1: el CV que sale de la revisión

La revisión propone el **contenido** del CV. El diseño lo pone cv-factory cuando el contenido está listo (`cv-factory.md`). Por eso el CV propuesto va en un JSON estable y no en un .docx. `generar.js` escribe dos archivos en la carpeta de la revisión:

- `cv-propuesto.json`: lo que lee la skill de formato.
- `cv-propuesto.md`: el mismo contenido en texto plano, para leerlo o pegarlo.

## Reglas del contenido

- Orden ATS: encabezado → perfil → (habilidades y proyectos arriba si es junior) → experiencia → educación → cursos y certificaciones → idiomas.
- Títulos estándar en español: «Perfil», «Experiencia», «Proyectos» u «Obras», «Educación», «Cursos y certificaciones», «Habilidades», «Idiomas».
- Viñetas: verbo en pasado + qué + con qué + resultado. Las cifras que no se conozcan van como `[completar: …]`; el script las lista en `pendientes`.
- **Nada inventado**: cada dato sale del CV original, de los documentos o de lo que dijo la persona.
- Sin datos personales de más (DNI, fecha de nacimiento, estado civil, dirección).
- `extension_objetivo` dice cuántas hojas debe ocupar al formatearlo («1 hoja», «máximo 2 hojas»). Ajusta el contenido a eso.

## Esquema (dentro de `revision.json`, clave `cv_propuesto`)

```json
{
  "archivo_sugerido": "CV-Nombre-Apellido-Puesto.pdf",
  "extension_objetivo": "1 hoja",
  "encabezado": {
    "nombre": "…", "titulo": "Puesto objetivo con las palabras de la oferta",
    "ciudad": "Lima, Perú", "telefono": "+51 …", "correo": "…",
    "enlaces": [{ "t": "linkedin.com/in/…", "u": "https://www.linkedin.com/in/…" }],
    "extra": "Colegiatura CIP n.º [completar] · Habilitado (opcional)"
  },
  "perfil": "2-4 líneas.",
  "secciones": [
    { "titulo": "Experiencia", "entradas": [
      { "cargo": "…", "organizacion": "…", "lugar": "Lima, Perú", "fechas": "03/2024 – actualidad",
        "descripcion": "Una línea de contexto (opcional).", "vinetas": ["…", "…"] } ] },
    { "titulo": "Habilidades", "grupos": [{ "t": "Software", "items": ["S10", "MS Project"] }] },
    { "titulo": "Idiomas", "items": ["Inglés · intermedio (B1)"] },
    { "titulo": "Logros", "texto": "Párrafo libre (raro; preferir viñetas)." }
  ]
}
```

Cada sección usa una o varias de `entradas`, `grupos`, `items` o `texto`. En `cv-propuesto.json` el script añade `persona`, `puesto`, `rubro`, `mercado`, `fecha`, `palabras_clave`, `pendientes` y `listo_formato` (`listo`, `contenido`, `umbral`, `faltan`, `formato_mal`, `seguimiento`).

**Para quien le dé formato** (cv-factory u otra herramienta): no cambiar textos ni el orden; solo maquetar. Una columna, fuente común de 10-12 pt, contacto en el cuerpo (no en el encabezado de Word), sin tablas ni iconos, y exportar a PDF con texto real. Si quedan `pendientes`, avisar antes de exportar.
