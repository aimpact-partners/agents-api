# Create Prompt

Este endpoint permite crear (publicar) nuevos prompts templates.

## Endpoint

### POST /prompts

Publica un nuevo prompt template.

**Request Body:**

```json
{
	"projectId": "02d991dd-8d57-42f3-b155-8e7133482c19",
	"name": "Customer Support Agent",
	"identifier": "customer-support",
	"description": "AI assistant for customer support",
	"language": {
		"default": "en",
		"languages": ["en", "es", "fr"]
	},
	"format": "json",
	"is": "prompt",
	"value": "You are a helpful customer support agent...",
	"categories": ["support", "customer-service"],
	"options": [
		{
			"id": "model",
			"value": "gpt-4"
		}
	]
}
```

**Campos requeridos:**

-   `projectId` (string): ID del proyecto
-   `name` (string): Nombre del prompt
-   `description` (string): Descripción del prompt
-   `language` (object): Configuración de idiomas
    -   `default` (string): Idioma por defecto
    -   `languages` (array): Lista de idiomas soportados
-   `format` (string): Formato de respuesta (`json` | `text`)
-   `is` (string): Tipo de prompt (`prompt` | `function` | `dependency`)

**Campos opcionales:**

-   `identifier` (string): Identificador único del prompt
-   `value` (string): Contenido del prompt
-   `categories` (array): Categorías asociadas
-   `options` (array): Opciones de configuración

---

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": {
		"id": "prompt-unique-id",
		"name": "Customer Support Agent",
		"identifier": "customer-support",
		"description": "AI assistant for customer support",
		"language": {
			"default": "en",
			"languages": ["en", "es", "fr"]
		},
		"format": "json",
		"is": "prompt",
		"value": "You are a helpful customer support agent...",
		"options": [
			{
				"id": "model",
				"value": "gpt-4"
			}
		],
		"literals": {
			"pure": [],
			"dependencies": [],
			"metadata": []
		},
		"project": {
			"identifier": "my-project",
			"name": "My Project",
			"id": "02d991dd-8d57-42f3-b155-8e7133482c19"
		}
	}
}
```

---

**Respuesta de error (400):**

```json
{
	"status": false,
	"error": "Missing required fields: name, description"
}
```

---

## Schemas

### IPromptTemplateData

Estructura completa de un prompt template:

-   `id` (string): ID único generado
-   `name` (string): Nombre del prompt
-   `identifier` (string): Identificador único
-   `description` (string): Descripción
-   `language` (object): Configuración de idiomas
-   `format` (enum): `json` | `text`
-   `is` (enum): `prompt` | `function` | `dependency`
-   `value` (string): Contenido del prompt
-   `options` (array): Opciones de configuración
-   `literals` (object): Literales extraídos
-   `project` (object): Información del proyecto asociado

### IPromptTemplateOptionData

-   `id` (string): ID de la opción
-   `value` (string): Valor de la opción

---

## Tipos de Prompts

### prompt

Prompt estándar que se ejecuta directamente.

### function

Prompt que actúa como una función reutilizable.

### dependency

Prompt que es utilizado como dependencia por otros prompts.

---

**Referencia OpenAPI:** [Ver especificación completa](../../../openapi/prompts/create.yaml)
