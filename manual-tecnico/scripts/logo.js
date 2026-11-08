#!/usr/bin/env node
/**
 * Descarga el logo de la tecnología desde Simple Icons y lo deja coloreado.
 *
 *   node logo.js <nombre o slug> <carpeta-imagenes> [#color]
 *
 * Escribe <carpeta>/logo.svg con el color dado (o el oficial de la marca) e
 * imprime el color oficial para usarlo de base en la paleta del manual.
 * Sale con 2 si la marca no está en Simple Icons.
 */
const path = require('path');
const fs = require('fs');

const CDN = 'https://cdn.jsdelivr.net/npm/simple-icons@16';
const [buscado, carpeta, color] = process.argv.slice(2);

async function main() {
  if (!buscado || !carpeta) {
    console.error('Uso: node logo.js <nombre o slug> <carpeta-imagenes> [#color]');
    process.exit(1);
  }
  const datos = await (await fetch(`${CDN}/data/simple-icons.json`)).json();
  const iconos = Array.isArray(datos) ? datos : datos.icons;
  const clave = buscado.toLowerCase();
  const icono = iconos.find((i) => i.slug === clave || i.title.toLowerCase() === clave);
  if (!icono) {
    console.error(`"${buscado}" no está en Simple Icons. Busca el SVG oficial (repo o press kit)`);
    console.error('y guárdalo como logo.svg en la carpeta de imágenes, o sigue sin logo.');
    process.exit(2);
  }
  const svg = await (await fetch(`${CDN}/icons/${icono.slug}.svg`)).text();
  const relleno = color || '#' + icono.hex;
  fs.mkdirSync(carpeta, { recursive: true });
  fs.writeFileSync(path.join(carpeta, 'logo.svg'), svg.replace('<svg ', `<svg fill="${relleno}" `));
  console.log(`${icono.title}: color oficial #${icono.hex} -> ${path.join(carpeta, 'logo.svg')}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
