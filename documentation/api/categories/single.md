# Single Category

Este endpoint gestiona las operaciones sobre una categoría específica.

## Endpoints

### GET /categories/{id}

Obtiene los detalles de una categoría específica.

**Parámetros:**

-   `id` (path, required): Identificador único de la categoría

**Autenticación:** Firebase ID Token

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

**Respuesta de error (404):**

```json
{
	"status": false,
	"error": {
		"code": 404,
		"text": "Not Found",
		"details": "Category not found"
	}
}
```

---

### PUT /categories/{id}

Actualiza una categoría existente.

**Parámetros:**

-   `id` (path, required): Identificador único de la categoría

**Autenticación:** Firebase ID Token

**Request Body:**

```json
{
	"name": "Updated Business",
	"description": "Updated business related prompts",
	"icon": "updated-business-icon",
	"color": "#0056b3"
}
```

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": {
		"id": "cat-123",
		"name": "Updated Business",
		"description": "Updated business related prompts",
		"icon": "updated-business-icon",
		"color": "#0056b3",
		"uid": "123456789",
		"createdAt": "2024-01-01T00:00:00Z",
		"updatedAt": "2024-01-02T00:00:00Z"
	}
}
```

**Respuesta de error (404):**

```json
{
	"status": false,
	"error": {
		"code": 404,
		"text": "Not Found",
		"details": "Category not found"
	}
}
```

---

### DELETE /categories/{id}

Elimina una categoría específica.

**Parámetros:**

-   `id` (path, required): Identificador único de la categoría

**Autenticación:** Firebase ID Token

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": {
		"deleted": true
	}
}
```

**Respuesta de error (404):**

```json
{
	"status": false,
	"error": {
		"code": 404,
		"text": "Not Found",
		"details": "Category not found"
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
-   `color` (string): Color en formato hexadecimal
-   `uid` (string): ID del usuario propietario
-   `createdAt` (string, date-time): Fecha de creación
-   `updatedAt` (string, date-time): Fecha de última actualización

### Error

-   `code` (number): Código de error HTTP
-   `text` (string): Descripción del error
-   `details` (string): Detalles adicionales

---

## Notas importantes

-   Al actualizar una categoría, solo se modifican los campos enviados en el request
-   Eliminar una categoría podría afectar a los prompts asociados, dependiendo de tu lógica de negocio
-   Los cambios en el color e icono se reflejan inmediatamente en la UI

---

**Referencia OpenAPI:** [Ver especificación completa](../../../openapi/categories/category.yaml)
