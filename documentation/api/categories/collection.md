# Categories Collection

Este endpoint gestiona las operaciones sobre la colección de categorías de prompts.

## Endpoints

### GET /categories

Obtiene todas las categorías de prompts.

**Autenticación:** Firebase ID Token

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": [
		{
			"id": "cat-123",
			"name": "Business",
			"description": "Business related prompts",
			"icon": "business-icon",
			"color": "#007bff",
			"uid": "123456789",
			"createdAt": "2024-01-01T00:00:00Z",
			"updatedAt": "2024-01-01T00:00:00Z"
		},
		{
			"id": "cat-456",
			"name": "Education",
			"description": "Educational prompts and tutorials",
			"icon": "education-icon",
			"color": "#28a745",
			"uid": "123456789",
			"createdAt": "2024-01-01T00:00:00Z",
			"updatedAt": "2024-01-01T00:00:00Z"
		}
	]
}
```

**Respuesta de error (404):**

```json
{
	"status": false,
	"error": {
		"code": 404,
		"text": "Not Found",
		"details": "No categories found"
	}
}
```

---

### POST /categories

Crea una nueva categoría de prompts.

**Autenticación:** Firebase ID Token

**Request Body:**

```json
{
	"name": "Business",
	"description": "Business related prompts",
	"icon": "business-icon",
	"color": "#007bff",
	"uid": "123456789"
}
```

**Campos requeridos:**

-   `name` (string): Nombre de la categoría
-   `uid` (string): ID del usuario

**Campos opcionales:**

-   `description` (string): Descripción de la categoría
-   `icon` (string): Icono de la categoría
-   `color` (string): Color en formato hexadecimal

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": {
		"id": "cat-123",
		"name": "Business",
		"description": "Business related prompts",
		"icon": "business-icon",
		"color": "#007bff",
		"uid": "123456789",
		"createdAt": "2024-01-01T00:00:00Z",
		"updatedAt": "2024-01-01T00:00:00Z"
	}
}
```

**Respuesta de error (400):**

```json
{
	"status": false,
	"error": {
		"code": 400,
		"text": "Bad Request",
		"details": "Missing required field: name"
	}
}
```

---

## Schemas

### ICategory

-   `id` (string): Identificador único de la categoría
-   `name` (string): Nombre de la categoría
-   `description` (string): Descripción de la categoría
-   `icon` (string): Icono de la categoría
-   `color` (string): Color en formato hexadecimal (#RRGGBB)
-   `uid` (string): ID del usuario propietario
-   `createdAt` (string, date-time): Fecha de creación
-   `updatedAt` (string, date-time): Fecha de última actualización

### Error

-   `code` (number): Código de error HTTP
-   `text` (string): Descripción del error
-   `details` (string): Detalles adicionales del error

---

## Notas importantes

-   Las categorías permiten organizar prompts de manera lógica
-   Cada categoría puede tener un color personalizado para facilitar la identificación visual
-   El campo `icon` puede referenciar cualquier sistema de iconos que uses en tu aplicación

---

**Referencia OpenAPI:** [Ver especificación completa](../../../openapi/categories/index.yaml)
