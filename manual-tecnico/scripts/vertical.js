/**
 * Prepara una página de Playwright con el manual en formato 9:16 y revisa que
 * todo quepa en la zona segura. Lo usan exportar.js y revisar.js.
 */
const path = require('path');
const fs = require('fs');

const ANCHO = 720, ALTO = 1280, ESCALA = 1.5; // 1080x1920 reales
const ZONA = { izq: 66, der: 654, arriba: 147, abajo: 934 };

async function abrir(navegador, rutaHtml) {
  const pagina = await navegador.newPage({
    viewport: { width: ANCHO, height: ALTO }, deviceScaleFactor: ESCALA,
  });
  await pagina.goto('file://' + rutaHtml, { waitUntil: 'networkidle' });
  await pagina.addStyleTag({ path: path.join(__dirname, '..', 'assets', 'vertical.css') });
  const propio = path.join(path.dirname(rutaHtml), 'vertical.css');
  if (fs.existsSync(propio)) await pagina.addStyleTag({ path: propio });
  await pagina.evaluate(() => {
    const slides = [...document.querySelectorAll('.slide')];
    slides.forEach((s, i) => {
      const c = document.createElement('div');
      c.className = 'contador';
      c.textContent = `${i + 1}/${slides.length}`;
      s.appendChild(c);
    });
  });
  await pagina.waitForTimeout(1200);
  return pagina;
}

/** Ajusta el código (hasta 14 px lógicos) y lo denso (hasta 85 %) y lista lo que aún se sale. */
async function revisar(pagina) {
  return pagina.evaluate((Z) => {
    const problemas = [];
    document.querySelectorAll('.slide').forEach((s, i) => {
      s.querySelectorAll('pre').forEach((p) => {
        let t = parseFloat(getComputedStyle(p).fontSize);
        while (p.scrollWidth > p.clientWidth + 1 && t > 14) { t -= 0.5; p.style.fontSize = t + 'px'; }
        const code = p.querySelector('code');
        if (code) code.style.fontSize = 'inherit';
        if (p.scrollWidth > p.clientWidth + 1) problemas.push(`s${i + 1}: código demasiado ancho`);
      });
      const medir = () => {
        const base = s.getBoundingClientRect();
        const fuera = new Set();
        s.querySelectorAll('*').forEach((e) => {
          if (e.closest('pre') && e.tagName !== 'PRE') return;
          if (e.closest('.contador') || e.closest('.marca')) return;
          const conTexto = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          if (!conTexto && !e.matches('pre,img,.ilustracion,.figura,svg')) return;
          const r = e.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const x = r.left - base.left, y = r.top - base.top;
          if (y < Z.arriba - 2) fuera.add('arriba');
          if (y + r.height > Z.abajo + 2) fuera.add('abajo');
          if (x < Z.izq - 2 || x + r.width > Z.der + 2) fuera.add('a los lados');
        });
        return fuera;
      };
      const hijos = [...s.children].filter((h) => !h.matches('.contador,.marca'));
      let fuera = medir();
      for (let z = 0.99; fuera.size && z >= 0.85; z -= 0.01) {
        hijos.forEach((h) => { h.style.zoom = z; });
        fuera = medir();
      }
      if (fuera.size) problemas.push(`s${i + 1}: se sale ${[...fuera].join(', ')}`);
    });
    return problemas;
  }, ZONA);
}

module.exports = { abrir, revisar, ANCHO, ALTO };
