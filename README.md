<div align="center">

# 🧰 Chamba Lab · Skills

**Skills de [Claude Code](https://claude.com/claude-code) de la comunidad [Chamba Lab](https://github.com/Chamba-Lab), con Rakim como mascota.**

Una carpeta por skill. Instalas solo las que quieras.

</div>

## 📦 Qué hay

| Skill | Qué hace | Pídela así |
|---|---|---|
| [`manual-tecnico`](./manual-tecnico/) | Convierte un concepto de desarrollo en un manual visual: PDF, diapositivas 9:16 y portada para LinkedIn | «Arma un manual de Zustand» |
| [`cv-review`](./cv-review/) | Revisa un CV (PDF o Word) de cualquier rubro y entrega un informe con nota, chequeo ATS, reescrituras y el CV corregido | «Revisa este CV: C:\ruta\cv.pdf» |
| [`linkedin-profile-review`](./linkedin-profile-review/) | Evalúa un perfil de LinkedIn desde tu Chrome y entrega un informe con nota, maqueta del perfil marcada y plan de 30 días | «Evalúa este perfil: linkedin.com/in/…» |

Cada carpeta tiene su README con lo que necesita y ejemplos de prompts.

## 🚀 Instalar

Clona el repositorio una vez y copia la carpeta de la skill que quieras a tus skills de Claude Code.

**macOS, Linux o Git Bash**

```bash
git clone https://github.com/Chamba-Lab/chambalab-skills.git ~/chambalab-skills
cp -r ~/chambalab-skills/cv-review ~/.claude/skills/
```

**Windows (PowerShell)**

```powershell
git clone https://github.com/Chamba-Lab/chambalab-skills.git "$HOME\chambalab-skills"
Copy-Item -Recurse -Force "$HOME\chambalab-skills\cv-review" "$HOME\.claude\skills\"
```

Cambia `cv-review` por `manual-tecnico` o `linkedin-profile-review` para las otras. Abre Claude Code de nuevo y la skill ya aparece.

También puedes pedírselo a Claude: *«Instala la skill cv-review de github.com/Chamba-Lab/chambalab-skills»*.

**Actualizar:** `git -C ~/chambalab-skills pull` y vuelve a copiar la carpeta. Tu configuración (`local.json`) no se pisa.

## 🔒 Datos personales

Las skills de revisión trabajan con CVs y perfiles de personas reales. Todo queda en tu equipo, en la carpeta que elijas la primera vez (se guarda en `local.json`, que no se sube a ningún sitio). No guardes esa carpeta dentro de un repositorio público ni subas los informes sin permiso de la persona.

## 📄 Licencia

El código y la documentación están bajo [licencia MIT](LICENSE). Rakim, sus ilustraciones y la marca Chamba Lab no: mira [NOTICE.md](NOTICE.md).
