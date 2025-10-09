# Prompt Operations

Este endpoint gestiona las operaciones sobre un prompt template específico.

## Endpoints

### GET /prompts/{id}

Obtiene un prompt template específico.

**Parámetros:**

-   `id` (path): Compuesto por `projectIdentifier.promptName` (ejemplo: `myProject.myPrompt`)

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
			"pure": ["literal1", "literal2"],
			"dependencies": ["dep1"],
			"metadata": ["meta1"]
		},
		"project": {
			"identifier": "my-project",
			"name": "My Project",
			"id": "02d991dd-8d57-42f3-b155-8e7133482c19"
		}
	}
}
```

**Respuesta de error (400):**

```json
{
	"status": false,
	"error": "Prompt not found"
}
```

---

### PUT /prompts/{id}

Actualiza un prompt template existente.

**Parámetros:**

-   `id` (path): Compuesto por `projectIdentifier.promptName`

**Request Body:** Similar al POST de creación

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": {
		// Datos actualizados del prompt
	}
}
```

**Respuesta de error (400):**

```json
{
	"status": false,
	"error": "Invalid data or prompt not found"
}
```

---

### DELETE /prompts/{id}

Elimina un prompt template.

**Parámetros:**

-   `id` (path): Compuesto por `projectIdentifier.promptName`

**Request Body:**

```json
{
	"value": "confirmation-string"
}
```

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": {
		"deleted": true
	}
}
```

**Respuesta de error (400):**

```json
{
	"status": false,
	"error": "Confirmation value mismatch or prompt not found"
}
```

---

## Formato del ID

El ID del prompt está compuesto por:

```
projectIdentifier.promptName
```

**Ejemplo:**

```
myProject.customerSupport
```

Esto permite:

-   Identificar rápidamente a qué proyecto pertenece el prompt
-   Mantener nombres de prompts únicos dentro de cada proyecto
-   Facilitar la organización y búsqueda

---

## Schemas

### IPromptTemplateData

-   `id` (string): ID único del prompt
-   `name` (string): Nombre descriptivo
-   `identifier` (string): Identificador único
-   `description` (string): Descripción del prompt
-   `language` (object): Configuración multiidioma
-   `format` (enum): `json` | `text`
-   `is` (enum): `prompt` | `function` | `dependency`
-   `value` (string): Contenido del prompt
-   `options` (array): Opciones de configuración
-   `literals` (object): Literales y dependencias extraídos
    -   `pure` (array): Literales puros
    -   `dependencies` (array): Dependencias de otros prompts
    -   `metadata` (array): Metadatos
-   `project` (object): Proyecto asociado

---

**Referencia OpenAPI:** [Ver especificación completa](../../../openapi/prompts/index.yaml)
