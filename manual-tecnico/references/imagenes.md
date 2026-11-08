# Prompts de imagen

La skill no genera imágenes: el usuario lleva los prompts a ChatGPT. **Las ilustraciones son amables; el código y los diagramas, precisos.** Si una diapositiva explica un mecanismo, va en un diagrama y no en una imagen.

## Proyecto de ChatGPT (una sola vez)

Rakim es la mascota oficial: protagoniza las ilustraciones haciendo la acción del concepto (guarda algo en la base de datos, mira una variable). `assets/personaje/` guarda sus referencias (una o varias imágenes) para que ChatGPT sepa cómo es; nunca se pegan en las diapositivas, y **tú no las abres**. Solo cuando el usuario traiga un diseño nuevo de Rakim, míralo una vez y actualiza la descripción CHARACTER de abajo.

Rakim y el estilo viven en un proyecto de ChatGPT, no repetidos en cada prompt. Entrega este bloque **solo** si es el primer manual (no existe `indice.md`) o si el usuario lo pide: "Crea en ChatGPT el proyecto `Rakim · Manuales`, pega esto en sus instrucciones y sube las imágenes de `<ruta absoluta de la skill>/assets/personaje/` como archivos del proyecto. En cada chat nuevo, adjúntalas también en el primer mensaje."

```
Every image I ask for in this project follows these rules.

CHARACTER (when the prompt mentions Rakim): match the attached reference
images exactly. Rakim is a chunky stylized raccoon mascot in soft 3D
designer-vinyl-toy style, smooth matte finish, muted slate blue-grey body,
large rounded head (~40% of height), small round belly, short stubby limbs
with dark charcoal paws, wide cream-white muzzle mask wrapping around both
eyes in a soft V, cream-white jagged crest on the forehead, pointed ears with
cream-white lining, heavy-lidded expressive eyes, ruff of pointed fur tufts
around the neck with a cream-white V on the chest, bushy grey-and-cream ringed
tail. Friendly, warm, a little mischievous. Never change his colors or
proportions; the accent color enters only through light, props and background.
Always follow the pose and expression I describe, never copy the reference pose.

STYLE: friendly flat illustration with soft 3D volume, rounded chunky shapes,
cozy and approachable, warm limited palette, soft shadows, gentle glow.
Plain background in the exact color each prompt gives, so the image blends
into the slide. Modern picture-book illustration about
technology: playful but clean, never childish-messy. Centered subject with
generous empty margins.

NEVER: text, letters, numbers, logos, watermarks or UI chrome.
FORMAT: 16:9 unless the prompt says 1:1.
```

Si el usuario no usa el proyecto, arma cada prompt completo: escena + bloque de arriba.

## Qué imágenes pedir (6-9, una por bloque conceptual)

| Diapositiva | Imagen | Rakim |
|---|---|---|
| Portada (la de LinkedIn la reutiliza) | La metáfora central del tema, 16:9 | Sí |
| Qué es | Rakim haciendo lo que hace el concepto, 1:1 | Sí |
| Actores | Cada actor como un personaje u objeto con su función, 1:1 | Sí |
| Cómo funciona, reglas, variantes | La metáfora del mecanismo junto al diagrama o el código, 1:1 | Solo si la acción necesita protagonista |
| Dolor | Rakim agobiado por el error, 1:1 | Sí |

Sin imagen: anatomía, tipos, mapa, tablas, matriz, cierre. Prioriza las de portada, qué es y actores si el usuario quiere menos.

## Cómo escribir la escena

- **Una acción, no un objeto**: lo que hace Rakim es lo que hace el concepto. "Una base de datos" no sirve; "Rakim guardando bellotas en cajones etiquetados" sí.
- Describe **pose y expresión** según la fase: curioso en qué es, atareado en cómo funciona, agobiado en el dolor.
- Describe la composición: el sujeto llena el cuadro, sin espacio reservado para títulos (el texto nunca va encima, va al lado).
- Un concepto por imagen. Termina con `Accent color: <hex de la diapositiva>. Background: <fondo del tema>.` y el formato. Fondo oscuro `#07090b`, claro `#f7f7f4`: así la imagen se funde con la diapositiva.
- Escena en inglés, 3-5 líneas.

Ideas de partida: base de datos → bellotas en cajones · caché → un puñado a mano, sin ir al cajón · HTTP → cartero que vuelve con la respuesta · asincronía → cocinero con tres ollas · callbacks anidados → enredado en hilos · estado como instantánea → foto quieta frente a un río de fotos · inmutabilidad → copia nueva junto al original · contexto → paraguas que cubre a varios · prop drilling → paquete de mano en mano · router → guardagujas · middleware → control de equipaje · autenticación → portero que mira una credencial · cola → fila que entra de a uno.

## Formato de entrega

El usuario pega cada prompt en ChatGPT y guarda él mismo las imágenes: no propongas automatizarlo. Una línea al inicio: "Genera y guarda en este orden en `<carpeta>/imagenes/`; con los nombres exactos, mejor." Después, por imagen:

**1. `imagenes/01-portada.png`**: portada, 16:9
```
Rakim holding up a single instant photo with both paws, calm and pleased,
a small satisfied smile. Behind him a soft blurred river of identical photos
rushes past. Rakim and the photo sharp; the river out of focus.
Accent color: #61DAFB. Background: #07090b. 16:9.
```

Nombre: `imagenes/NN-concepto.png`, donde NN es el número de diapositiva.
