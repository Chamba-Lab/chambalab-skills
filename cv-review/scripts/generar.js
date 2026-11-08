#!/usr/bin/env node
/**
 * Arma el informe de revisión de CV desde el análisis, sin escribir HTML a mano.
 *
 *   node generar.js <carpeta>/revision.json
 *
 *   -> <carpeta>/informe.html       sistema visual de assets/informe.html, repartido en hojas A4
 *   -> <carpeta>/cv-propuesto.json  contenido del CV propuesto (y si ya toca darle formato con cv-factory)
 *   -> <carpeta>/cv-propuesto.md    el mismo contenido en texto plano, para leerlo o pegarlo
 *   -> <carpeta>/imagenes/          copia las ilustraciones (las miniaturas del CV ya las dejó leer.py)
 *
 * Calcula la nota con los pesos del objetivo, numera los hallazgos, marca en la miniatura del CV
 * los que tienen `zona` (usa las posiciones de cv-leido.json) y añade el chequeo ATS automático.
 * Decide si el contenido ya está listo para el formato final (references/cv-factory.md).
 * Formato del JSON: assets/ejemplo-revision.json. Texto: **negrita** y [texto](url).
 */
const path = require('path');
const fs = require('fs');
const cargarPlaywright = require('./playwright');

const SKILL = path.resolve(__dirname, '..');
const BLOQUES = [
  ['formato', 'Formato ATS'], ['extension', 'Extensión y orden'], ['encabezado', 'Encabezado y contacto'],
  ['perfil', 'Perfil profesional'], ['experiencia', 'Experiencia'], ['proyectos', 'Proyectos u obras'],
  ['palabras', 'Palabras clave'], ['educacion', 'Educación y colegiatura'], ['certificaciones', 'Cursos y certificaciones'],
  ['aptitudes', 'Habilidades e idiomas'], ['redaccion', 'Redacción y ortografía'], ['coherencia', 'Coherencia y sustento'],
];
const PESOS = { // mismo orden que BLOQUES; ver references/criterios.md
  empleo: [12, 6, 6, 8, 24, 6, 12, 6, 4, 6, 6, 4],
  cambio: [10, 6, 6, 8, 28, 4, 12, 6, 4, 6, 6, 4],
  estado: [6, 6, 6, 4, 24, 2, 10, 10, 8, 4, 6, 14],
};
const OBJETIVO = { empleo: 'Buscar empleo', cambio: 'Cambiar de trabajo', estado: 'Sector público' };
const AJUSTE = { 'sin-experiencia': 8, 'cambio-carrera': 6 }; // puntos de Experiencia a Proyectos
const GRAV = { critico: 'Crítico', alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };
const ORDEN_GRAV = { critico: 0, alto: 1, medio: 2, bajo: 3 };
const CHAMBA_LAB = { nombre: 'Chamba Lab', url: 'https://github.com/Chamba-Lab', porque: 'Nuestra comunidad: manuales prácticos para conseguir empleo (CV ATS, LinkedIn, STAR, experiencia sin experiencia) y gente en tu misma búsqueda' };
const conChambaLab = (filas) => [CHAMBA_LAB, ...(Array.isArray(filas) ? filas : []).filter((x) => !/chamba\s*-?\s*lab/i.test(x?.nombre || ''))];
const ZONA_TXT = { encabezado: 'Encabezado', perfil: 'Perfil', experiencia: 'Experiencia', proyectos: 'Proyectos', educacion: 'Educación', aptitudes: 'Habilidades', certificaciones: 'Cursos', idiomas: 'Idiomas' };

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const md = (t) => esc(t)
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
  .replace(/\[\[(bien|mejorable|falta):([^\]]+)\]\]/g, '<span class="estado $1">$2</span>')
  .replace(/\[completar:([^\]]+)\]/g, '<span class="pendiente">[completar:$1]</span>');
const lista = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const fechaCorta = (f) => (f ? f.split('-').reverse().join('-') : '');
const coma = (n) => n.toFixed(1).replace('.', ',');
const estadoDe = (n) => (n >= 7 ? ['bien', 'Bien'] : n >= 4 ? ['mejorable', 'Mejorable'] : ['falta', 'Falta']);
// listo para formato: solo cuenta el contenido; formato y extensión los resuelve cv-factory
const SIN_CONTENIDO = ['formato', 'extension'];
const UMBRAL_CONTENIDO = 70;
const veredicto = (t) => (t < 40 ? 'No pasa el filtro' : t < 60 ? 'Pasa, pero no destaca' : t < 75 ? 'Compite' : t < 90 ? 'Destaca' : 'Referente');

