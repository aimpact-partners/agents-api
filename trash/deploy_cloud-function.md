# Para publicar la cloud function `/upload`

La funcion se encarga de:

-   Cargar un audio al bucket
-   Solicitar la transcripcion a OpenAI
-   Hacer la llamada al agente

Parametros de retorno

```json
{
	"status": true,
	"data": {
		"file": "path on storage",
		"transcription": "transcription text",
		"output": "agent response",
		"message": "File uploaded successfully"
	}
}
```

## Actualizar el params del package.json por las urls de las cloud functions

```json
{
	"params": {
		"AGENT_API": "https://us-central1-aimpact-partners-dev.cloudfunctions.net/agent"
	}
}
```

## Compilar con distribucion `node`
