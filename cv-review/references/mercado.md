# Mercado: ofertas, palabras clave y dónde postular

Todo se verifica **el día de la revisión**. Nunca de memoria: ni empresas, ni precios, ni que una oferta siga abierta.

## Ofertas reales (alimentan el bloque 7 y el CV propuesto)

- Busca de 5 a 8 ofertas vigentes del puesto objetivo en su ciudad o en remoto, **en varias fuentes**:
  - Indeed (herramienta `mcp__claude_ai_Indeed__search_jobs` si está disponible; si no, la web)
  - Bumeran, Computrabajo, LinkedIn Jobs
  - las del rubro: Get on Board (tech), bolsa del CIP (ingeniería), Talento Perú de Servir (Estado), páginas de empleo de las empresas
- Anota de cada una: empresa, puesto, nivel, modalidad, requisitos excluyentes y palabras que se repiten. Cítalas en `fuentes`.
- Con ellas arma `palabras_clave` (la lista ordenada por frecuencia) y la tabla del bloque 7.
- Si una oferta es vieja o de otro país, no la cuentes. Si no encuentras suficientes, dilo en el informe.

## Dónde postular (`estrategia.portales`)

Una fila por portal con una **búsqueda lista** (URL con el puesto y la ciudad) y cómo usarlo:
- **Formulario del portal**: complétalo siempre. Los filtros de Computrabajo y Bumeran leen esos campos, no solo el adjunto.
- **Alertas** diarias con el puesto exacto y la ciudad.
- **Preguntas filtro**: responderlas con la verdad. Son el único descarte automático.
- Formato de las búsquedas (verifica que abren antes de ponerlas):
  - Indeed: `https://pe.indeed.com/jobs?q=<puesto>&l=<ciudad>`
  - Computrabajo: `https://pe.computrabajo.com/trabajo-de-<puesto-con-guiones>-en-<ciudad>`
  - Bumeran: `https://www.bumeran.com.pe/empleos-busqueda-<puesto-con-guiones>.html`
  - LinkedIn Jobs: `https://www.linkedin.com/jobs/search/?keywords=<puesto>&location=<ciudad>`

`estrategia.adaptar`: cómo adaptar el CV a cada oferta en 10 minutos (título del encabezado, perfil y el orden de 2-3 viñetas, con las palabras de esa oferta), sin inventar.

## Empresas (`estrategia.empresas`)

- De 6 a 10 empresas que **hoy** contratan ese perfil en ese mercado, verificadas en la web. Mezcla tamaños y tipos del rubro.
- Por cada una: por qué (oferta abierta, tipo de obra o stack, programa de trainees), enlace a su página de empleo y qué hacer (alerta, postular directo, contacto de RR. HH.).

## LinkedIn (`estrategia.linkedin`)

- Siempre una recomendación concreta para esa persona: qué tiene que coincidir con el CV (cargo, fechas, título del puesto), Open to Work según el objetivo (solo reclutadores si está empleada) y con quién conectar.
- Remite a la skill `linkedin-profile-review` para evaluarlo (completa o revisión rápida). No la dupliques aquí.

## Comunidades, cuentas y cursos

- **Comunidades** (`estrategia.comunidades`): 2-4 verificadas del rubro (colegio profesional, gremio, meetups, grupos de egresados). Chamba Lab va primera sola: no la pongas en el JSON.
- **Cuentas** (`estrategia.cuentas`): 3-5 activas en su idioma y rubro (YouTube, newsletters, LinkedIn, blogs), con dónde está cada una.
- **Cursos** (`estrategia.cursos`): 3-5, solo para cerrar brechas de la tabla de palabras clave o el siguiente nivel. Mezcla gratuitos y de pago, con precio o modalidad verificados el día; si no se puede confirmar, «verificar precio». Prioriza los que dejan una credencial o un proyecto que se pueda poner en el CV.
