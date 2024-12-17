# Para publicar el APP Engine de `chat-api`

## URL App Engine

[https://aimpact-partners-dev.ue.r.appspot.com/]

## Actualizar propiedades de urls cloud en la propiedad "params" del package.json

Hay 2 opciones

-   Actualizarlas en el `package.json`, previo a la compilacion

-   Actualizarlas en el archivo `config.js`, luego de la compilacion

```json
{
    "params": {
		...
        "AGENT_API": "https://us-central1-aimpact-partners-dev.cloudfunctions.net/agent"
		...
    }
}
```

## Compilar con distribucion `backend`

## Deploy

Dirigete a la raiz del repositorio `chat-api-engine`

[https://github.com/aimpact-partners/chat-api-engine.git]

-   Configurar archivo `app.yaml` en la raiz de la compilacion con las variables de entorno correspondientes, tomar
    plantilla del archivo `/sample-files/app.yaml`

-   Ubicarse en la raiz de la compilacion y ejecutar el comando `gcloud app deploy`