function calcular(ev) {
  const pesos = [...(PESOS[ev.objetivo] || PESOS.empleo)];
  const mover = AJUSTE[ev.ajuste] || 0;
  pesos[4] -= mover; pesos[5] += mover;
  const filas = BLOQUES.map(([id, nombre], i) => {
    const nota = Math.max(0, Math.min(10, +(ev.bloques?.[id] ?? 0)));
    return { id, nombre, nota, peso: pesos[i], puntos: (nota * pesos[i]) / 10 };
  });
  return { filas, total: Math.round(filas.reduce((s, f) => s + f.puntos, 0)) };
}

function listoFormato(ev, nota, hallazgos) {
  const filas = nota.filas.filter((f) => !SIN_CONTENIDO.includes(f.id));
  const peso = filas.reduce((s, f) => s + f.peso, 0);
  const contenido = Math.round((filas.reduce((s, f) => s + f.puntos, 0) / peso) * 100);
  const criticos = hallazgos.filter((h) => h.gravedad === 'critico' && !SIN_CONTENIDO.includes(h.bloque));
  const pend = ev.cv_propuesto ? pendientes(ev.cv_propuesto) : [];
  const faltan = [];
  if (!ev.cv_propuesto) faltan.push('falta el CV propuesto');
  if (contenido < UMBRAL_CONTENIDO) faltan.push(`subir el contenido de ${contenido} a ${UMBRAL_CONTENIDO} puntos`);
  if (criticos.length) faltan.push(`resolver ${criticos.length} hallazgo(s) crítico(s) de contenido (${criticos.map((h) => 'n.º ' + h.n).join(', ')})`);
  if (pend.length) faltan.push(`completar ${pend.length} dato(s) marcados [completar]`);
  const formatoMal = (nota.filas.find((f) => f.id === 'formato')?.nota ?? 10) < 7;
  return { listo: !faltan.length, contenido, umbral: UMBRAL_CONTENIDO, faltan, formato_mal: formatoMal, seguimiento: !!ev.anterior };
}

function avisoFormato(lf) {
  if (lf.listo) return `<div class="aviso info"><b>Listo para el formato final:</b> el contenido ya compite (${lf.contenido}/100, sin críticos ni datos pendientes). Siguiente paso: darle el diseño con cv-factory. Eliges la plantilla y sale el PDF compatible con ATS, en español y en inglés.</div>`;
  const consejo = lf.formato_mal ? ' No pierdas tiempo arreglando el diseño en Word o Canva: corrige el texto (te sirve <b>cv-propuesto.md</b>) y vuelve a revisarlo. Cuando pase, el diseño lo pone cv-factory.' : ' Corrige eso y vuelve a revisarlo.';
  return `<div class="aviso"><b>Todavía no toca el formato final.</b> Contenido: ${lf.contenido}/100. Falta: ${lf.faltan.map(esc).join(' · ')}.${consejo}</div>`;
}

function numerar(ev) {
  let n = 0;
  const todos = [];
  for (const s of ev.secciones || []) for (const it of s.items || []) {
    if (it.tipo === 'hallazgo') { it.n = ++n; it.bloque = s.bloque; todos.push(it); }
  }
  return todos;
}

const marcador = (h, extra = '', estilo = '') => `<span class="marcador ${h.gravedad === 'critico' ? '' : h.gravedad || ''} ${extra}" ${estilo ? `style="${estilo}"` : ''}>${h.n}</span>`;

// ---------- páginas ----------
const cabeza = (ev) => `<header class="cabeza"><span><b>Chamba Lab</b> · Revisión de CV</span><span>${esc(ev.persona.nombre)}</span></header>`;
const pie = (ev, nota) => `<footer class="pie"><span>${nota ? esc(nota) : esc(ev.persona.nombre) + ' · ' + fechaCorta(ev.fecha) + ' · Chamba Lab'}</span><span class="num"></span></footer>`;
const hoja = (ev, cuerpo, clase = '', notaPie = '') => `<section class="pagina ${clase}">${cabeza(ev)}<div class="cuerpo">${cuerpo}</div>${pie(ev, notaPie)}</section>`;

