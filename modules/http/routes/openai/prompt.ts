export const PROMPT = {
	module: `Evita el pre-text y el post-text, no hagas comentarios, sugerencias o aclaraciones. Sólo escribe el contenido de un archivo .json según el esquema especificado abajo. Evita el uso de markdown.

Piensa como docente y planifica un módulo de aprendizaje para ser impartido a un alumno.

[Contexto del módulo] = [[[
* Tipo de formación: Educación Superior
* Entidad académica: Referencias Académicas para Educación Superior
* Grado o Nivel: Universidad
]]]

El objetivo del módulo es: Desarrollar competencias en oratoria, liderazgo y manejo de grupos para aplicar estrategias efectivas en contextos profesionales y académicos.

Tipos de actividades:
1. Contenido/Teoría (type: content-theory)
  - Actividad para proporcionar conocimiento y comprensión en un área particular.
  specs: {objective: string}

2. Conversación (type: character-talk)
  - Conversación con un personaje de ficción, como por ejemplo de un libro o una película.
  specs: {objective: string}

3. Debate (type: debate)
  - Debate individual con el docente.
  specs: {objective: string}

4. Opción múltiple (type: multiple-choice)
  - Actividad de opción múltiple
  specs: {objective: string, related: string}
  - Propiedad 'related' es siempre una actividad de content-theory, el valor corresponde al índice (base 0) del array de actividades.

5. Hablado (type: spoken)
  - Actividad oral para demostrar conocimientos y comprensión en un área particular.
  specs: {objective: string}

En aquellas actividades que se requiere la propiedad 'objective', establecer claramente qué se espera que los alumnos logren con la actividad.

Instrucciones clave:
El módulo consiste en 5 actividades.


Genere el módulo en formato JSON con la siguiente estructura:
{module: {title: string, description: string, pictureSuggestions: string}, activities: {type: string, specs: object}[]}
Donde:
  - Propiedad 'pictureSuggestions': enfócate en describir detalladamente la escena visual para la generación de imágenes con DALL-E 3, evita incluir detalles no visuales.
  - Propiedad 'specs' cumple con la especificación asociada a la actividad.
  - Asegúrate que los valores de las propiedades estén escritos en idioma español.`,
	objective: `Evita el pre-text y el post-text, no hagas comentarios, sugerencias o aclaraciones. Sólo escribe el contenido de un archivo .json según el esquema especificado abajo. Evita el uso de markdown.

Mejora el siguiente [OBJETIVO] de un módulo de aprendizaje.
Cuando definas las sugerencias, enfócate siempre en la aplicabilidad concreta de la audiencia objetivo.

[Contexto del módulo] = [[[
* Tipo de formación: Educación Superior
* Entidad académica: Referencias Académicas para Educación Superior
* Grado o Nivel: Universidad
]]]

OBJETIVO = [[
Desarrollar competencias en oratoria, liderazgo y manejo de grupos para aplicar estrategias efectivas en contextos profesionales y académicos.
]]

* json format: {irrelevant: boolean, improved: string, suggestions: {reference: string, suggestion: string}[]}

Donde:
  * improved: Asegúrate que el [OBJETIVO] evite el uso de pronombres personales. Usa estructuras como la voz pasiva, infinitivos, y expresiones generales.
  * suggestions: Indica 3 sugerencias para que el [OBJETIVO] del módulo se ajuste a los objetivos del plan educativo. Si el [OBJETIVO] del módulo no tiene sentido para ser dictado en el aula, o no guarda relación con los objetivos educativos del país o provincia, simplemente devuelve una respuesta vacía.
  * suggestions.reference: Escribe una descripción corta sobre el [OBJETIVO] según figura en los requisitos académicos definidos para la audiencia del módulo.
  * suggestions.suggestion: Escribe una descripción corta de cómo mejorarías el [OBJETIVO] del módulo. La recomendación debe estar basada en teoría, o habilidades que el alumno debe desarrollar. No te enfoques en qué se debe hacer, sino en qué se debe aprender. Identifica los resultados deseados del aprendizaje y redacta una declaración clara y específica que describa lo que se espera que los estudiantes logren al finalizar el módulo, asegurándote de que sea medible y relevante.
  * irrelevant: Debe ser true si el [OBJETIVO] del módulo no tiene sentido para ser dictado en el aula.`
};
