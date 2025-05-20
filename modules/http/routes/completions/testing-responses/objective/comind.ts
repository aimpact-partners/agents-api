const objective_comind_call = {
	url: `https://dev.co-mind.ai:44310/v1/chat/completions`,
	specs: {
		model: 'falcon3:3b',
		messages: [
			{
				role: 'system',
				content:
					'Evita el pre-text y el post-text, no hagas comentarios, sugerencias o aclaraciones. Sólo escribe el contenido de un archivo .json según el esquema especificado abajo. Evita el uso de markdown.\n\nMejora el siguiente [OBJETIVO] de un módulo de aprendizaje.\nCuando definas las sugerencias, enfócate siempre en la aplicabilidad concreta de la audiencia objetivo.\n\n[Contexto del módulo] = [[[\n* Tipo de formación: Educación Superior\n* Entidad académica: Referencias Académicas para Educación Superior\n* Gr…] del módulo. La recomendación debe estar basada en teoría, o habilidades que el alumno debe desarrollar. No te enfoques en qué se debe hacer, sino en qué se debe aprender. Identifica los resultados deseados del aprendizaje y redacta una declaración clara y específica que describa lo que se espera que los estudiantes logren al finalizar el módulo, asegurándote de que sea medible y relevante.\n * irrelevant: Debe ser true si el [OBJETIVO] del módulo no tiene sentido para ser dictado en el aula.'
			},
			{
				role: 'user',
				content: 'Desarrollar competencias en oratoria, liderazgo y manejo de grupos'
			}
		]
	},
	response:
		'```json\n{\n  "irrelevant": false,\n  "improved": "Asegurar las habilidades necesarias para la efectiva comunicación y colaboración en contextos profesionales.",\n  "suggestions": {\n    "reference": "Debe ser medible con referencias al desarrollo de habilidades lingüísticas, sociales y organizativas en estudiantes universitarios.",\n    "suggestion": "Reducción del enfoque a competencias más relevantes: comunicaciones efectivas y liderazgo sostenible. Para lograr esto, podría incluir aspectos como l…ión de recursos, resolución de problemas, capacidad de comunicación efectiva y colaboración interdisciplinaria.",\n    "suggestion": "Cambiar la frase para enfatizar competencias clave: \\"Asegurar las habilidades esenciales para abordar desafíos profesionales, destacando liderazgo y eficacia en equipos. Esto implica desarrollar capacidades como crítica constructiva, manejo digital avanzado, capacidad de planificación para proyectos, y integración de conocimientos interdisciplinarios."\n  }\n}\n```'
};
