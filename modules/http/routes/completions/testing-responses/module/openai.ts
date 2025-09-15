const module_openai_call = {
	url: `https://api.openai.com/v1/chat/completions`,
	specs: {
		model: 'gpt-4.1-mini-2025-04-14',
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
			title: 'Oratoria, Liderazgo y Manejo de Grupos en Contextos Profesionales y Académicos',
			description:
				'Este módulo tiene como objetivo desarrollar competencias en oratoria, liderazgo y manejo de grupos para que los estudiantes puedan aplicar estrategias efectivas en sus entornos profesionales y académicos.',
			pictureSuggestions:
				'Una sala de conferencias moderna con un grupo diverso de estudiantes universitarios participando activamente. En primer plano, un estudiante está hablando con confianza frente a un auditorio, mientras otros toman notas y observan atentos. El ambiente es dinámico y profesional, con elementos visuales como pizarras, laptops y micrófonos.'
		},
		activities: [
			{
				type: 'content-theory',
				specs: {
					objective:
						'Proporcionar conocimientos fundamentales sobre técnicas de oratoria, principios de liderazgo y dinámicas de manejo de grupos.'
				}
			},
			{
				type: 'multiple-choice',
				specs: {
					objective:
						'Evaluar la comprensión de los conceptos básicos de oratoria y liderazgo presentados en la actividad previa.',
					related: '0'
				}
			},
			{
				type: 'character-talk',
				specs: {
					objective:
						'Interactuar con un personaje ficticio experto en liderazgo para analizar situaciones reales y aplicar estrategias efectivas de manejo de grupos.'
				}
			},
			{
				type: 'spoken',
				specs: {
					objective:
						'Demostrar habilidades oratorias mediante la presentación oral de un tema relacionado con liderazgo y manejo de grupos.'
				}
			},
			{
				type: 'debate',
				specs: {
					objective:
						'Defender y argumentar estrategias de liderazgo y manejo de grupos en un debate individual con el docente, fortaleciendo el pensamiento crítico y la capacidad de persuasión.'
				}
			}
		]
	}
};
