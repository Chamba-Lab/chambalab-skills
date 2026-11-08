"""
Lee un CV (PDF o DOCX) y una carpeta de documentos de respaldo, sin que Claude tenga que
pegar archivos enteros en el contexto.

  py leer.py cv <archivo.pdf|.docx> <carpeta-salida>
      -> <salida>/cv-leido.json      texto por página, señales ATS y posición de cada sección
      -> <salida>/imagenes/cv-pN.png miniatura de cada página (solo PDF, máx. 3)
      -> imprime un resumen corto: páginas, palabras y señales

  py leer.py docs <carpeta-documentos> <carpeta-salida>
      -> <salida>/documentos.json    por archivo: tipo, páginas y un extracto del texto
      -> imprime la lista; las imágenes (constancias fotografiadas) se miran con Read, una por una

Señales ATS que detecta (no deciden la nota: son evidencia para el análisis):
  columnas · tablas · cuadros de texto · texto en el encabezado o pie de Word · imágenes ·
  iconos (caracteres de uso privado) · fuentes y tamaños · texto extraíble (o escaneado) ·
  enlaces · correos y teléfonos encontrados.
Solo usa PyMuPDF (fitz) y la librería estándar.
"""
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

try:
    import pymupdf as fitz
except ImportError:  # versiones antiguas de PyMuPDF
    import fitz

sys.stdout.reconfigure(encoding='utf-8')

ENCABEZADOS = {
    'perfil': r'^(perfil( profesional)?|resumen( profesional)?|sobre m[ií]|acerca de m[ií]|objetivo( profesional)?|profile|summary|about me)$',
    'experiencia': r'^(experiencia( laboral| profesional)?|historial laboral|experience|work experience|employment)$',
    'proyectos': r'^(proyectos|obras|proyectos y obras|principales obras|projects|portfolio|portafolio)$',
    'educacion': r'^(educaci[oó]n|formaci[oó]n( acad[eé]mica)?|estudios|education)$',
    'aptitudes': r'^(habilidades( t[eé]cnicas)?|aptitudes|competencias|conocimientos( t[eé]cnicos)?|herramientas|skills|technical skills)$',
    'certificaciones': r'^(certificaciones|cursos|cursos y certificaciones|licencias|capacitaci[oó]n|capacitaciones|certifications|courses)$',
    'idiomas': r'^(idiomas|languages)$',
}
RE_CORREO = re.compile(r'[\w.+-]+@[\w-]+(\.[\w-]+)+')
RE_TEL = re.compile(r'(\+?51[\s-]?)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}')
RE_PRIVADO = re.compile('[-]')
RE_DNI = re.compile(r'\bDNI\b|\bD\.N\.I\b', re.I)
RE_NACIMIENTO = re.compile(r'fecha de nacimiento|naci(do|da) el|estado civil', re.I)


def norm(t):
    return re.sub(r'\s+', ' ', t).strip().lower().rstrip(':')


def zona_de(texto):
    t = norm(texto)
    if len(t) > 40:
        return None
    for zona, patron in ENCABEZADOS.items():
        if re.match(patron, t):
            return zona
    return None


def comunes(texto):
    planos = re.sub(r'\s+', ' ', texto)
    correos = sorted(set(m.group(0) for m in RE_CORREO.finditer(planos)))
    # correo cortado en dos líneas (nombre / @gmail.com): una persona lo ve, el ATS no lo reconoce
    unido = re.sub(r'\s*\n\s*(?=@)|(?<=@)\s*\n\s*', '', texto)
    partidos = sorted(set(m.group(0) for m in RE_CORREO.finditer(unido)) - set(correos))
    return {
        'correos': correos,
        'correos_partidos': partidos,
        'telefonos': sorted(set(m.group(0).strip() for m in RE_TEL.finditer(planos))),
        'iconos': len(RE_PRIVADO.findall(texto)),
        'menciona_dni': bool(RE_DNI.search(texto)),
        'datos_personales_de_mas': bool(RE_NACIMIENTO.search(texto)),
        'palabras': len(re.findall(r'\w+', texto)),
    }


