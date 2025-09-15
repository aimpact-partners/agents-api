const module_comind_call = {
	url: `https://dev.co-mind.ai:44310/v1/chat/completions`,
	specs: {
		model: 'falcon3:3b',
		messages: [
			{
				role: 'system',
				content: `Evita el pre-text y el post-text, no hagas comentarios, sugerencias o aclaraciones. Sólo escribe el contenido de un archivo .json según el esquema especificado abajo. Evita el uso de markdown.

Mejora el siguiente [OBJETIVO] de un módulo de aprendizaje.
Cuando definas las sugerencias, enfócate siempre en la aplicabilidad concreta de la audiencia objetivo.

[Contexto del módulo] = [[[
* Tipo de formación: Educación Superior
* Entidad académica: Referencias Académicas para Educación Superior
* Grado o Nivel: Universidad
]]]

OBJETIVO = [[
Desarrollar competencias en oratoria, liderazgo y manejo de grupos
]]

* json format: {irrelevant: boolean, improved: string, suggestions: {reference: string, suggestion: string}[]}

Donde:
  * improved: Asegúrate que el [OBJETIVO] evite el uso de pronombres personales. Usa estructuras como la voz pasiva, infinitivos, y expresiones generales.
  * suggestions: Indica 3 sugerencias para que el [OBJETIVO] del módulo se ajuste a los objetivos del plan educativo. Si el [OBJETIVO] del módulo no tiene sentido para ser dictado en el aula, o no guarda relación con los objetivos educativos del país o provincia, simplemente devuelve una respuesta vacía.
  * suggestions.reference: Escribe una descripción corta sobre el [OBJETIVO] según figura en los requisitos académicos definidos para la audiencia del módulo.
  * suggestions.suggestion: Escribe una descripción corta de cómo mejorarías el [OBJETIVO] del módulo. La recomendación debe estar basada en teoría, o habilidades que el alumno debe desarrollar. No te enfoques en qué se debe hacer, sino en qué se debe aprender. Identifica los resultados deseados del aprendizaje y redacta una declaración clara y específica que describa lo que se espera que los estudiantes logren al finalizar el módulo, asegurándote de que sea medible y relevante.
  * irrelevant: Debe ser true si el [OBJETIVO] del módulo no tiene sentido para ser dictado en el aula.`
			},
			{
				role: 'user',
				content: 'Desarrollar competencias en oratoria, liderazgo y manejo de grupos'
			}
		]
	},
	response: {
		module: {
			title: 'Oratoria, Liderazgo y Gestión de Grupos Profesionales',
			description:
				'Este módulo busca desarrollar habilidades comunicativas y liderazantes para aplicarse en contextos profesionales.',
			pictureSuggestions:
				'[Scene of students in a vibrant classroom, engaged in discussions and group activities. Soft background music plays to create an inspiring atmosphere.]'
		},
		activities: [
			{
				type: 'content-theory',
				objective:
					'Incluir al menos tres referencias académicas relevantes para el desarrollo de habilidades oratorias y liderazgo.'
			},
			{
				type: 'character-talk',
				objective: 'Practicar responder preguntas con autoridad en una conversación ficticia.',
				specs: { source: 'La película "El poder del líder"' }
			},
			{
				type: 'debate',
				objective: 'Resolver un dilema ético sobre la responsabilidad de líderes universitarios.'
			},
			{ type: 'multiple-choice', objective: 'Identificar los mejores métodos para liderar grupos.', related: 0 },
			{
				type: 'spoken',
				objective: 'Expresar y justificar una estrategia personal para mejorar habilidades oratorias.'
			}
		]
	}
};
