#!/usr/bin/env node
/**
 * Exporta el informe y lo deja listo para revisar, sin abrir el navegador a mano.
 *
 *   node exportar.js <carpeta>/informe.html [--sin-pdf]
 *
 *   -> informe.pdf              A4, texto seleccionable y enlaces clicables
 *   -> <temporal>/contacto.png  todas las páginas en una sola imagen (mirar SOLO esta)
 *   -> <temporal>/pNN.png       cada página, por si algo se ve raro en contacto.png
 *      (<temporal> = carpeta del sistema, fuera de los resultados: no hay que borrar nada)
 *   -> por consola: páginas que desbordan (contenido cortado) y enlaces de imagen rotos
 *
 * Necesita Playwright con Chromium (local o global). Si no está, NO lo instales:
 * la ruta manual es Chrome -> Ctrl+P -> Guardar como PDF, márgenes "Ninguno",
 * marcar "Gráficos de fondo".
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const cargarPlaywright = require('./playwright');

async function main() {
  const entrada = process.argv[2];
  if (!entrada) { console.error('Uso: node exportar.js <carpeta>/informe.html [--sin-pdf]'); process.exit(1); }
  const ruta = path.resolve(entrada);
  if (!fs.existsSync(ruta)) { console.error('No existe: ' + ruta); process.exit(1); }
  const carpeta = path.dirname(ruta);
  const base = path.basename(ruta, '.html');

  const pw = cargarPlaywright();
  if (!pw) {
    console.log('Playwright no está disponible. Exporta a mano: abre el HTML en Chrome, Ctrl+P,');
    console.log('Destino "Guardar como PDF", Márgenes "Ninguno", marca "Gráficos de fondo".');
    process.exit(2);
  }

  const navegador = await pw.chromium.launch();
  try {
    const pagina = await navegador.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 1.5 });
    await pagina.goto('file:///' + ruta.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    await pagina.evaluate(() => document.fonts.ready);
    await pagina.waitForTimeout(500);

    // 1 · desbordes e imágenes rotas
    const informe = await pagina.evaluate(() => {
      const hojas = [...document.querySelectorAll('.pagina')];
      const desbordes = [];
      hojas.forEach((h, i) => {
        const caja = h.querySelector('.cuerpo') || h.querySelector('.contenido') || h;
        const exceso = caja.scrollHeight - caja.clientHeight;
        const titulo = (h.querySelector('h1,h2') || {}).textContent || '';
        if (exceso > 2) desbordes.push({ pagina: i + 1, exceso, titulo: titulo.trim().slice(0, 60) });
      });
      const rotas = [...document.images].filter((im) => !im.complete || im.naturalWidth === 0).map((im) => im.getAttribute('src'));
      return { total: hojas.length, desbordes, rotas };
    });

    // 2 · capturas por página y hoja de contacto
    const etiqueta = path.basename(path.dirname(carpeta)) + '-' + path.basename(carpeta);
    const revision = path.join(os.tmpdir(), 'linkedin-review', etiqueta);
    fs.mkdirSync(revision, { recursive: true });
    const hojas = pagina.locator('.pagina');
    const archivos = [];
    for (let i = 0; i < informe.total; i++) {
      const nombre = `p${String(i + 1).padStart(2, '0')}.png`;
      await hojas.nth(i).screenshot({ path: path.join(revision, nombre) });
      archivos.push(nombre);
    }
    const contacto = await navegador.newPage({ viewport: { width: 1240, height: 800 } });
    const imgs = archivos.map((a, i) =>
      `<figure><img src="${a}"><figcaption>${i + 1}</figcaption></figure>`).join('');
    const htmlContacto = path.join(revision, 'contacto.html');
    fs.writeFileSync(htmlContacto, `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#2b2f36;font:12px sans-serif;color:#ddd}
      .g{display:grid;grid-template-columns:repeat(4,300px);gap:10px;padding:10px;width:max-content}
      figure{margin:0}img{width:300px;display:block}figcaption{text-align:center;padding:2px}</style>
      <div class="g">${imgs}</div>`);
    await contacto.goto('file:///' + htmlContacto.replace(/\\/g, '/'), { waitUntil: 'load' });
    await contacto.locator('.g').screenshot({ path: path.join(revision, 'contacto.png') });
    fs.unlinkSync(htmlContacto);

    // 3 · PDF real (texto seleccionable, enlaces clicables)
    let pdf = null;
    if (!process.argv.includes('--sin-pdf')) {
      pdf = path.join(carpeta, base + '.pdf');
      await pagina.emulateMedia({ media: 'print' });
      await pagina.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true });
    }

    console.log(`Páginas: ${informe.total}`);
    if (pdf) console.log(`PDF: ${pdf} (${(fs.statSync(pdf).size / 1024).toFixed(0)} KB)`);
    console.log(`Revisión: ${path.join(revision, 'contacto.png')}`);
    if (informe.desbordes.length) {
      console.log('DESBORDAN (parte el contenido en otra página):');
      informe.desbordes.forEach((d) => console.log(`  pág. ${d.pagina} · ${d.exceso}px de más · ${d.titulo}`));
    } else console.log('Sin desbordes.');
    if (informe.rotas.length) console.log('IMÁGENES ROTAS: ' + informe.rotas.join(', '));
  } finally {
    await navegador.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
