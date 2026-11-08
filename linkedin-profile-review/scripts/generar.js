#!/usr/bin/env node
/**
 * Arma el informe desde el análisis, sin escribir HTML a mano.
 *
 *   node generar.js <carpeta>/evaluacion.json
 *
 *   -> <carpeta>/informe.html   con el sistema visual de assets/informe.html
 *   -> <carpeta>/imagenes/      copia las ilustraciones de Rakim (la foto y la portada ya deben estar)
 *
 * Calcula la nota con los pesos del objetivo, deriva el estado de cada bloque, numera los
 * hallazgos, coloca los marcadores en la maqueta y reparte el contenido en hojas A4.
 * Con "modo": "lite" arma la revisión rápida: portada con semáforo, maqueta y cambios (máximo 4 hojas)
 * (mide en Chromium y pasa a otra hoja lo que no cabe). Formato: assets/ejemplo-evaluacion.json.
 * Texto: **negrita** y [texto](url) se convierten; el resto se escapa.
 */
const path = require('path');
const fs = require('fs');
const cargarPlaywright = require('./playwright');

const SKILL = path.resolve(__dirname, '..');
const BLOQUES = [
  ['foto', 'Foto y portada'], ['titular', 'Titular'], ['ubicacion', 'Ubicación, URL y contacto'],
  ['acerca', 'Acerca de'], ['destacados', 'Destacados'], ['experiencia', 'Experiencia'],
  ['proyectos', 'Proyectos'], ['educacion', 'Educación y licencias'], ['aptitudes', 'Aptitudes'],
  ['recomendaciones', 'Recomendaciones'], ['actividad', 'Actividad'],
];
const PESOS = { // mismo orden que BLOQUES; ver references/objetivos.md
  empleo: [8, 14, 4, 12, 6, 20, 8, 6, 10, 4, 8],
  cambio: [6, 14, 3, 10, 5, 26, 4, 4, 10, 8, 10],
  notar:  [10, 12, 4, 14, 12, 12, 6, 3, 5, 4, 18],
};
const OBJETIVO = { empleo: 'Buscar empleo', cambio: 'Cambiar de trabajo', notar: 'Hacerse notar' };
const AJUSTE = { 'cambio-carrera': 8, 'sin-experiencia': 6 }; // puntos de Experiencia a Proyectos
const GRAV = { critico: 'Crítico', alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };
const ORDEN_GRAV = { critico: 0, alto: 1, medio: 2, bajo: 3 };
// Nuestra comunidad: va siempre la primera en «Comunidades para sumarte»
const CHAMBA_LAB = { nombre: 'Chamba Lab', url: 'https://github.com/Chamba-Lab', porque: 'Nuestra comunidad: manuales prácticos para conseguir empleo en tech (CV ATS, LinkedIn, STAR, experiencia sin experiencia) y gente en tu misma búsqueda' };
const conChambaLab = (filas) => [CHAMBA_LAB, ...(Array.isArray(filas) ? filas : []).filter((x) => !/chamba\s*-?\s*lab/i.test(x?.nombre || ''))];

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const md = (t) => esc(t)
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
  .replace(/\[\[(bien|mejorable|falta):([^\]]+)\]\]/g, '<span class="estado $1">$2</span>');
const lista = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const fechaCorta = (f) => (f ? f.split('-').reverse().join('-') : '');
const coma = (n) => n.toFixed(1).replace('.', ',');
const estadoDe = (n) => (n >= 7 ? ['bien', 'Bien'] : n >= 4 ? ['mejorable', 'Mejorable'] : ['falta', 'Falta']);
const veredicto = (t) => (t < 40 ? 'Invisible' : t < 60 ? 'Existe pero no compite' : t < 75 ? 'Compite' : t < 90 ? 'Destaca' : 'Referente');

function calcular(ev) {
  const pesos = [...(PESOS[ev.objetivo] || PESOS.empleo)];
  const mover = AJUSTE[ev.ajuste] || 0;
  pesos[5] -= mover; pesos[6] += mover;
  const filas = BLOQUES.map(([id, nombre], i) => {
    const nota = Math.max(0, Math.min(10, +(ev.bloques?.[id] ?? 0)));
    return { id, nombre, nota, peso: pesos[i], puntos: (nota * pesos[i]) / 10 };
  });
  return { filas, total: Math.round(filas.reduce((s, f) => s + f.puntos, 0)) };
}