function portada(ev, nota, leido, lf) {
  const antes = ev.anterior ? `<dt>Antes</dt><dd>${ev.anterior.total} (${fechaCorta(ev.anterior.fecha)})</dd>` : '';
  const hojas = leido ? (leido.paginas || `~${leido.paginas_estimadas}`) + ' · ' + esc(leido.tipo.toUpperCase()) : '';
  return `<section class="pagina portada">
  <div class="figura"><img src="imagenes/cv-01-portada.jpg" alt=""></div>
  <div class="contenido">
    <span class="etiqueta">Revisión de CV · ${esc(ev.rubro_nombre || ev.rubro || '')} · ${esc((ev.fecha || '').slice(0, 4))}</span>
    <h1>${esc(ev.persona.nombre)}</h1>
    <p class="suave" style="font-size:14px">${md(ev.frase)}</p>
    <div class="fila-nota">
      <div class="anillo" style="--n:${nota.total}"><div><div><b>${nota.total}</b><span>de 100</span></div></div></div>
      <dl class="ficha">
        <dt>Veredicto</dt><dd>${veredicto(nota.total)}</dd>${antes}
        <dt>Objetivo</dt><dd>${OBJETIVO[ev.objetivo] || esc(ev.objetivo)}</dd>
        <dt>Puesto</dt><dd>${esc(ev.puesto)}</dd>
        <dt>Formato final</dt><dd>${lf.listo ? 'Listo para darle diseño' : 'Aún no: primero el contenido'}</dd>
        <dt>Mercado</dt><dd>${esc(ev.mercado)}</dd>
        <dt>Archivo</dt><dd>${esc(leido?.archivo || ev.archivo || '')}</dd>
        ${hojas ? `<dt>Hojas</dt><dd>${hojas}</dd>` : ''}
        <dt>Revisado</dt><dd>${fechaCorta(ev.fecha)}</dd>
      </dl>
    </div>
  </div>
  <div class="firma"><span>Chamba Lab · ${esc((ev.fecha || '').slice(0, 4))}</span><span>Criterios: manuales 03 · 05 · 06 · 09</span></div>
</section>`;
}

function resumen(ev, nota, hallazgos) {
  const filas = nota.filas.map((f) => {
    const [c, t] = estadoDe(f.nota);
    return `<tr><td>${f.nombre}</td><td><span class="estado ${c}">${t}</span></td><td class="num">${f.nota}/10</td><td class="num">${f.peso}</td><td class="num">${coma(f.puntos)}</td></tr>`;
  }).join('');
  const ajuste = ev.ajuste ? ` · ajuste «${esc(ev.ajuste)}»` : '';
  const cuesta = lista(ev.resumen?.cuesta).length ? lista(ev.resumen.cuesta)
    : [...hallazgos].sort((a, b) => ORDEN_GRAV[a.gravedad] - ORDEN_GRAV[b.gravedad] || a.n - b.n).slice(0, 3).map((h) => `**${h.titulo}**`);
  return hoja(ev, `
    <h2><b>Resumen:</b> dónde pierdes puntos</h2>
    <table class="tabla"><tr><th>Bloque</th><th>Estado</th><th class="num">Nota</th><th class="num">Peso</th><th class="num">Puntos</th></tr>${filas}
    <tr class="total"><td colspan="4">Total · pesos de «${(OBJETIVO[ev.objetivo] || '').toLowerCase()}»${ajuste}</td><td class="num">${nota.total}</td></tr></table>
    <div class="dos">
      <div class="tarjeta"><h3>Lo que más te cuesta</h3><ul class="lista mal">${cuesta.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
      <div class="tarjeta"><h3>Lo que ya funciona</h3><ul class="lista bien">${lista(ev.resumen?.funciona).map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
    </div>
    ${ev.resumen?.tres_cosas ? `<div class="aviso info"><b>Si solo haces 3 cosas esta semana:</b> ${md(ev.resumen.tres_cosas)}</div>` : ''}`, '', 'Anclas: 0 no existe · 3 perjudica · 5 genérico · 7 bueno · 10 ejemplar · un CV promedio saca 45-60');
}

