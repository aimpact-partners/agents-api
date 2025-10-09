# Chats Collection

Este endpoint gestiona las operaciones sobre la colección completa de chats del usuario.

## Endpoints

### GET /chats

Obtiene todos los chats del usuario.

**Autenticación:** Bearer Token requerido

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": [
		{
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
	]
}
```

---

### POST /chats

Crea un nuevo chat.

**Autenticación:** Bearer Token requerido

**Request Body:**

```json
{
	"id": "00000-dd1c-4e5d-8e40-208981d9bd7b",
	"name": "My chat",
	"projectId": "ffdfjhjh-er-b155-8e71334-82c19",
	"uid": "123456789",
	"metadata": {
		"prompt": "topic-q&a"
	},
	"language": {
		"default": "es"
	}
}
```

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": {
		"id": "00000-dd1c-4e5d-8e40-208981d9bd7b",
		"name": "My chat",
		"synthesis": "summary text",
		"project": {
			"id": "02d991dd-8d57-42f3-b155-8e7133482c19",
			"name": "Project Name",
			"identifier": "project-identifier",
			"agent": {
				"url": "http://agent.example.com"
			}
		}
	}
}
```

---

### DELETE /chats

Elimina todos los chats del usuario.

**Autenticación:** Bearer Token requerido

**Respuesta exitosa (200):**

```json
{
	"status": true,
	"data": {
		"deleted": ["12345", "67890"]
	}
}
```

---

## Schemas

### IChatBase

-   `id` (string): Identificador único del chat
-   `name` (string): Nombre del chat
-   `metadata` (object): Metadatos adicionales
-   `parent` (string): ID del chat padre
-   `children` (string): ID de chats hijos
-   `language` (object): Configuración de idioma
    -   `default` (string): Idioma por defecto
-   `user` (IUserBase): Información del usuario
-   `messages` (object): Información de mensajes
    -   `count` (number): Cantidad de mensajes
    -   `lastTwo` (array): Últimos dos mensajes

### Error

-   `code` (number): Código de error HTTP
-   `text` (string): Descripción del error

---

**Referencia OpenAPI:** [Ver especificación completa](../openapi/chats/index.yaml)