function numerar(ev) {
  let n = 0;
  const todos = [];
  for (const s of ev.secciones || []) for (const it of s.items || []) {
    if (it.tipo === 'hallazgo') { it.n = ++n; it.bloque = s.bloque; todos.push(it); }
  }
  return todos;
}

const marcador = (h, extra = '') => `<span class="marcador ${h.gravedad === 'critico' ? '' : h.gravedad || ''} ${extra}" ${h.estilo ? `style="${h.estilo}"` : ''}>${h.n}</span>`;

function marcadoresEn(zona, hallazgos, base) {
  return hallazgos.filter((h) => h.zona === zona).map((h, i) => {
    const pos = base(i);
    return marcador({ ...h, estilo: pos });
  }).join('');
}

// ---------- páginas ----------
const esLite = (ev) => ev.modo === 'lite';
const NOMBRE_INFORME = (ev) => (esLite(ev) ? 'Revisión rápida' : 'Evaluación de perfil');
const cabeza = (ev) => `<header class="cabeza"><span><b>Chamba Lab</b> · ${NOMBRE_INFORME(ev)}</span><span>${esc(ev.persona.nombre)}</span></header>`;
const pie = (ev, nota) => `<footer class="pie"><span>${nota ? esc(nota) : esc(ev.persona.nombre) + ' · ' + fechaCorta(ev.fecha) + ' · Chamba Lab'}</span><span class="num"></span></footer>`;
const hoja = (ev, cuerpo, clase = '', notaPie = '') => `<section class="pagina ${clase}">${cabeza(ev)}<div class="cuerpo">${cuerpo}</div>${pie(ev, notaPie)}</section>`;