// chequeo ATS automático a partir de cv-leido.json
function chequeo(leido) {
  if (!leido) return '';
  const s = leido.senales || {};
  const fila = (ok, texto) => `<li><span class="${ok === true ? 'si' : ok === false ? 'no' : 'ojo'}">${ok === true ? '✓' : ok === false ? '✕' : '!'}</span><span>${texto}</span></li>`;
  const hojas = leido.paginas || leido.paginas_estimadas;
  const items = [
    fila(s.texto_extraible, s.texto_extraible ? 'Texto extraíble: el ATS puede leerlo' : 'Sin texto: es una imagen o un escaneo'),
    fila(s.columnas === 1, s.columnas === 1 ? 'Una columna' : `${s.columnas} columnas: el ATS mezcla las líneas`),
    s.tablas != null ? fila(!s.tablas, s.tablas ? `${s.tablas} tabla(s)` : 'Sin tablas') : '',
    s.cuadros_de_texto != null ? fila(!s.cuadros_de_texto, s.cuadros_de_texto ? `${s.cuadros_de_texto} cuadro(s) de texto` : 'Sin cuadros de texto') : '',
    Array.isArray(s.texto_en_encabezado_word) ? fila(!s.texto_en_encabezado_word.length, s.texto_en_encabezado_word.length ? 'Datos en el encabezado de Word: algunos ATS no lo leen' : 'Nada en el encabezado de Word') : '',
    fila(!s.iconos, s.iconos ? `${s.iconos} icono(s) que el ATS no entiende` : 'Sin iconos'),
    fila(s.imagenes ? null : true, s.imagenes ? `${s.imagenes} imagen(es): foto, logos o barras` : 'Sin imágenes'),
    fila(s.correos?.length === 1 ? true : s.correos?.length ? null : false, s.correos?.length ? `Correo encontrado${s.correos.length > 1 ? 's: ' + s.correos.length : ''}` : 'El ATS no encuentra ningún correo'),
    lista(s.correos_partidos).length ? fila(false, 'Correo partido en dos líneas: el ATS no lo reconoce') : '',
    fila(s.telefonos?.length ? true : false, s.telefonos?.length ? 'Celular encontrado' : 'El ATS no encuentra un celular'),
    fila(!(s.menciona_dni || s.datos_personales_de_mas), s.menciona_dni || s.datos_personales_de_mas ? 'DNI, fecha de nacimiento o estado civil: no hacen falta' : 'Sin datos personales de más'),
    fila(hojas <= 2 ? true : null, `${hojas} hoja(s)${leido.paginas ? '' : ' (estimado)'}`),
  ].join('');
  return `<div class="tarjeta"><h3>Chequeo automático</h3><ul class="chequeo">${items}</ul>${lista(s.fuentes).length ? `<p class="tenue" style="margin-top:6px;font-size:10.5px">Fuentes: ${lista(s.fuentes).map(esc).join(' · ')}</p>` : ''}</div>`;
}

function vista(ev, hallazgos, leido) {
  const conMarca = hallazgos.filter((h) => h.zona);
  const zonas = leido?.zonas || {};
  const minis = lista(leido?.miniaturas).slice(0, 2).map((src, i) => {
    const marcas = conMarca.filter((h) => (zonas[h.zona] || [1, 0.03])[0] === i + 1)
      .map((h, j) => marcador(h, '', `top:calc(${((zonas[h.zona] || [1, 0.03])[1] * 100).toFixed(1)}% + ${j * 4}px);left:${-11 + (j % 2) * 24}px`)).join('');
    return `<div class="miniatura"><img src="${esc(src)}" alt="">${marcas}<span class="pag">hoja ${i + 1}</span></div>`;
  }).join('');
  const texto = lista(leido?.texto_por_pagina).join('\n').split('\n').filter((l) => l.trim()).slice(0, 34).join('\n');
  return hoja(ev, `
    <h2><b>Tu CV:</b> lo que ves tú y lo que lee el ATS</h2>
    <div class="vista">
      <div class="miniaturas">${minis || '<div class="sin-vista">Sin vista previa: el CV llegó en Word. Expórtalo a PDF para ver cómo queda la página.</div>'}</div>
      <div class="grupo"><h3>Lo que extrae el ATS, en orden</h3><div class="ats-texto">${esc(texto || 'Sin texto extraíble')}</div>${chequeo(leido)}</div>
    </div>
    ${conMarca.length ? `<ul class="leyenda ${conMarca.length > 8 ? 'tres-col' : ''}">${conMarca.map((h) => `<li>${marcador(h)}<span><b>${esc(h.corto || ZONA_TXT[h.zona] || h.titulo)}:</b> ${md(h.leyenda || h.porque)}</span></li>`).join('')}</ul>` : ''}`,
  'flujo', 'Primero lo lee el ATS (texto en orden); después, unos segundos de una persona');
}

