/* Extractor de una página de perfil de LinkedIn. Se ejecuta DENTRO de la pestaña con
   mcp__claude-in-chrome__javascript_tool: pega el contenido tal cual en cada página.

   - Espera a que cargue y baja la página a tramos para que LinkedIn pinte las secciones
     diferidas (Experiencia, Educación, Licencias… solo existen en el DOM tras entrar en pantalla).
     Desde nov. 2026 lo que se desplaza es <main>, no la ventana: por eso se busca el contenedor
     desplazable y se baja de a ~80 % de su alto, en vez de saltar al final con window.scrollTo.
   - Limpia el texto: sin duplicados, sin botones, sin barra lateral ("Más perfiles para ti",
     "Otros perfiles vistos", "Gente que podrías conocer", "Podría gustarte") y sin el pie.
   - La herramienta corta las respuestas hacia los ~1000 caracteres: el resultado completo queda
     en window.__perfil y se devuelve "longitud · primer tramo". Lee el resto con
     window.__perfil.slice(900, 1800), slice(1800, 2700)… hasta cubrir la longitud.
   - La extensión bloquea respuestas con URL firmadas (query string): se quitan de los textos y,
     de la foto y la portada, solo se devuelve su caja en pantalla para recortarlas con la acción
     zoom + save_to_disk (ver references/lectura-chrome.md).
   Solo lee: no hace clic ni envía nada. */
await (async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  await espera(1500);
  // contenedor que de verdad se desplaza: <main> en el diseño actual; si no, la ventana
  const puede = (e) => e && /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 50;
  const main0 = document.querySelector('main');
  const caja0 = puede(main0) ? main0 : [...document.querySelectorAll('main *, body > div')].find(puede) || document.scrollingElement;
  let previo = -1;
  for (let i = 0; i < 40; i++) {
    caja0.scrollBy(0, caja0.clientHeight * 0.8); await espera(500);
    if (caja0.scrollTop === previo) { await espera(800); if (caja0.scrollTop + caja0.clientHeight >= caja0.scrollHeight - 2) break; }
    previo = caja0.scrollTop;
  }
  caja0.scrollTo(0, 0); await espera(400);

  const ruido = /^(mostrar (todo|todas|todos|menos|credencial|proyecto|publicaci[oó]n|todos los detalles.*)|show (all|more|less|credential|project)|ver (m[aá]s|todo|credencial|an[aá]lisis)|…\s*(ver )?m[aá]s|see more|seguir|siguiendo|conectar|mensaje|enviar mensaje|m[aá]s|follow|connect|message|more|validar|endorse|recomendar|comentar|compartir|enviar|editar|edit|anterior|siguiente|previous|next|abrir|comenzar|añadir (secci[oó]n|servicios|proyectos)|mejorar perfil|mejorar con la ia|recursos|tengo inter[eé]s en…|crear una publicaci[oó]n|​|—|·|\d+\s*(de|of)\s*\d+)$/i;
  const barra = /^(m[aá]s perfiles para ti|explorar perfiles premium|otros perfiles vistos|gente que podr[ií]as conocer|podr[ií]a gustarte|personas que tambi[eé]n|people also viewed|people you may know)/i;
  const pie = /^(accesibilidad|accessibility)$/i;

  const main = document.querySelector('main') || document.body;
  const lineas = [];
  for (const bruto of main.innerText.split('\n')) {
    const t = bruto.replace(/\s+/g, ' ').replace(/\?\S+/g, '').trim();
    if (!t || ruido.test(t) || lineas[lineas.length - 1] === t) continue;
    lineas.push(t);
  }
  // corta en la barra lateral o en el pie, lo que llegue primero
  const fin = lineas.findIndex((t) => barra.test(t) || pie.test(t));
  const texto = (fin < 0 ? lineas : lineas.slice(0, fin)).join(' | ');

  const caja = (re) => {
    const b = [...document.images].filter((i) => re.test(i.currentSrc || i.src))
      .map((i) => i.getBoundingClientRect()).filter((r) => r.width > 60).sort((a, c) => c.width - a.width)[0];
    return b ? [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)] : null;
  };
  const extra = {};
  const foto = caja(/profile-displayphoto|profile-framedphoto/), portada = caja(/profile-displaybackgroundimage/);
  if (foto || portada) extra.imagenes = { foto, portada, vista: [innerWidth, innerHeight] };
  if (/checkpoint|authwall|login/.test(location.href)) extra.aviso = 'LinkedIn pide verificación o inicio de sesión';

  window.__perfil = location.pathname + (Object.keys(extra).length ? ' :: ' + JSON.stringify(extra) : '') + ' :: ' + texto;
  return window.__perfil.length + ' · ' + window.__perfil.slice(0, 900);
})()
