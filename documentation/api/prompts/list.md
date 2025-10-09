# List Prompts

Este endpoint obtiene la lista de prompts templates de un proyecto.

## Endpoint

### GET /prompts

Obtiene los prompts templates de un proyecto.

**Parámetros de Query:**

-   `is` (opcional): Filtra por tipo de prompt
    -   Valores posibles: `prompt`, `function`, `dependency`

**Ejemplo de uso:**

```http
GET /prompts?is=prompt
GET /prompts?is=function
GET /prompts
```

---

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": {
		"items": [
			{
				"id": "prompt-1",
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
			},
			{
				"id": "prompt-2",
				"name": "Data Validator",
				"identifier": "data-validator",
				"description": "Function to validate data structures",
				"language": {
					"default": "en",
					"languages": ["en"]
				},
				"format": "json",
				"is": "function",
				"value": "Validate the following data...",
				"options": [],
				"literals": {
					"pure": ["schema"],
					"dependencies": [],
					"metadata": []
				},
				"project": {
					"identifier": "my-project",
					"name": "My Project",
					"id": "02d991dd-8d57-42f3-b155-8e7133482c19"
				}
			}
		]
	}
}
```

---

**Respuesta de error (400):**

```json
{
	"status": false,
	"error": "Invalid filter parameter"
}
```

---

## Filtrado por Tipo

### prompt

Lista solo los prompts estándar que se ejecutan directamente.

**Ejemplo:**

```http
GET /prompts?is=prompt
```

### function

Lista solo los prompts que actúan como funciones reutilizables.

**Ejemplo:**

```http
GET /prompts?is=function
```

### dependency

Lista solo los prompts que son utilizados como dependencias.

**Ejemplo:**

```http
GET /prompts?is=dependency
```

### Sin filtro

Lista todos los prompts del proyecto, independientemente de su tipo.

**Ejemplo:**

```http
GET /prompts
```

---

## Schemas

### IResponseList

-   `status` (boolean): Estado de la respuesta
-   `data` (object):
    -   `items` (array): Lista de prompts
        -   Cada item es un `IPromptTemplateData`

### IPromptTemplateData

-   `id` (string): ID único
-   `name` (string): Nombre del prompt
-   `identifier` (string): Identificador único
-   `description` (string): Descripción
-   `language` (object): Configuración de idiomas
-   `format` (enum): `json` | `text`
-   `is` (enum): `prompt` | `function` | `dependency`
-   `value` (string): Contenido del prompt
-   `options` (array): Opciones de configuración
-   `literals` (object): Literales extraídos
-   `project` (object): Información del proyecto

---

## Casos de Uso

### Listar todos los prompts de un proyecto

```javascript
const response = await fetch('/prompts', {
	headers: {
		Authorization: 'Bearer YOUR_TOKEN'
	}
});
const { data } = await response.json();
console.log(data.items);
```

### Filtrar solo prompts ejecutables

```javascript
const response = await fetch('/prompts?is=prompt', {
	headers: {
		Authorization: 'Bearer YOUR_TOKEN'
	}
});
```

### Filtrar solo funciones reutilizables

```javascript
const response = await fetch('/prompts?is=function', {
	headers: {
		Authorization: 'Bearer YOUR_TOKEN'
	}
});
```

---

**Referencia OpenAPI:** [Ver especificación completa](../../../openapi/prompts/list.yaml)