// ---------- elementos de flujo (cada uno es un hijo de .cuerpo que se puede mover de hoja) ----------
function item(it) {
  switch (it.tipo) {
    case 'hallazgo': return `<div class="hallazgo ancla">${marcador(it)}<h3>${md(it.titulo)} <span class="grav ${it.gravedad}">${GRAV[it.gravedad] || ''}</span></h3>
      <p class="porque"><b>Por qué cuesta:</b> ${md(it.porque)}</p><p class="arreglo"><b>Arreglo:</b> ${md(it.arreglo)}</p></div>`;
    case 'subtitulo': return `<h3 class="ancla">${md(it.texto)}</h3>`;
    case 'cambio': {
      const parte = (x) => (Array.isArray(x) ? `<ul>${x.map((l) => `<li>${md(l)}</li>`).join('')}</ul>`
        : String(x).split(/\n+/).map((l) => `<p>${md(l)}</p>`).join(''));
      const cab = it.etiqueta ? `<h3>${md(it.etiqueta)}</h3>` : '';
      const antes = it.antes ? `<div class="antes">${parte(it.antes)}</div>` : '';
      return `<div class="grupo">${cab}<div class="cambio ${it.apilado || !it.antes ? 'apilado' : ''}">${antes}<div class="despues">${parte(it.despues)}</div></div></div>`;
    }
    case 'listas': {
      const t = { bien: 'Lo que está bien', mal: 'Lo que está mal', agregar: 'Qué agregar', quitar: 'Qué quitar' };
      const cajas = Object.keys(t).filter((k) => lista(it[k]).length)
        .map((k) => `<div class="tarjeta"><h3>${(it.titulos && it.titulos[k]) || t[k]}</h3><ul class="lista ${k}">${lista(it[k]).map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>`);
      return `<div class="${cajas.length > 1 ? 'dos' : ''}">${cajas.join('')}</div>`;
    }
    case 'top': return `<div class="tarjeta"><h3>${md(it.titulo || 'En este orden')}</h3><ol class="lista numerada">${lista(it.items).map((x) => `<li>${md(x)}</li>`).join('')}</ol></div>`;
    case 'tabla': return `<table class="tabla"><tr>${it.columnas.map((c) => `<th>${md(c)}</th>`).join('')}</tr>${it.filas.map((f) => `<tr>${f.map((c) => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</table>`;
    case 'aviso': return `<div class="aviso ${it.info ? 'info' : ''}">${md(it.texto)}</div>`;
    case 'texto': return `<p class="${it.suave ? 'suave' : ''}">${md(it.texto)}</p>`;
    default: return '';
  }
}

function secciones(ev, nota) {
  return (ev.secciones || []).map((s) => {
    const f = nota.filas.find((x) => x.id === s.bloque);
    const lado = f ? `<div class="lado"><span class="estado ${estadoDe(f.nota)[0]}">${estadoDe(f.nota)[1]}</span><span class="puntos">${f.nota}/10</span></div>` : '';
    return `<div class="titulo-seccion ancla"><h2>${md(s.titulo)}</h2>${lado}</div>`
      + (s.intro ? `<p class="suave ancla">${md(s.intro)}</p>` : '') + (s.items || []).map(item).join('');
  }).join('');
}

// ---------- CV propuesto: contenido para la skill de formato ----------
function entradaHTML(e) {
  const derecha = [e.lugar, e.fechas].filter(Boolean).map(esc).join(' · ');
  return `<div class="entrada"><div class="linea"><b>${md(e.cargo || e.titulo || '')}</b><span>${derecha}</span></div>
    ${e.organizacion ? `<div class="org">${md(e.organizacion)}</div>` : ''}${e.descripcion ? `<p>${md(e.descripcion)}</p>` : ''}
    ${lista(e.vinetas).length ? `<ul>${lista(e.vinetas).map((v) => `<li>${md(v)}</li>`).join('')}</ul>` : ''}</div>`;
}
function seccionCV(s) {
  let c = '';
  if (lista(s.entradas).length) c += s.entradas.map(entradaHTML).join('');
  if (lista(s.grupos).length) c += `<ul>${s.grupos.map((g) => `<li><b>${esc(g.t)}:</b> ${lista(g.items).map(md).join(', ')}</li>`).join('')}</ul>`;
  if (lista(s.items).length) c += `<ul>${s.items.map((x) => `<li>${md(x)}</li>`).join('')}</ul>`;
  if (s.texto) c += `<p>${md(s.texto)}</p>`;
  return `<h4>${esc(s.titulo)}</h4>${c}`;
}
function cvPropuesto(ev, lf) {
  const cv = ev.cv_propuesto;
  if (!cv) return '';
  const e = cv.encabezado || {};
  const contacto = [e.ciudad, e.telefono, e.correo, ...lista(e.enlaces).map((l) => l.t || l.u)].filter(Boolean).map(esc).join(' · ');
  const piezas = [
    `<div class="nombre">${esc(e.nombre || ev.persona.nombre)}</div><div class="titulo">${md(e.titulo || '')}</div><div class="contacto">${contacto}</div>${e.extra ? `<div class="contacto">${md(e.extra)}</div>` : ''}${cv.perfil ? `<h4>Perfil</h4><p>${md(cv.perfil)}</p>` : ''}`,
    ...lista(cv.secciones).map(seccionCV),
  ];
  const bloques = piezas.map((p, i) => `<div class="cvp ${piezas.length === 1 ? 'solo' : i === 0 ? 'primero' : i === piezas.length - 1 ? 'ultimo' : 'medio'}">${p}</div>`).join('');
  const pend = pendientes(cv);
  return `<div class="titulo-seccion ancla"><h2><b>Tu CV propuesto:</b> el contenido, listo para darle formato</h2></div>
    <p class="suave ancla">Este es el contenido corregido, en el orden que lee el ATS. El diseño final lo pone cv-factory cuando el contenido esté listo (está en <b>cv-propuesto.json</b> y <b>cv-propuesto.md</b>, en la carpeta de esta revisión). Objetivo: <b>${esc(cv.extension_objetivo || '')}</b>${cv.archivo_sugerido ? ` · archivo: <b>${esc(cv.archivo_sugerido)}</b>` : ''}.</p>
    <div class="ancla">${avisoFormato(lf)}</div>
    ${bloques}
    ${pend.length ? `<div class="aviso"><b>Antes de enviarlo, completa ${pend.length} dato(s):</b> ${pend.map(esc).join(' · ')}. Solo con datos reales y que puedas probar.</div>` : ''}`;
}
function pendientes(cv) {
  const texto = JSON.stringify(cv);
  return [...new Set([...texto.matchAll(/\[completar:\s*([^\]]+)\]/g)].map((m) => m[1].trim()))];
}
function cvMarkdown(ev) {
  const cv = ev.cv_propuesto, e = cv.encabezado || {};
  const limpio = (t) => String(t ?? '').replace(/\*\*(.+?)\*\*/g, '$1');
  const L = [`# ${e.nombre || ev.persona.nombre}`, limpio(e.titulo), [e.ciudad, e.telefono, e.correo, ...lista(e.enlaces).map((l) => l.u || l.t)].filter(Boolean).join(' · ')];
  if (e.extra) L.push(limpio(e.extra));
  if (cv.perfil) L.push('', '## Perfil', limpio(cv.perfil));
  for (const s of lista(cv.secciones)) {
    L.push('', `## ${s.titulo}`);
    for (const x of lista(s.entradas)) {
      L.push('', `### ${limpio(x.cargo || x.titulo)}${x.organizacion ? ' · ' + limpio(x.organizacion) : ''}`, [x.lugar, x.fechas].filter(Boolean).join(' · '));
      if (x.descripcion) L.push(limpio(x.descripcion));
      for (const v of lista(x.vinetas)) L.push(`- ${limpio(v)}`);
    }
    for (const g of lista(s.grupos)) L.push(`- **${g.t}:** ${lista(g.items).map(limpio).join(', ')}`);
    for (const i of lista(s.items)) L.push(`- ${limpio(i)}`);
    if (s.texto) L.push(limpio(s.texto));
  }
  return L.join('\n') + '\n';
}

// ---------- dónde postular y cómo sumar ----------
function estrategia(ev) {
  const e = ev.estrategia || {};
  let h = '';
  const tablaEnlaces = (titulo, filas, cols, intro) => (lista(filas).length ? `<div class="titulo-seccion ancla"><h2>${titulo}</h2></div>${intro ? `<p class="suave ancla">${md(intro)}</p>` : ''}<table class="tabla"><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr>${lista(filas).map((x) =>
    `<tr><td><b>${x.url ? `<a href="${esc(x.url)}">${esc(x.nombre)}</a>` : esc(x.nombre)}</b></td><td>${md(x.porque)}</td>${cols.length > 2 ? `<td>${md(x.ademas || '')}</td>` : ''}</tr>`).join('')}</table>` : '');
  h += tablaEnlaces('<b>Dónde postular:</b> búsquedas listas', e.portales, ['Portal', 'Qué buscar ahí', 'Cómo usarlo'], e.portales_intro);
  if (e.adaptar) h += `<div class="dos" style="grid-template-columns:34% 1fr"><div class="figura"><img src="imagenes/escena-feria-empleo.jpg" alt=""></div>
    <div class="tarjeta"><h3>Adapta el CV a cada oferta</h3><p>${md(e.adaptar)}</p></div></div>`;
  h += tablaEnlaces('<b>Empresas</b> que contratan tu perfil', e.empresas, ['Empresa', 'Por qué', 'Además']);
  if (e.linkedin) h += `<div class="titulo-seccion ancla"><h2><b>LinkedIn:</b> el CV te hace pasar, el perfil hace que te encuentren</h2></div>
    <div class="dos"><div class="tarjeta"><p>${md(e.linkedin)}</p><p class="suave" style="margin-top:6px">Para evaluarlo a fondo, con nota, reescrituras y plan: skill <b>linkedin-profile-review</b> (o su revisión rápida).</p></div>
    <div class="figura"><img src="imagenes/rakim-05-actores.jpg" alt=""></div></div>`;
  h += tablaEnlaces('<b>Comunidades</b> y redes para sumarte', conChambaLab(e.comunidades), ['Comunidad', 'Por qué']);
  h += tablaEnlaces('<b>Cuentas</b> para aprender', e.cuentas, ['Cuenta', 'Qué aprender ahí', 'Dónde']);
  h += tablaEnlaces('<b>Cursos</b> para cerrar brechas', e.cursos, ['Curso', 'Qué brecha cierra', 'Plataforma · costo']);
  return h;
}

function plan(ev) {
  const semanas = lista(ev.plan).map((s) => `<div class="semana"><div class="cuando"><b>${esc(s.semana)}</b><span>${esc(s.foco)}</span></div><ul class="tareas">${lista(s.tareas).map((t) => `<li>${md(t)}</li>`).join('')}</ul></div>`).join('');
  const fuentes = lista(ev.fuentes).map((f) => `<a href="${esc(f.u)}">&gt; ${esc(f.t)}</a>`).join('');
  return `${semanas ? `<div class="titulo-seccion ancla"><h2><b>Plan:</b> en orden de impacto</h2></div>${semanas}` : ''}
    ${ev.reevaluacion ? `<div class="aviso info"><b>Re-evaluación:</b> ${fechaCorta(ev.reevaluacion)}. Cuenta antes cuántas postulaciones enviaste y cuántas llamadas recibiste: esa tasa dice si el CV funciona.</div>` : ''}
    <div class="dos cierre">
      <div class="figura"><img src="imagenes/escena-oferta.jpg" alt=""></div>
      <div class="tarjeta"><h3>Para seguir</h3><div class="enlaces">
        <span>&gt; manual 03 · CV compatible con ATS</span><span>&gt; manual 09 · Leer una oferta</span>
        <span>&gt; manual 05 · Método STAR</span><span>&gt; manual 06 · Experiencia sin experiencia</span>
        <a href="https://github.com/Chamba-Lab">&gt; github.com/Chamba-Lab</a></div>
        ${fuentes ? `<h3 style="margin-top:10px">Fuentes de esta revisión</h3><div class="enlaces">${fuentes}</div>` : ''}
        <p class="tenue" style="margin-top:10px">Chamba Lab · ${esc((ev.fecha || '').slice(0, 4))}</p></div>
    </div>`;
}

// ---------- reparto en hojas, dentro de Chromium ----------
function paginar() {
  const cabe = (c) => c.scrollHeight <= c.clientHeight + 1;
  const avisos = [];
  for (let i = 0; ; i++) {
    const hojaActual = document.querySelectorAll('.pagina.flujo')[i];
    if (!hojaActual) break;
    const cuerpo = hojaActual.querySelector('.cuerpo');
    if (!cabe(cuerpo) && cuerpo.children.length > 1) {
      const mover = [];
      while (!cabe(cuerpo) && cuerpo.children.length > 1) mover.unshift(cuerpo.lastElementChild), cuerpo.lastElementChild.remove();
      while (cuerpo.children.length > 1 && cuerpo.lastElementChild.classList.contains('ancla')) mover.unshift(cuerpo.lastElementChild), cuerpo.lastElementChild.remove();
      const nueva = hojaActual.cloneNode(true);
      const c2 = nueva.querySelector('.cuerpo');
      c2.innerHTML = '';
      mover.forEach((m) => c2.appendChild(m));
      hojaActual.after(nueva);
    } else if (!cabe(cuerpo)) {
      avisos.push((cuerpo.textContent || '').trim().slice(0, 60));
    }
  }
  return avisos;
}

async function main() {
  const entrada = process.argv[2];
  if (!entrada) { console.error('Uso: node generar.js <carpeta>/revision.json'); process.exit(1); }
  const ruta = path.resolve(entrada);
  const carpeta = path.dirname(ruta);
  const ev = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  if (!ev.persona?.nombre) { console.error('Falta persona.nombre en ' + ruta); process.exit(1); }
  const rutaLeido = path.join(carpeta, 'cv-leido.json');
  const leido = fs.existsSync(rutaLeido) ? JSON.parse(fs.readFileSync(rutaLeido, 'utf8')) : null;

  const nota = calcular(ev);
  const hallazgos = numerar(ev);
  const lf = listoFormato(ev, nota, hallazgos);
  const paginas = [
    portada(ev, nota, leido, lf),
    resumen(ev, nota, hallazgos),
    vista(ev, hallazgos, leido),
    hoja(ev, secciones(ev, nota), 'flujo'),
    ev.cv_propuesto ? hoja(ev, cvPropuesto(ev, lf), 'flujo') : '',
    hoja(ev, estrategia(ev) + plan(ev), 'flujo'),
  ].filter(Boolean).join('\n');

  const plantilla = fs.readFileSync(path.join(SKILL, 'assets', 'informe.html'), 'utf8');
  const [antes, resto] = plantilla.split('<!-- PAGINAS -->');
  const despues = resto.split('<!-- /PAGINAS -->')[1];
  const html = antes.replace('<title>Revisión de CV</title>', `<title>Revisión de CV · ${esc(ev.persona.nombre)}</title>`)
    + '<!-- PAGINAS -->\n' + paginas + '\n<!-- /PAGINAS -->' + despues;

  fs.mkdirSync(path.join(carpeta, 'imagenes'), { recursive: true });
  for (const f of fs.readdirSync(path.join(SKILL, 'assets', 'imagenes'))) {
    fs.copyFileSync(path.join(SKILL, 'assets', 'imagenes', f), path.join(carpeta, 'imagenes', f));
  }
  if (ev.cv_propuesto) {
    const pend = pendientes(ev.cv_propuesto);
    const contrato = { _formato: 'cv-propuesto v1 · ver references/cv-propuesto.md de la skill cv-review', persona: ev.persona, puesto: ev.puesto, rubro: ev.rubro, mercado: ev.mercado, fecha: ev.fecha, palabras_clave: lista(ev.palabras_clave), pendientes: pend, listo_formato: lf, ...ev.cv_propuesto };
    fs.writeFileSync(path.join(carpeta, 'cv-propuesto.json'), JSON.stringify(contrato, null, 2));
    fs.writeFileSync(path.join(carpeta, 'cv-propuesto.md'), cvMarkdown(ev));
  }
  const salida = path.join(carpeta, 'informe.html');
  fs.writeFileSync(salida, html);

  const pw = cargarPlaywright();
  if (!pw) { console.log(`HTML sin repartir en hojas (falta Playwright): ${salida}`); return; }
  const navegador = await pw.chromium.launch();
  try {
    const p = await navegador.newPage({ viewport: { width: 1000, height: 1200 } });
    await p.goto('file:///' + salida.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const avisos = await p.evaluate(paginar);
    const final = await p.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
    fs.writeFileSync(salida, final);
    const total = await p.evaluate(() => document.querySelectorAll('.pagina').length);
    console.log(`Informe: ${salida}`);
    console.log(`Nota: ${nota.total}/100 · ${veredicto(nota.total)} · ${hallazgos.length} hallazgos · ${total} páginas`);
    if (ev.cv_propuesto) console.log(`CV propuesto: cv-propuesto.json y cv-propuesto.md · ${pendientes(ev.cv_propuesto).length} dato(s) por completar`);
    console.log(lf.listo ? `Listo para formato: sí · contenido ${lf.contenido}/100${lf.seguimiento ? '' : ' · primera revisión: solo ofrecerlo'}`
      : `Listo para formato: no · contenido ${lf.contenido}/100 · falta: ${lf.faltan.join(' · ')}`);
    if (!leido) console.log('AVISO: no hay cv-leido.json en la carpeta: corre antes «py leer.py cv …» para la vista y el chequeo ATS.');
    if (avisos.length) console.log('UN ELEMENTO NO CABE NI SOLO EN UNA HOJA (pártelo en el JSON): ' + avisos.join(' | '));
  } finally {
    await navegador.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
