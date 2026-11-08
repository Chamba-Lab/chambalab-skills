#!/usr/bin/env node
/**
 * Exporta el manual, sin abrir el navegador a mano.
 *
 *   node exportar.js manual.html [--pdf nombre.pdf]
 *        -> manual.pdf ligero (una imagen por página, enlaces clicables)
 *        -> slides-9x16/01.jpg, 02.jpg… (1080x1920, para TikTok e Instagram)
 *   node exportar.js portada-linkedin.html  -> portada-linkedin.png (1080x1080)
 *
 * El PDF no lleva capas: los degradados y sombras de la plantilla generan
 * cientos de objetos que hacen lenta la navegación. A cambio, su texto no se
 * puede seleccionar ni buscar.
 *
 * Necesita Playwright con Chromium. Si no está instalado, NO lo instales en la
 * máquina del usuario: usa la ruta manual (Chrome -> Ctrl+P -> Guardar como PDF,
 * márgenes "Ninguno", marcar "Gráficos de fondo"), que no depende de nada.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const vertical = require('./vertical');

const CALIDAD_PDF = 85, CALIDAD_9X16 = 90;

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** Enlaces de cada diapositiva: <a href> y direcciones escritas en .enlaces */
async function enlaces(pagina, indice) {
  return pagina.locator('.slide').nth(indice).evaluate((s) => {
    const base = s.getBoundingClientRect();
    const caja = (e) => {
      const r = e.getBoundingClientRect();
      return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    };
    const lista = [...s.querySelectorAll('a[href]')].map((a) => ({ href: a.href, ...caja(a) }));
    s.querySelectorAll('.enlaces > *:not(a)').forEach((e) => {
      if (e.querySelector('a[href]')) return;
      const m = e.textContent.match(/(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/i);
      if (m) lista.push({ href: m[1] ? m[0] : 'https://' + m[0], ...caja(e) });
    });
    return lista;
  });
}

async function pdfLigero(navegador, ruta, salida) {
  const pagina = await navegador.newPage({
    viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5,
  });
  await pagina.goto('file://' + ruta, { waitUntil: 'networkidle' });
  await pagina.waitForTimeout(1200);

  const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'manual-pdf-'));
  try {
    const total = await pagina.locator('.slide').count();
    const paginas = [];
    let totalEnlaces = 0;
    for (let i = 0; i < total; i++) {
      const archivo = `${i}.jpg`;
      await pagina.locator('.slide').nth(i).screenshot({
        path: path.join(temporal, archivo), type: 'jpeg', quality: CALIDAD_PDF,
      });
      const anclas = (await enlaces(pagina, i)).map((e) =>
        `<a href="${escapar(e.href)}" style="left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px"></a>`
      ).join('');
      totalEnlaces += (anclas.match(/<a /g) || []).length;
      paginas.push(`<div class="p"><img src="${archivo}">${anclas}</div>`);
    }
    const hoja = path.join(temporal, 'hoja.html');
    fs.writeFileSync(hoja, `<!doctype html><meta charset="utf-8"><style>
@page{size:1280px 720px;margin:0}*{margin:0;padding:0}
.p{position:relative;width:1280px;height:720px;overflow:hidden;break-after:page}
.p:last-child{break-after:auto}img{display:block;width:1280px;height:720px}
a{position:absolute;display:block}</style>${paginas.join('')}`);
    const impresion = await navegador.newPage();
    await impresion.goto('file://' + hoja, { waitUntil: 'load' });
    await impresion.pdf({
      path: salida, width: '1280px', height: '720px', printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    await impresion.close();
    const mb = (fs.statSync(salida).size / 1e6).toFixed(1);
    console.log(`PDF ligero: ${salida} (${total} páginas, ${mb} MB, ${totalEnlaces} enlaces)`);
  } finally {
    await pagina.close();
    fs.rmSync(temporal, { recursive: true, force: true });
  }
}

async function slides9x16(navegador, ruta) {
  const pagina = await vertical.abrir(navegador, ruta);
  const problemas = await vertical.revisar(pagina);
  const carpeta = path.join(path.dirname(ruta), 'slides-9x16');
  fs.mkdirSync(carpeta, { recursive: true });
  const total = await pagina.locator('.slide').count();
  for (let i = 0; i < total; i++) {
    const n = String(i + 1).padStart(2, '0');
    await pagina.locator('.slide').nth(i).screenshot({
      path: path.join(carpeta, `${n}.jpg`), type: 'jpeg', quality: CALIDAD_9X16,
    });
  }
  await pagina.close();
  console.log(`9:16: ${total} imágenes en ${carpeta}`);
  if (problemas.length) {
    console.log('Fuera de la zona segura (corrige antes de publicar):');
    problemas.forEach((p) => console.log('  ' + p));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const iPdf = args.indexOf('--pdf');
  const nombrePdf = iPdf >= 0 ? args[iPdf + 1] : null;
  const entrada = args.find((a, i) => !a.startsWith('--') && (iPdf < 0 || i !== iPdf + 1));
  if (!entrada) {
    console.error('Uso: node exportar.js <archivo.html> [--pdf nombre.pdf]');
    process.exit(1);
  }
  const ruta = path.resolve(entrada);
  if (!fs.existsSync(ruta)) {
    console.error('No existe: ' + ruta);
    process.exit(1);
  }

  const pw = require('./playwright')();
  const chromium = pw && pw.chromium;
  if (!chromium) {
    console.error('Playwright no está disponible. Exporta a mano desde Chrome:');
    console.error('  Ctrl+P -> Guardar como PDF -> Márgenes "Ninguno" -> marcar "Gráficos de fondo"');
    process.exit(2);
  }

  const navegador = await chromium.launch();
  if (path.basename(ruta).includes('portada')) {
    const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 2 });
    await pagina.goto('file://' + ruta, { waitUntil: 'networkidle' });
    await pagina.waitForTimeout(1200);
    const salida = ruta.replace(/\.html$/, '.png');
    await pagina.locator('.portada').first().screenshot({ path: salida });
    console.log('PNG generado: ' + salida);
  } else {
    const salida = nombrePdf ? path.join(path.dirname(ruta), nombrePdf) : ruta.replace(/\.html$/, '.pdf');
    await pdfLigero(navegador, ruta, salida);
    await slides9x16(navegador, ruta);
  }
  await navegador.close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
