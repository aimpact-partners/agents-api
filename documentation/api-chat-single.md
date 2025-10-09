# Single Chat

Este endpoint gestiona las operaciones sobre un chat específico.

## Endpoints

### GET /chats/{id}

Obtiene los detalles de un chat específico.

**Parámetros:**

-   `id` (path, required): Identificador único del chat

**Autenticación:** Bearer Token requerido

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": {
		"id": "12345",
		"name": "General Chat",
		"metadata": {},
		"parent": "parent123",
		"children": "children123",
		"language": {
			"default": "en"
		},
		"user": {
			"uid": "uid123",
			"id": "id123",
			"name": "John Doe",
			"displayName": "John",
			"email": "john.doe@example.com",
			"photoURL": "http://example.com/photo.jpg",
			"phoneNumber": 1234567890
		},
		"messages": {
			"count": 2,
			"lastTwo": [
				{
					"role": "user",
					"content": "Hello",
					"synthesis": "Summary"
				}
			]
		}
	}
}
```

**Respuesta de error (404):**

```json
{
	"status": false,
	"error": {
		"code": 404,
		"text": "Not Found"
	}
}
```

---

### DELETE /chats/{id}

Elimina un chat específico.

**Parámetros:**

-   `id` (path, required): Identificador único del chat

**Autenticación:** Bearer Token requerido

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
		"text": "Not Found"
	}
}
```

---

## Schemas

### IChatBase

Estructura completa de un chat con toda su información asociada.

### Error

-   `code` (number): Código de error HTTP
-   `text` (string): Descripción del error

---

**Referencia OpenAPI:** [Ver especificación completa](../openapi/chats/chat.yaml)
