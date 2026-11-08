/* Extractor de una página de perfil de LinkedIn. Se ejecuta DENTRO de la pestaña con
   mcp__claude-in-chrome__javascript_tool: pega el contenido tal cual en cada página.

   - Espera a que cargue, hace scroll para traer lo diferido y limpia el texto: sin duplicados,
     sin botones, sin barra lateral ("Otros perfiles vistos", "Gente que podrías conocer",
     "Podría gustarte") y sin el pie de LinkedIn.
   - La herramienta corta las respuestas hacia los ~1000 caracteres: el resultado completo queda
     en window.__perfil y se devuelve "longitud · primer tramo". Lee el resto con
     window.__perfil.slice(900, 1800), slice(1800, 2700)… hasta cubrir la longitud.
   - La extensión bloquea respuestas con URL firmadas (query string): se quitan de los textos y,
     de la foto y la portada, solo se devuelve su caja en pantalla para recortarlas con la acción
     zoom + save_to_disk (ver references/lectura-chrome.md).
   Solo lee: no hace clic ni envía nada. */
(async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  await espera(1500);
  for (let i = 0; i < 2; i++) { window.scrollTo(0, document.body.scrollHeight); await espera(1200); }
  window.scrollTo(0, 0); await espera(300);

  const ruido = /^(mostrar (todo|todas|todos|menos|credencial|proyecto|publicaci[oó]n|todos los detalles.*)|show (all|more|less|credential|project)|ver (m[aá]s|todo|credencial|an[aá]lisis)|…\s*(ver )?m[aá]s|see more|seguir|siguiendo|conectar|mensaje|enviar mensaje|m[aá]s|follow|connect|message|more|validar|endorse|recomendar|comentar|compartir|enviar|editar|edit|anterior|siguiente|previous|next|abrir|comenzar|añadir (secci[oó]n|servicios|proyectos)|mejorar perfil|mejorar con la ia|recursos|tengo inter[eé]s en…|crear una publicaci[oó]n|​|—|·|\d+\s*(de|of)\s*\d+)$/i;
  const barra = /^(otros perfiles vistos|gente que podr[ií]as conocer|podr[ií]a gustarte|personas que tambi[eé]n|people also viewed|people you may know)/i;
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