def leer_pdf(ruta, salida):
    doc = fitz.open(ruta)
    paginas, zonas, fuentes, enlaces, imagenes = [], {}, {}, [], 0
    columnas_max = 1
    for i, pag in enumerate(doc):
        ancho, alto = pag.rect.width, pag.rect.height
        bloques = [b for b in pag.get_text('blocks') if b[6] == 0 and b[4].strip()]
        paginas.append(pag.get_text('text'))
        imagenes += len(pag.get_images(full=True))
        enlaces += [l.get('uri') for l in pag.get_links() if l.get('uri')]
        # columnas: bloques que empiezan a la derecha del 38 % y se solapan en altura con bloques de la izquierda
        izq = [b for b in bloques if b[0] < ancho * 0.30]
        der = [b for b in bloques if b[0] > ancho * 0.38 and (b[2] - b[0]) < ancho * 0.62]
        solapes = sum(1 for d in der if any(min(d[3], l[3]) - max(d[1], l[1]) > 4 for l in izq))
        if solapes >= 3:
            columnas_max = 2
        for b in bloques:
            for linea in b[4].split('\n'):
                z = zona_de(linea)
                if z and z not in zonas:
                    zonas[z] = [i + 1, round(b[1] / alto, 3)]
        for blk in pag.get_text('dict')['blocks']:
            for ln in blk.get('lines', []):
                for sp in ln.get('spans', []):
                    if sp['text'].strip():
                        clave = f"{sp['font']} {round(sp['size'])}pt"
                        fuentes[clave] = fuentes.get(clave, 0) + len(sp['text'])
        if i < 3:
            (salida / 'imagenes').mkdir(parents=True, exist_ok=True)
            pag.get_pixmap(matrix=fitz.Matrix(1.4, 1.4)).save(str(salida / 'imagenes' / f'cv-p{i + 1}.png'))
    texto = '\n'.join(paginas)
    zonas.setdefault('encabezado', [1, 0.03])
    principales = sorted(fuentes.items(), key=lambda x: -x[1])[:6]
    return {
        'paginas': len(doc),
        'texto_por_pagina': paginas,
        'zonas': zonas,
        'senales': {
            'texto_extraible': len(texto.strip()) > 200,
            'columnas': columnas_max,
            'imagenes': imagenes,
            'tablas': None,
            'cuadros_de_texto': None,
            'texto_en_encabezado_word': None,
            'fuentes': [f for f, _ in principales],
            'enlaces': sorted(set(enlaces)),
            **comunes(texto),
        },
        'miniaturas': [f'imagenes/cv-p{n + 1}.png' for n in range(min(3, len(doc)))],
    }


W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'


def texto_xml(xml):
    raiz = ET.fromstring(xml)
    parrafos = []
    for p in raiz.iter(W + 'p'):
        t = ''.join(x.text or '' for x in p.iter(W + 't'))
        if t.strip():
            parrafos.append(t)
    return raiz, parrafos


def leer_docx(ruta, salida):
    with zipfile.ZipFile(ruta) as z:
        nombres = z.namelist()
        raiz, parrafos = texto_xml(z.read('word/document.xml'))
        cabeceras = []
        for n in nombres:
            if re.match(r'word/(header|footer)\d*\.xml$', n):
                cabeceras += texto_xml(z.read(n))[1]
        imagenes = len([n for n in nombres if n.startswith('word/media/')])
    texto = '\n'.join(parrafos)
    cols = [c.get(W + 'num') for c in raiz.iter(W + 'cols') if c.get(W + 'num')]
    zonas = {}
    for i, p in enumerate(parrafos):
        z = zona_de(p)
        if z and z not in zonas:
            zonas[z] = [1, round(i / max(len(parrafos), 1), 3)]
    zonas.setdefault('encabezado', [1, 0.03])
    saltos = sum(1 for _ in raiz.iter(W + 'br') if _.get(W + 'type') == 'page')
    return {
        'paginas': None,
        'paginas_estimadas': max(saltos + 1, round(len(re.findall(r'\w+', texto)) / 450)),
        'texto_por_pagina': [texto],
        'zonas': zonas,
        'senales': {
            'texto_extraible': True,
            'columnas': max([int(c) for c in cols] + [1]),
            'imagenes': imagenes,
            'tablas': sum(1 for _ in raiz.iter(W + 'tbl')),
            'cuadros_de_texto': sum(1 for _ in raiz.iter(W + 'txbxContent')),
            'texto_en_encabezado_word': cabeceras[:6],
            'fuentes': sorted(set(f.get(W + 'ascii') for f in raiz.iter(W + 'rFonts') if f.get(W + 'ascii')))[:6],
            'enlaces': [],
            **comunes(texto + '\n' + '\n'.join(cabeceras)),
        },
        'miniaturas': [],
    }


