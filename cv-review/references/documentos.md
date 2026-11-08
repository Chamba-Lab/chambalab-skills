# Documentos de respaldo: constancias, certificados y títulos

El CV casi nunca dice todo lo que la persona tiene probado. Los documentos sirven para tres cosas:
1. **Agregar** lo que está documentado y falta en el CV (un puesto, una obra, un curso con horas, la colegiatura).
2. **Corregir** lo que no coincide (fechas, cargos, nombre de la empresa).
3. **Medir** la experiencia como la cuentan los procesos (en el Estado, en años y meses, general y específica).

## Cuándo pedirlos

- **Siempre útiles; obligatorios** si el objetivo es el sector público, si el rubro exige experiencia acreditada (ingeniería, salud, docencia) o si el CV tiene huecos o fechas raras.
- Si solo hay CV, se revisa igual y el bloque 12 se evalúa con lo que se pueda, marcado «sin documentos: no evaluado del todo».

## Dónde

- Carpeta estable por persona: `<datos>/documentos/<slug>/` (`<datos>` está en `local.json`, ver `SKILL.md`), para no pedirlos en cada revisión. Pide a la persona que los deje ahí (PDF o fotos legibles) con nombres claros: `constancia-empresa-2024.pdf`, `titulo-bachiller.pdf`.
- Si ya están en otra carpeta del usuario, usa esa ruta: no los copies.

## Cómo leerlos

1. `py <skill>/scripts/leer.py docs <carpeta> <salida>` deja `documentos.json` con tipo, páginas y un extracto de cada uno.
2. Lee `documentos.json`. Los PDF escaneados y las fotos se miran con `Read`, **uno por uno** y solo los que hagan falta (para una constancia basta la página 1).
3. De cada documento anota: tipo (constancia, certificado, título, colegiatura, diploma), emisor, cargo o curso, fechas o año, horas y qué dato del CV respalda.

## Qué va al informe

Una sección `coherencia` con una tabla «Tus pruebas»:

| Documento | Qué prueba | En el CV | Qué hacer |
|---|---|---|---|
| Constancia de Empresa X | Asistente de oficina técnica, 03/2023 – 02/2024 | [[mejorable:Fechas distintas]] | Usar las fechas de la constancia |
| Certificado S10 (40 h) | Costos y presupuestos | [[falta:No está]] | Añadir en Cursos, con horas |

Y, si sirve, el cálculo de experiencia: total, en el cargo objetivo y en el sector (años y meses, sin solapar periodos).

## Privacidad

- Los documentos tienen DNI, firmas y a veces sueldos. **Nunca** copies números de DNI, sueldos ni firmas al informe ni a `revision.json`: basta con «constancia de Empresa X, cargo, fechas».
- Todo queda en local. No subas nada a servicios externos.
- No modifiques, renombres ni borres los documentos de la persona.
