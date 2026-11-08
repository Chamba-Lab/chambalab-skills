#!/usr/bin/env node
/**
 * Renderiza el manual para poder MIRARLO sin gastar contexto de más.
 *
 *   node revisar.js manual.html
 *
 * Produce dos cosas en revision/:
 *   contacto.png   todas las diapositivas en una sola imagen de contacto
 *   sNN.png        cada diapositiva por separado, a tamaño legible
 *
 * Mira SIEMPRE contacto.png primero: en una sola imagen barata se ven los
 * fallos gordos (texto que desborda, una diapositiva vacía, una llamada
 * fuera de sitio). Abre las sNN.png solo de las que se vean sospechosas.
 * Leer las 14 individuales cuesta varias veces más que la de contacto.
 */
const path = require('path');
const fs = require('fs');
const vertical = require('./vertical');

const ANCHO = 1280, ALTO = 720;
const ESC_INDIVIDUAL = 0.67;   // ~858x482: se lee el código y cuesta la mitad
const ESC_CONTACTO   = 0.25;   // ~320x180 por diapositiva
const COLUMNAS       = 3;

async function main() {
  const entrada = process.argv[2] || 'manual.html';
  const ruta = path.resolve(entrada);
  if (!fs.existsSync(ruta)) {
    console.error('No existe: ' + ruta);
    process.exit(1);
  }

  const pw = require('./playwright')();
  const chromium = pw && pw.chromium;
  if (!chromium) {
    console.error('Playwright no disponible. Revisa el manual abriéndolo en el navegador.');
    process.exit(2);
  }

  const salida = path.join(path.dirname(ruta), 'revision');
  fs.mkdirSync(salida, { recursive: true });

  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ viewport: { width: 1600, height: 1000 } });
  await pagina.goto('file://' + ruta, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(1500);

  const total = await pagina.locator('.slide').count();

  // --- hoja de contacto: rejilla de miniaturas, una sola imagen ---
  await pagina.evaluate(({ esc, cols, w, h }) => {
    document.documentElement.style.setProperty('--escala', esc);
    const mazo = document.querySelector('.mazo');
    mazo.style.display = 'grid';
    mazo.style.gridTemplateColumns = `repeat(${cols}, ${w * esc}px)`;
    mazo.style.gap = '10px';
    mazo.style.padding = '10px';
    mazo.style.background = '#1a1a1a';
    document.querySelectorAll('.marco').forEach((m) => {
      m.style.width = w * esc + 'px';
      m.style.height = h * esc + 'px';
      m.style.outline = '1px solid #444';
    });
  }, { esc: ESC_CONTACTO, cols: COLUMNAS, w: ANCHO, h: ALTO });
  await pagina.waitForTimeout(300);
  await pagina.locator('.mazo').screenshot({ path: path.join(salida, 'contacto.png') });

  // --- individuales, a tamaño legible ---
  await pagina.evaluate(({ esc, w, h }) => {
    const mazo = document.querySelector('.mazo');
    mazo.style.display = 'flex';
    mazo.style.gridTemplateColumns = '';
    document.documentElement.style.setProperty('--escala', esc);
    document.querySelectorAll('.marco').forEach((m) => {
      m.style.width = w * esc + 'px';
      m.style.height = h * esc + 'px';
      m.style.outline = '';
    });
  }, { esc: ESC_INDIVIDUAL, w: ANCHO, h: ALTO });
  await pagina.waitForTimeout(300);

  for (let i = 0; i < total; i++) {
    const n = String(i + 1).padStart(2, '0');
    await pagina.locator('.slide').nth(i).screenshot({ path: path.join(salida, `s${n}.png`) });
  }

  // --- formato 9:16: hoja de contacto y comprobación de la zona segura ---
  const vert = await vertical.abrir(navegador, ruta);
  const problemas = await vertical.revisar(vert);
  await vert.setViewportSize({ width: 1800, height: 1000 });
  await vert.evaluate(({ w, h }) => {
    const esc = 0.4, cols = 6;
    const mazo = document.querySelector('.mazo');
    mazo.style.setProperty('display', 'grid', 'important');
    mazo.style.gridTemplateColumns = `repeat(${cols}, ${w * esc}px)`;
    mazo.style.setProperty('gap', '8px', 'important');
    mazo.style.width = 'max-content';
    document.documentElement.style.width = document.body.style.width = 'auto';
    document.querySelectorAll('.marco').forEach((m) => {
      m.style.setProperty('width', w * esc + 'px', 'important');
      m.style.setProperty('height', h * esc + 'px', 'important');
      m.querySelector('.slide').style.zoom = esc;
    });
  }, { w: vertical.ANCHO, h: vertical.ALTO });
  await vert.waitForTimeout(300);
  await vert.locator('.mazo').screenshot({ path: path.join(salida, 'contacto-9x16.png') });

  await navegador.close();
  console.log(`${total} diapositivas en ${salida}`);
  console.log('Mira contacto.png y contacto-9x16.png primero; abre sNN.png solo de las sospechosas.');
  if (problemas.length) {
    console.log('9:16, fuera de la zona segura:');
    problemas.forEach((p) => console.log('  ' + p));
  } else {
    console.log('9:16: todo dentro de la zona segura.');
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
