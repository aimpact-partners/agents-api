const objective_openai_call = {
	url: `https://api.openai.com/v1/chat/completions`,
	specs: {
		model: 'gpt-4.1-mini-2025-04-14',
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
	response: {
		irrelevant: false,
		improved:
			'Fortalecer competencias en oratoria, liderazgo y gestión de grupos para la implementación de estrategias efectivas en contextos profesionales y académicos.',
		suggestions: [
			{
				reference: 'Competencias transversales en comunicación y liderazgo en educación superior.',
				suggestion:
					'Incluir el desarrollo de habilidades para la comunicación persuasiva y el liderazgo ético, con énfasis en la resolución de conflictos y motivación de equipos en entornos reales.'
			},
			{
				reference:
					'Objetivos de formación integral enfocados en habilidades blandas para graduados universitarios.',
				suggestion:
					'Precisar el aprendizaje de técnicas específicas para la planeación, ejecución y evaluación de presentaciones orales en proyectos académicos y profesionales.'
			},
			{
				reference: 'Requisitos de contextualización laboral en planes formativos universitarios.',
				suggestion:
					'Orientar el objetivo a la aplicación práctica de estrategias efectivas para el liderazgo y manejo de grupos en situaciones laborales y académicas concretas, favoreciendo la transferencia del aprendizaje.'
			}
		]
	}
};