def cmd_cv(archivo, salida):
    ruta, salida = Path(archivo), Path(salida)
    salida.mkdir(parents=True, exist_ok=True)
    ext = ruta.suffix.lower()
    if ext == '.pdf':
        datos = leer_pdf(ruta, salida)
    elif ext == '.docx':
        datos = leer_docx(ruta, salida)
    else:
        sys.exit(f'Formato no soportado: {ext}. Pide el CV en PDF o DOCX.')
    datos = {'archivo': ruta.name, 'tipo': ext[1:], **datos}
    (salida / 'cv-leido.json').write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding='utf-8')
    s = datos['senales']
    print(f"cv-leido.json · {datos['tipo']} · páginas: {datos['paginas'] or '~' + str(datos['paginas_estimadas'])} · palabras: {s['palabras']}")
    print(f"columnas: {s['columnas']} · tablas: {s['tablas']} · cuadros de texto: {s['cuadros_de_texto']} · imágenes: {s['imagenes']} · iconos: {s['iconos']}")
    print(f"texto extraíble: {s['texto_extraible']} · encabezado Word: {s['texto_en_encabezado_word']} · correos: {s['correos']} · partidos en dos líneas: {s['correos_partidos']} · teléfonos: {len(s['telefonos'])}")
    print(f"secciones encontradas: {', '.join(datos['zonas'])}")
    print(f"longitud del texto: {sum(len(t) for t in datos['texto_por_pagina'])} caracteres (lee cv-leido.json por tramos si es largo)")


def cmd_docs(carpeta, salida):
    carpeta, salida = Path(carpeta), Path(salida)
    salida.mkdir(parents=True, exist_ok=True)
    filas = []
    for f in sorted(carpeta.rglob('*')):
        if not f.is_file():
            continue
        ext = f.suffix.lower()
        fila = {'archivo': str(f.relative_to(carpeta)), 'tipo': ext[1:]}
        if ext == '.pdf':
            with fitz.open(f) as d:
                texto = '\n'.join(p.get_text('text') for p in d)
                fila['paginas'] = len(d)
            fila['extracto'] = re.sub(r'\s+', ' ', texto)[:700]
            if len(texto.strip()) < 40:
                fila['nota'] = 'PDF escaneado: sin texto. Míralo con Read (pages: "1").'
        elif ext == '.docx':
            with zipfile.ZipFile(f) as z:
                fila['extracto'] = re.sub(r'\s+', ' ', ' '.join(texto_xml(z.read('word/document.xml'))[1]))[:700]
        elif ext in ('.jpg', '.jpeg', '.png', '.webp'):
            fila['nota'] = 'Imagen: míralo con Read.'
        else:
            fila['nota'] = 'Formato no leído.'
        filas.append(fila)
    (salida / 'documentos.json').write_text(json.dumps(filas, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'documentos.json · {len(filas)} archivos')
    for x in filas:
        print(f"- {x['archivo']} · {x.get('paginas', '')} {x.get('nota', '')}".rstrip())


if __name__ == '__main__':
    if len(sys.argv) != 4 or sys.argv[1] not in ('cv', 'docs'):
        sys.exit(__doc__)
    (cmd_cv if sys.argv[1] == 'cv' else cmd_docs)(sys.argv[2], sys.argv[3])
