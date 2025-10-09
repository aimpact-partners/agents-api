# Chat Messages

Este endpoint gestiona el envío de mensajes (texto y audio) en un chat específico.

## Endpoints

### POST /chats/{id}/messages

Envía un mensaje de texto en un chat.

**Parámetros:**

-   `id` (path, required): Identificador único del chat

**Autenticación:** Firebase ID Token

**Request Body:**

```json
{
	"id": "12345",
	"content": "Hello, this is a message",
	"systemId": "system123"
}
```

**Campos requeridos:**

-   `id` (string): Identificador del chat
-   `content` (string): Contenido del mensaje
-   `systemId` (string): Identificador del sistema

**Respuesta exitosa (200):**

-   Content-Type: `application/octet-stream`
-   Respuesta en formato binario (stream)

**Respuestas de error:**

**400 - Bad Request:**

```json
{
	"error": "Invalid request data"
}
```

**401 - Unauthorized:**

```json
{
	"error": "Authentication required"
}
```

---

### POST /chats/{id}/messages/audio

Envía un mensaje de audio en un chat.

**Parámetros:**

-   `id` (path, required): Identificador único del chat

**Autenticación:** Firebase ID Token

**Request Body (multipart/form-data):**

-   `id` (string, required): Identificador del chat
-   `systemId` (string, required): Identificador del sistema
-   `file` (binary, required): Archivo de audio

**Ejemplo de uso:**

```javascript
const formData = new FormData();
formData.append('id', '12345');
formData.append('systemId', 'system123');
formData.append('file', audioFile);

fetch('/chats/12345/messages/audio', {
	method: 'POST',
	headers: {
		Authorization: 'Bearer YOUR_FIREBASE_TOKEN'
	},
	body: formData
});
```

**Respuesta exitosa (200):**

-   Content-Type: `application/octet-stream`
-   Respuesta en formato binario (stream)

**Respuestas de error:**

**400 - Bad Request:**

```json
{
	"error": "Invalid file format or missing fields"
}
```

**401 - Unauthorized:**

```json
{
	"error": "Authentication required"
}
```

---

## Autenticación

Estos endpoints utilizan **Firebase ID Token** en lugar del Bearer Token estándar:

```http
Authorization: Bearer YOUR_FIREBASE_ID_TOKEN
```

---

## Notas importantes

-   Los mensajes se envían como streaming, por lo que la respuesta es binaria
-   Para mensajes de audio, asegúrate de usar el formato correcto (multipart/form-data)
-   El `systemId` identifica el sistema o cliente que está enviando el mensaje

---

**Referencia OpenAPI:** [Ver especificación completa](../../../openapi/chats/messages/messages.yaml)