function portada(ev, nota) {
  const url = (ev.persona.url || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const antes = ev.anterior ? `<dt>Antes</dt><dd>${ev.anterior.total} (${fechaCorta(ev.anterior.fecha)})</dd>` : '';
  return `<section class="pagina portada">
  <div class="figura"><img src="imagenes/rakim-01-portada.jpg" alt=""></div>
  <div class="contenido">
    <span class="etiqueta">${esLite(ev) ? 'Revisión rápida de perfil LinkedIn' : 'Evaluación de perfil LinkedIn'} · ${esc((ev.fecha || '').slice(0, 4))}</span>
    <h1>${esc(ev.persona.nombre)}</h1>
    <p class="suave" style="font-size:14px">${md(ev.frase)}</p>
    <div class="fila-nota">
      <div class="anillo" style="--n:${nota.total}"><div><div><b>${nota.total}</b><span>de 100</span></div></div></div>
      <dl class="ficha">
        <dt>Veredicto</dt><dd>${veredicto(nota.total)}</dd>${antes}
        <dt>Objetivo</dt><dd>${OBJETIVO[ev.objetivo] || esc(ev.objetivo)}</dd>
        <dt>Puesto</dt><dd>${esc(ev.puesto)}</dd>
        <dt>Mercado</dt><dd>${esc(ev.mercado)}</dd>
        <dt>Perfil</dt><dd>${esc(url)}</dd>
        <dt>Leído</dt><dd>${fechaCorta(ev.fecha)}</dd>
      </dl>
    </div>
    ${esLite(ev) ? semaforo(ev, nota) : ''}
  </div>
  <div class="firma"><span>Chamba Lab · ${esc((ev.fecha || '').slice(0, 4))}</span><span>Criterios: manuales 03 · 04 · 05 · 06 · 09</span></div>
</section>`;
}

// Lite: el resumen cabe en la portada (semáforo de los 11 bloques + las 3 cosas)
function semaforo(ev, nota) {
  const fichas = nota.filas.map((f) => {
    const [c, t] = estadoDe(f.nota);
    return `<li><span>${f.nombre}</span><span class="estado ${c}">${t}</span></li>`;
  }).join('');
  return `<ul class="semaforo">${fichas}</ul>
    ${ev.resumen?.tres_cosas ? `<div class="aviso info"><b>Si solo haces 3 cosas esta semana:</b> ${md(ev.resumen.tres_cosas)}</div>` : ''}`;
}

// Lite: cierre compacto con las ofertas revisadas y la invitación a la evaluación completa
function cierreLite(ev) {
  const fuentes = lista(ev.fuentes).map((f) => `<a href="${esc(f.u)}">&gt; ${esc(f.t)}</a>`).join('');
  return `<div class="dos cierre"><div class="figura"><img src="imagenes/rakim-13-open-to-work.jpg" alt=""></div><div class="tarjeta"><h3>¿Quieres la evaluación completa?</h3>
      <p class="suave">Esta es la revisión rápida. La completa añade todas tus experiencias reescritas, la brecha de aptitudes frente a más ofertas, empresas a seguir, con quién conectar, qué publicar y un plan de 30 días.</p>
      <div class="enlaces" style="margin-top:8px"><span>&gt; manual 04 · LinkedIn desde cero</span>
          <a href="${esc(CHAMBA_LAB.url)}">&gt; Chamba Lab · ${esc(CHAMBA_LAB.url.replace(/^https?:\/\//, ''))}</a></div>
      ${fuentes ? `<h3 style="margin-top:10px">Ofertas revisadas</h3><div class="enlaces">${fuentes}</div>` : ''}
      <p class="tenue" style="margin-top:10px">Chamba Lab · ${esc((ev.fecha || '').slice(0, 4))}</p></div></div>`;
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
    ${ev.resumen?.tres_cosas ? `<div class="aviso info"><b>Si solo haces 3 cosas esta semana:</b> ${md(ev.resumen.tres_cosas)}</div>` : ''}`, '', 'Anclas: 0 no existe · 3 perjudica · 5 genérico · 7 bueno · 10 ejemplar · un perfil promedio saca 45-60');
}

function maqueta(ev, hallazgos) {
  const c = ev.cabecera || {};
  const enLinea = (zona) => hallazgos.filter((h) => h.zona === zona).map((h) => marcador(h, 'en-linea')).join('');
  const abs = (zona, top) => marcadoresEn(zona, hallazgos, (i) => `top:${top}px;right:${20 + i * 30}px`);
  const iniciales = (ev.persona.nombre || '').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const foto = c.foto ? `style="--img:url(${esc(c.foto)})"` : '';
  const banner = c.portada ? `style="--img:url(${esc(c.portada)})"` : '';
  const bloque = (zona, titulo, contenido) => `<div class="bloque"><h4>${titulo}</h4>${contenido}${abs(zona, 12)}</div>`;
  const conMarca = hallazgos.filter((h) => h.zona);
  return hoja(ev, `
    <h2><b>Tu perfil:</b> lo que ve el reclutador</h2>
    <h3>1 · En la lista de resultados</h3>
    <div class="resultado">
      <div class="mini" ${foto}>${c.foto ? '' : iniciales}</div>
      <div><b>${esc(ev.persona.nombre)}</b><br><span>${esc(c.titular)}</span><br><span class="tenue">${esc(c.ubicacion)}</span></div>
      ${marcadoresEn('resultado-titular', hallazgos, (i) => `top:16px;right:${14 + i * 30}px`)}
      ${marcadoresEn('resultado-ubicacion', hallazgos, (i) => `top:46px;right:${14 + i * 30}px`)}
    </div>
    <h3>2 · Al abrir tu perfil</h3>
    <div class="maqueta">
      <div class="banner" ${banner}></div>
      ${abs('banner', 104)}
      ${marcadoresEn('foto', hallazgos, (i) => `top:104px;left:${124 + i * 30}px`)}
      <div class="foto ${c.otw ? 'otw' : ''}" ${foto}>${c.foto ? '' : iniciales}</div>
      <div class="datos">
        <div class="nombre">${esc(ev.persona.nombre)}${enLinea('nombre')}</div>
        <div class="titular">${esc(c.titular)}${enLinea('titular')}</div>
        <div class="meta">${esc(c.ubicacion)}${enLinea('ubicacion')}${c.contactos ? ' · ' + esc(c.contactos) + enLinea('contactos') : ''} · ${esc((ev.persona.url || '').replace(/^https?:\/\/(www\.)?/, ''))}${enLinea('url')}</div>
      </div>
      ${bloque('acerca', 'Acerca de', c.acerca ? `<p class="recortado">${esc(c.acerca)}</p><span class="ver-mas">… ver más</span>` : '<p class="tenue">Sin texto</p>')}
      ${bloque('destacados', 'Destacados', lista(c.destacados).length ? `<p>${lista(c.destacados).map(esc).join(' · ')}</p>` : '<p class="tenue">Sin elementos</p>')}
      ${c.experiencia && hallazgos.some((h) => h.zona === 'experiencia') ? bloque('experiencia', 'Experiencia', `<p>${esc(c.experiencia)}</p>`) : ''}
      ${lista(c.aptitudes).length && hallazgos.some((h) => h.zona === 'aptitudes') ? bloque('aptitudes', 'Aptitudes principales', `<p>${lista(c.aptitudes).map(esc).join(' · ')}</p>`) : ''}
    </div>
    ${conMarca.length ? '<p class="tenue nota-leyenda">Cada número es el hallazgo del mismo número en el informe; aquí solo se marcan los que se ven en la cabecera y el inicio del perfil.</p>' : ''}
    <ul class="leyenda ${conMarca.length > 8 ? 'tres-col' : ''}">${conMarca.map((h) => `<li>${marcador(h)}<span><b>${esc(h.corto || h.titulo)}:</b> ${md(h.leyenda || h.porque)}</span></li>`).join('')}</ul>
    ${esLite(ev) && lista(ev.resumen?.funciona).length ? `<div class="tarjeta"><h3>Lo que ya funciona</h3><ul class="lista bien">${lista(ev.resumen.funciona).map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>` : ''}`, 'flujo', 'Primero te ve en la lista de resultados; solo si el titular le sirve, hace clic y lee el inicio');
}

// ---------- elementos de flujo (cada uno es un hijo de .cuerpo que se puede mover de hoja) ----------
function item(it, lite) {
  switch (it.tipo) {
    case 'hallazgo': if (lite) return `<p class="arreglo-lite ancla">${marcador(it, 'en-linea')} <b>${md(it.titulo)}:</b> ${md(it.arreglo)}</p>`;
      return `<div class="hallazgo ancla">${marcador(it)}<h3>${md(it.titulo)} <span class="grav ${it.gravedad}">${GRAV[it.gravedad] || ''}</span></h3>
      <p class="porque"><b>Por qué cuesta:</b> ${md(it.porque)}</p><p class="arreglo"><b>Arreglo:</b> ${md(it.arreglo)}</p></div>`;
    case 'subtitulo': return `<h3 class="ancla">${md(it.texto)}</h3>`;
    case 'cambio': {
      const parte = (x) => (Array.isArray(x) ? `<ul>${x.map((l) => `<li>${md(l)}</li>`).join('')}</ul>`
        : String(x).split(/\n+/).map((l) => `<p>${md(l)}</p>`).join(''));
      const largo = (x) => (Array.isArray(x) ? x.join(' ') : String(x || '')).replace(/\*\*/g, '').length;
      const conteo = (x) => (it.conteo ? `<span class="conteo">${largo(x)}/${it.conteo}</span>` : '');
      const cab = it.etiqueta ? `<h3>${md(it.etiqueta)}</h3>` : '';
      const antes = it.antes ? `<div class="antes">${conteo(it.antes)}${parte(it.antes)}</div>` : '';
      return `<div class="grupo">${cab}<div class="cambio ${it.apilado || !it.antes ? 'apilado' : ''}">${antes}<div class="despues">${conteo(it.despues)}${parte(it.despues)}</div></div></div>`;
    }
    case 'opciones': return `<div class="grupo">${it.titulo ? `<h3>${md(it.titulo)}</h3>` : ''}${it.opciones.map((o, i) => {
      const n = String(o.texto).length;
      return `<div class="opcion ${o.recomendada ? 'recomendada' : ''}"><span class="letra">${'ABCDE'[i]}</span><span>${md(o.texto)}</span><span class="conteo" style="position:static">${n}/${it.limite || 220}</span><span class="por">${o.recomendada ? '<b>Recomendada:</b> ' : ''}${md(o.por)}</span></div>`;
    }).join('')}</div>`;
    case 'listas': {
      const t = { bien: 'Lo que está bien', mal: 'Lo que está mal', agregar: 'Qué agregar', quitar: 'Qué quitar' };
      const cajas = Object.keys(t).filter((k) => lista(it[k]).length)
        .map((k) => `<div class="tarjeta"><h3>${(it.titulos && it.titulos[k]) || t[k]}</h3><ul class="lista ${k}">${lista(it[k]).map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>`);
      return `<div class="${cajas.length > 1 ? 'dos' : ''}">${cajas.join('')}</div>`;
    }
    case 'top': if (lite) return `<p><b>${md(it.titulo || 'Top 5 de aptitudes, en este orden')}:</b> ${lista(it.items).map(md).join(' · ')}</p>`;
      return `<div class="tarjeta"><h3>${md(it.titulo || 'Top 5, en este orden')}</h3><ol class="lista numerada">${lista(it.items).map((x) => `<li>${md(x)}</li>`).join('')}</ol></div>`;
    case 'tabla': return `<table class="tabla"><tr>${it.columnas.map((c) => `<th>${md(c)}</th>`).join('')}</tr>${it.filas.map((f) => `<tr>${f.map((c) => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</table>`;
    case 'aviso': return `<div class="aviso ${it.info ? 'info' : ''}">${md(it.texto)}</div>`;
    case 'texto': return `<p class="${it.suave ? 'suave' : ''}">${md(it.texto)}</p>`;
    case 'imagen': return `<div class="figura"><img src="${esc(it.src)}" alt=""></div>`;
    default: return '';
  }
}

function secciones(ev, nota) {
  const lite = esLite(ev);
  // Lite: una sección que solo trae hallazgos (nada que copiar) va a la tarjeta de arreglos rápidos
  const soloArreglo = (s) => lite && (s.items || []).every((it) => it.tipo === 'hallazgo');
  const html = (ev.secciones || []).filter((s) => !soloArreglo(s)).map((s) => {
    const f = nota.filas.find((x) => x.id === s.bloque);
    const lado = f ? `<div class="lado"><span class="estado ${estadoDe(f.nota)[0]}">${estadoDe(f.nota)[1]}</span><span class="puntos">${f.nota}/10</span></div>` : '';
    return `<div class="titulo-seccion ancla"><h2>${md(s.titulo)}</h2>${lado}</div>`
      + (s.intro ? `<p class="suave ancla">${md(s.intro)}</p>` : '') + (s.items || []).map((it) => item(it, lite)).join('');
  }).join('');
  const rapidos = (ev.secciones || []).filter(soloArreglo).flatMap((s) => s.items || []);
  return html + (rapidos.length ? `<div class="tarjeta"><h3>Arreglos rápidos</h3>${rapidos.map((it) => item(it, true)).join('')}</div>` : '');
}

function estrategia(ev) {
  const e = ev.estrategia || {};
  let h = '';
  if (e.publicaciones) {
    const p = e.publicaciones;
    h += `<div class="titulo-seccion ancla"><h2><b>Qué publicar:</b> ${esc(p.subtitulo || 'ideas que ya tienes')}</h2></div>`;
    if (p.intro) h += `<p class="suave ancla">${md(p.intro)}</p>`;
    const ideas = lista(p.ideas).map((i) => `<div class="idea"><div class="tipo">${esc(i.tipo)}</div><p class="gancho">${md(i.gancho)}</p><p class="suave">${md(i.detalle)}</p></div>`);
    for (let i = 0; i < ideas.length; i += 2) h += `<div class="dos">${ideas.slice(i, i + 2).join('')}</div>`;
    h += `<div class="aviso info">Para escribir cada una, con gancho, hashtags y hora de publicación: skill <b>linkedin-post-coach</b>.</div>`;
  }
  if (e.red) {
    h += `<div class="titulo-seccion ancla"><h2><b>Con quién conectar</b></h2></div>`;
    if (e.red.intro) h += `<p class="suave ancla">${md(e.red.intro)}</p>`;
    h += `<table class="tabla"><tr><th>A quién</th><th>Por qué</th><th>Búsqueda lista</th><th class="num">Por semana</th></tr>${lista(e.red.grupos).map((g) =>
      `<tr><td>${md(g.quien)}</td><td>${md(g.porque)}</td><td>${g.busqueda ? `<a href="https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(g.busqueda)}">${esc(g.busqueda)}</a>` : md(g.filtro || '')}</td><td class="num">${esc(g.semana ?? '')}</td></tr>`).join('')}</table>`;
    if (e.red.nota) h += `<div class="tarjeta"><h3>Nota de invitación</h3><p>${md(e.red.nota)}</p><p class="suave" style="margin-top:4px">Corta, con algo real de esa persona y sin pedir trabajo.</p></div>`;
  }
  const tablaEnlaces = (titulo, filas, cols) => (lista(filas).length ? `<div class="titulo-seccion ancla"><h2>${titulo}</h2></div><table class="tabla"><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr>${lista(filas).map((x) =>
    `<tr><td><b>${x.url ? `<a href="${esc(x.url)}">${esc(x.nombre)}</a>` : esc(x.nombre)}</b></td><td>${md(x.porque)}</td>${cols.length > 2 ? `<td>${md(x.ademas || '')}</td>` : ''}</tr>`).join('')}</table>` : '');
  h += tablaEnlaces('<b>Empresas</b> a seguir', e.empresas, ['Empresa', 'Por qué seguirla', 'Además']);
  h += tablaEnlaces('<b>Comunidades</b> para sumarte', conChambaLab(e.comunidades),['Comunidad', 'Por qué']);
  h += tablaEnlaces('<b>Cuentas</b> para aprender', e.cuentas, ['Cuenta', 'Qué aprender ahí', 'Dónde']);
  h += tablaEnlaces('<b>Cursos</b> para cerrar brechas', e.cursos, ['Curso', 'Qué brecha cierra', 'Plataforma · costo']);
  return h;
}

function plan(ev) {
  const semanas = lista(ev.plan).map((s) => `<div class="semana"><div class="cuando"><b>${esc(s.semana)}</b><span>${esc(s.foco)}</span></div><ul class="tareas">${lista(s.tareas).map((t) => `<li>${md(t)}</li>`).join('')}</ul></div>`).join('');
  const fuentes = lista(ev.fuentes).map((f) => `<a href="${esc(f.u)}">&gt; ${esc(f.t)}</a>`).join('');
  return `<div class="titulo-seccion ancla"><h2><b>Plan de 30 días:</b> en orden de impacto</h2></div>${semanas}
    ${ev.reevaluacion ? `<div class="aviso info"><b>Re-evaluación:</b> ${fechaCorta(ev.reevaluacion)}. Mira antes las apariciones en búsquedas, las vistas del perfil y los mensajes de reclutadores.</div>` : ''}
    <div class="dos cierre">
      <div class="figura"><img src="imagenes/rakim-13-open-to-work.jpg" alt=""></div>
      <div class="tarjeta"><h3>Para seguir</h3><div class="enlaces">
        <span>&gt; manual 04 · LinkedIn desde cero</span><span>&gt; manual 06 · Experiencia sin experiencia</span>
        <span>&gt; manual 03 · CV compatible con ATS</span><span>&gt; manual 05 · Método STAR</span>
        <a href="https://github.com/Chamba-Lab">&gt; github.com/Chamba-Lab</a></div>
        ${fuentes ? `<h3 style="margin-top:10px">Fuentes de esta evaluación</h3><div class="enlaces">${fuentes}</div>` : ''}
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
  if (!entrada) { console.error('Uso: node generar.js <carpeta>/evaluacion.json'); process.exit(1); }
  const ruta = path.resolve(entrada);
  const carpeta = path.dirname(ruta);
  const ev = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  if (!ev.persona?.nombre) { console.error('Falta persona.nombre en ' + ruta); process.exit(1); }

  const nota = calcular(ev);
  const hallazgos = numerar(ev);
  const paginas = (esLite(ev) ? [
    portada(ev, nota),
    maqueta(ev, hallazgos),
    hoja(ev, `<div class="titulo-seccion ancla"><h2><b>Tus cambios:</b> listos para copiar</h2></div>` + secciones(ev, nota) + cierreLite(ev), 'flujo'),
  ] : [
    portada(ev, nota),
    resumen(ev, nota, hallazgos),
    maqueta(ev, hallazgos),
    hoja(ev, secciones(ev, nota) + estrategia(ev), 'flujo'),
    hoja(ev, plan(ev), 'flujo'),
  ]).join('\n');

  const plantilla = fs.readFileSync(path.join(SKILL, 'assets', 'informe.html'), 'utf8');
  const [antes, resto] = plantilla.split('<!-- PAGINAS -->');
  const despues = resto.split('<!-- /PAGINAS -->')[1];
  const html = antes.replace('<title>Evaluación de perfil</title>', `<title>Evaluación · ${esc(ev.persona.nombre)}</title>`)
    + '<!-- PAGINAS -->\n' + paginas + '\n<!-- /PAGINAS -->' + despues;

  fs.mkdirSync(path.join(carpeta, 'imagenes'), { recursive: true });
  for (const f of fs.readdirSync(path.join(SKILL, 'assets', 'imagenes'))) {
    fs.copyFileSync(path.join(SKILL, 'assets', 'imagenes', f), path.join(carpeta, 'imagenes', f));
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
    if (esLite(ev) && total > 4) console.log(`LA REVISIÓN RÁPIDA OCUPA ${total} HOJAS (máximo 4): recorta el JSON (menos hallazgos o textos más cortos) y regenera.`);
    if (avisos.length) console.log('UN ELEMENTO NO CABE NI SOLO EN UNA HOJA (pártelo en el JSON): ' + avisos.join(' | '));
  } finally {
    await navegador.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
