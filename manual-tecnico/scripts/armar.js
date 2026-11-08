#!/usr/bin/env node
/**
 * Ensambla el manual sin leer ni reescribir el CSS de la plantilla.
 *
 *   node armar.js ruta/diapositivas.html [--tema claro|oscuro] [--marca #hex] [--alterno #hex]
 *
 * Toma las diapositivas del fragmento, las pone entre las marcas DIAPOSITIVAS
 * de assets/plantilla.html y escribe manual.html junto al fragmento.
 * - --tema claro añade class="tema-claro" al <body> (por defecto, oscuro).
 * - --marca y --alterno fijan la paleta del tema.
 * - Un <style> dentro del fragmento (diapositivas nuevas) pasa al <head>.
 * Usa el primer <h1> como <title>. Borra el fragmento al terminar.
 */
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const entrada = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
const opcion = (n) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };

if (!entrada || !fs.existsSync(entrada)) {
  console.error('Uso: node armar.js <diapositivas.html> [--tema claro|oscuro] [--marca #hex] [--alterno #hex]');
  process.exit(1);
}

let fragmento = fs.readFileSync(entrada, 'utf8').trim();
const plantilla = fs.readFileSync(path.join(__dirname, '..', 'assets', 'plantilla.html'), 'utf8');

const marcas = /<!-- DIAPOSITIVAS -->[\s\S]*<!-- \/DIAPOSITIVAS -->/;
if (!marcas.test(plantilla)) {
  console.error('La plantilla no tiene las marcas <!-- DIAPOSITIVAS -->.');
  process.exit(1);
}

// estilos propios del manual: los del fragmento + la paleta
const estilos = [];
fragmento = fragmento.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => { estilos.push(css.trim()); return ''; }).trim();
const paleta = [opcion('marca') && `--marca:${opcion('marca')}`, opcion('alterno') && `--alterno:${opcion('alterno')}`].filter(Boolean);
if (paleta.length) estilos.unshift(`:root{${paleta.join(';')}}`);

const h1 = fragmento.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
const titulo = h1 ? h1[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : 'Manual técnico';

let html = plantilla
  .replace(marcas, () => `<!-- DIAPOSITIVAS -->\n${fragmento}\n<!-- /DIAPOSITIVAS -->`)
  .replace(/<title>[^<]*<\/title>/, () => `<title>${titulo}</title>`);
if (estilos.length) html = html.replace('</head>', () => `<style>\n/* propio de este manual */\n${estilos.join('\n')}\n</style>\n</head>`);
if (opcion('tema') === 'claro') html = html.replace(/^<body>$/m, '<body class="tema-claro">');

const salida = path.join(path.dirname(path.resolve(entrada)), 'manual.html');
fs.writeFileSync(salida, html);
fs.unlinkSync(entrada);

const total = (fragmento.match(/class="slide /g) || []).length;
console.log(`${total} diapositivas, tema ${opcion('tema') || 'oscuro'} -> ${salida}`);
if (total > 18) console.log('Aviso: más de 18 diapositivas; considera partir el tema.');
