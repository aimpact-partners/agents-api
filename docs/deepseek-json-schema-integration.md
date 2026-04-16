# Integración de DeepSeek con schema JSON — Análisis y solución

> **Contexto**: endpoint `POST /chats/:id/messages`, path del IPE (Interaction Progress Evaluation) en `ActivityAgent.post`.
> **Problema observado**: con `LLM_PROVIDER=deepseek`, los mensajes del chat no se persisten en Firestore, mientras que con `LLM_PROVIDER=openai` funcionan correctamente, ejecutando exactamente el mismo prompt.
> **Estado**: resuelto. Implementado en Capa 1 + Capa 2.

---

## 1. Resumen ejecutivo

El IPE ejecuta dos prompts sobre cada interacción alumno/docente:

1. `ailearn.content-theory-summary` → genera el resumen de la conversación.
2. `ailearn.content-theory-ipe-v2` → evalúa el progreso de los objetivos y devuelve un JSON estructurado.

El segundo prompt tiene asociado un **JSON Schema** registrado en Firestore (`format: 'json_schema'`). Ese schema:
- Enumera los 6 campos obligatorios (`reached`, `objectives`, `summary`, `alert`, `interaction`, `knowledge`).
- Declara tipos exactos (`objectives` como `array`, `alert` como `string | false`, `status` como enum).

OpenAI recibe ese schema a nivel API vía `response_format: { type: 'json_schema', ... }` (Structured Outputs) y su compliance es **obligatorio**. DeepSeek **no soporta ese modo de API** y el caller descartaba el schema, mapeándolo a un simple `json_object`.

Resultado: DeepSeek producía JSON sintácticamente válido pero **estructuralmente incompatible** — por ejemplo, `objectives` como objeto keyed-by-name en lugar de array. El código consumidor en `IPE.process` hacía `.forEach` sobre eso y lanzaba `TypeError`, capturado como `parsingIPE` error. `ActivityAgent.post` cortaba antes de llamar `storeInteration` y el mensaje no se guardaba.

**La solución fue inyectar el schema como directiva del system prompt en el caller de DeepSeek** (Capa 1) y **normalizar defensivamente la respuesta** en el IPE antes de consumirla (Capa 2).

---

## 2. Flujo del endpoint y puntos de fallo

```
POST /chats/:id/messages
    └── ActivityAgent.processIncremental
        ├── ActivityAgent.pre            → prepara el prompt principal
        ├── promptTemplate.incremental   → llama al LLM para la respuesta al alumno (streaming)
        └── ActivityAgent.post
            ├── IPE.process              ← aquí ocurría el fallo
            │   ├── PromptTemplateExecutor.execute (summary)
            │   ├── PromptTemplateExecutor.execute (progress)
            │   └── forEach(response)    ← TypeError si objectives no es array
            ├── hook                      (skippeado si IPE retorna error)
            └── chat.storeInteration     ← NUNCA se ejecutaba en el caso DeepSeek
                ├── saveMessage (user)
                ├── saveMessage (assistant)
                ├── setLastInteractions
                └── saveIPE
```

`IPE.process` retorna `{ error }` cuando el parseo falla. En `ActivityAgent.post`:

```ts
const response = await IPE.process(chat, prompt, answer);
if (response.error) return { error: response.error };   // ← corta acá
// ...
await chat.storeInteration(...);   // nunca se llama
```

Por eso en los logs de DeepSeek nunca aparecían los logs de `[storeInteration:deepseek]`.

---

## 3. Diagnóstico — logs comparados

Se instrumentaron logs en cinco puntos (`caller`, `executor`, `IPE.process`, `chat.storeInteration`, operaciones de save). Los resultados clave:

### 3.1 Request a OpenAI

```json
{
  "model": "gpt-5-mini",
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "ipe",
      "schema": {
        "type": "object",
        "properties": {
          "reached":    { "type": "array", "items": { "type": "string" } },
          "objectives": { "type": "array", "items": { ... } },
          "summary":    { "type": "string" },
          "alert":      { "anyOf": [ {"type":"string"}, {"type":"boolean","enum":[false]} ] },
          "interaction":{ "type": "string" },
          "knowledge":  { "anyOf": [ {"type":"string"}, {"type":"boolean","enum":[false]} ] }
        },
        "required": ["reached","objectives","summary","alert","interaction","knowledge"]
      }
    }
  }
}
```

### 3.2 Request a DeepSeek (antes del fix)

```json
{
  "model": "deepseek-chat",
  "response_format": { "type": "json_object" }
}
```

**El schema se perdía por completo.**

### 3.3 Respuesta de OpenAI (estructura correcta)

```json
{
  "reached": ["Otros Métodos"],
  "objectives": [
    { "name": "Otros Métodos", "expected": "...", "status": "in-progress" }
  ],
  "summary": "...",
  "alert": false,
  "interaction": "...",
  "knowledge": "..."
}
```

### 3.4 Respuesta de DeepSeek (estructura divergente)

```json
{
  "reached": ["Otros Métodos"],
  "objectives": {
    "Otros Métodos": {
      "expected": "...",
      "status": "in-progress"
    }
  }
}
```

Sin el schema como guía, DeepSeek eligió una representación "razonable" (diccionario keyed-by-name) pero incompatible con el consumidor. Además, omitió los cuatro campos top-level (`summary`, `alert`, `interaction`, `knowledge`).

### 3.5 El crash

En `modules/business/agent/activity/ipe.ts` línea ~175:

```ts
iteration.objectives.forEach(obj => { ... });
```

Al ser `iteration.objectives` un objeto plano, `.forEach` no existe → `TypeError` → capturado como `parsingIPE` error → abort.

---

## 4. ¿Por qué OpenAI sí y DeepSeek no?

Son dos diferencias independientes, ambas relevantes:

### 4.1 Capacidades de API

- **OpenAI Structured Outputs**: `response_format: { type: 'json_schema', ... }` con enforcement a nivel API. El modelo no puede devolver un JSON que no cumpla el schema.
- **DeepSeek json_object**: solo garantiza sintaxis JSON válida. No admite schemas.

### 4.2 Sesgo del entrenamiento

Incluso sin schema, GPT-4/4o tiende a producir campos implícitos porque su RLHF lo premia por respuestas "completas". DeepSeek-chat es más literal: entrega exactamente lo que el prompt pide, ni más ni menos.

Cuando el prompt de IPE dice textualmente *"si ninguno ha sido alcanzado, objectives debe ser false"* y no enumera qué otras claves deben estar, DeepSeek no las inventa.

**Conclusión**: el prompt estaba infra-especificado y dependía del sesgo generoso de OpenAI. La adopción de DeepSeek expuso esa deuda. La solución correcta es hacer el contrato **explícito** (vía schema) para cualquier provider.

---

## 5. Solución implementada

### Capa 1 — Schema injection en el caller de DeepSeek

**Archivo**: `modules/business/models/deepseek/caller/index.ts`

Cuando el executor llama con `responseFormat: 'json_schema'` y provee un `schema`, se inyecta el schema completo como parte del system message. DeepSeek lo lee como instrucción y produce la estructura esperada.

**Piezas**:

```ts
const JSON_SCHEMA_DIRECTIVE_HEADER =
    'STRICT_JSON_SCHEMA: Your response MUST be a single JSON value that exactly matches the schema below. ' +
    'Return every required field using the exact field names, respecting types, enums, and array/object shapes. ' +
    'When the schema declares `type: "array"`, return a JSON array (not an object keyed by name). ' +
    'Do not include markdown, code fences, natural language, prefixes, or trailing commentary.';

function ensureSchemaDirective(messages, schema) {
    if (!schema) return;
    const directive = `${JSON_SCHEMA_DIRECTIVE_HEADER}\n\nJSON Schema:\n${JSON.stringify(schema, null, 2)}`;
    // prepend o append a system message
}

function applyJsonDirective(messages, params) {
    const schemaRequested = params.responseFormat === 'json_schema' || params.response?.format === 'json_schema';
    if (schemaRequested && params.schema) {
        ensureSchemaDirective(messages, params.schema);
        return;
    }
    ensureJsonDirective(messages);
}
```

Y en `generate` / `incremental`:

```ts
if (format.type === 'json_object') applyJsonDirective(messages, params);
```

### Capa 2 — Normalización defensiva en el IPE

**Archivo**: `modules/business/agent/activity/ipe.ts`

Antes de cualquier operación sobre `iteration.objectives`, se normaliza el caso objeto → array:

```ts
if (
    iteration?.objectives &&
    !Array.isArray(iteration.objectives) &&
    typeof iteration.objectives === 'object'
) {
    iteration.objectives = Object.entries(iteration.objectives).map(([name, value]) => ({
        name,
        ...(value as object)
    }));
}
```

Esto es un **guard de robustez**: incluso si el schema injection no es obedecido en algún caso extremo, el IPE no crashea.

### Capa 3 — Validaciones ya existentes pero relevantes

El caller de DeepSeek ya incluye, desde cambios previos de esta sesión:

- **`extractJson`**: strip de markdown fences y recorte al primer `{`/`[` y último `}`/`]` balanceado.
- **Retry con validación `JSON.parse`**: si el contenido devuelto no es JSON válido, reintenta hasta 5 veces con 5s de intervalo.

Estas dos no fueron parte del fix del schema pero son condición necesaria para robustez general del caller.

---

## 6. Temperatura condicional por provider

Durante la investigación se detectó otro conflicto: al bajar la temperatura a `0.3` (recomendación de DeepSeek para tareas estructuradas) rompía OpenAI con modelos reasoning (`gpt-5-mini` solo acepta `temperature: 1`).

**Archivo**: `modules/business/agent/activity/ipe.ts`

```ts
const temperature = (LLM_PROVIDER ?? 'openai').toLowerCase() === 'deepseek' ? 0.3 : 1;
```

---

## 7. Análisis de consumo y eficiencia

### 7.1 Tokens por llamada (prompt `progress`)

| Configuración | Input tokens | Output tokens |
|---|---|---|
| DeepSeek sin schema (broken) | ~1674 | ~365 |
| **DeepSeek con schema injection** | **~2474** | **~450-600** |
| OpenAI gpt-5-mini structured | ~1642 | ~1750 |

El schema agrega ~800 tokens de input. Output crece modestamente porque el modelo llena los campos requeridos.

### 7.2 Efecto del prompt caching de DeepSeek

DeepSeek cachea prefijos comunes automáticamente. El schema, inyectado al inicio del system message, **se cachea a partir del segundo request**. En logs reales se observan `prompt_cache_hit_tokens` > 1600 tokens en llamadas subsecuentes.

### 7.3 Costo por llamada

Tarifas DeepSeek (noviembre 2025):
- Input miss: $0.28/M
- Input hit: $0.028/M (90% descuento)
- Output: $0.42/M

| | Primera llamada | Llamadas cacheadas |
|---|---|---|
| DeepSeek sin schema | $0.00057 | $0.00021 |
| **DeepSeek con schema** | **$0.00082** | **$0.00024** |
| Delta por schema | +$0.00025 | +$0.00003 |
| OpenAI gpt-5-mini (comparativa) | $0.00391 | — |

**Conclusión**: el schema injection mantiene a DeepSeek ~16× más barato que OpenAI `gpt-5-mini`, con overhead de <$0.0003/call cacheada. En 100k mensajes: ~$3 extra vs los miles ahorrados respecto a OpenAI.

### 7.4 Latencia

- Schema injection: +20-50ms de procesamiento de input extra.
- Normalización defensiva: microsegundos.
- Retry por JSON inválido (solo en fallo): hasta 5 × 5s.

En el happy path la sobrecarga es despreciable.

---

## 8. Alternativas evaluadas y descartadas

| Alternativa | Por qué se descartó |
|---|---|
| **AJV + validación completa** | Nueva dependencia. Overkill para el problema actual. Agregar solo si las Capas 1+2 resultan insuficientes en tráfico real. |
| **Function calling como schema surrogate** | Invasivo; cambia el patrón de llamada del caller. No resuelve el caso del prompt `summary` que usa `text`. |
| **OpenAI para IPE, DeepSeek para chat principal** | Tira la razón de adoptar DeepSeek (ahorro de costos). |
| **Temperatura = 0** | Ya está en 0.3 para DeepSeek; bajar más no soluciona problemas estructurales. |
| **Modificar el prompt en Firestore para enumerar la estructura esperada** | Parche, no fix. Todo nuevo prompt con schema lo tendría que replicar manualmente. El fix a nivel de caller es sistémico. |

---

## 9. Validación del fix

### 9.1 Logs instrumentados para diagnóstico

Todos usan el tag `[<stage>:<provider>]` para permitir grep/diff entre corridas:

| Tag | Archivo | Qué muestra |
|---|---|---|
| `[LLM:<p>][request]` | `models/<p>/caller/index.ts` | Payload enviado al proveedor |
| `[LLM:<p>][response]` | `models/<p>/caller/index.ts` | Respuesta HTTP completa |
| `[IPE:<p>][raw]` | `agent/activity/ipe.ts` | `data.content` crudo |
| `[IPE:<p>][parsed]` | `agent/activity/ipe.ts` | Objeto tras `JSON.parse` |
| `[storeInteration:<p>][userData\|answer\|ipe\|metadata\|assistantData]` | `agent/chat/chat.ts` | Preparación del mensaje |
| `[storeInteration:<p>][saveMessage:user\|saveMessage:assistant\|setLastInteractions\|saveIPE]` | `agent/chat/chat.ts` | Resultado OK / ERROR de cada persistencia |

### 9.2 Prueba sugerida

1. **Corrida OpenAI** (baseline):
   ```bash
   # .env
   LLM_PROVIDER=openai
   LLM_MODEL=gpt-5-mini
   ```

2. **Corrida DeepSeek** (validación del fix):
   ```bash
   LLM_PROVIDER=deepseek
   LLM_MODEL=deepseek-chat
   ```

3. **Checks mínimos**:
   - En `[LLM:deepseek][request]` aparece el schema inyectado en el primer system message.
   - En `[IPE:deepseek][parsed]` el objeto tiene los 6 campos top-level.
   - En `[IPE:deepseek][parsed]` `objectives` es un array.
   - Los cuatro `saveMessage` / `setLastInteractions` / `saveIPE` imprimen `OK`.
   - El mensaje aparece en Firestore con `metadata.progress` completo.

---

## 10. Mantenimiento y trabajo futuro

### Cuándo agregar la Capa 3 (validación contra schema)

Si en producción se observa una tasa de errores `parsingIPE` > 1% en el provider DeepSeek, considerar:

- Parsear el schema (`params.schema`) y validar los `required` top-level tras `JSON.parse`.
- Si falla, reintentar con un mensaje adicional en el prompt que describa específicamente qué campo faltó.

Esta capa debe ser condicional por provider: OpenAI con Structured Outputs no la necesita.

### Cuándo revisar el caller

- Cuando DeepSeek lance soporte nativo para `json_schema` → migrar a ese modo y descartar la inyección como texto.
- Cuando se agregue un tercer provider (Claude, Gemini) → decidir por cada uno: ¿tiene enforcement nativo de schema? Si no, aplicar el mismo patrón.

### Riesgos conocidos

1. **Schema muy grande**: si el schema supera ~3-5k tokens, puede afectar latencia y exceder el budget de cache. Monitorear `prompt_tokens` en los logs.
2. **Schema dinámico**: si el schema cambia entre calls con el mismo prefijo, el cache hit se reduce. No es el caso actual.
3. **Directive collision**: si el prompt del usuario ya incluye instrucciones JSON contradictorias, puede haber conflicto. La directiva del schema va al inicio, priorizándose.

---

## 11. Archivos modificados

| Archivo | Cambio |
|---|---|
| `modules/business/models/deepseek/caller/index.ts` | **Capa 1**: `ensureSchemaDirective`, `applyJsonDirective`. También `extractJson` + retry con `JSON.parse` (fixes previos de la misma sesión). |
| `modules/business/agent/activity/ipe.ts` | **Capa 2**: normalización de `objectives` (array/object). **Temperatura condicional** por provider. **Logs** `[IPE:<p>][raw\|parsed]`. |
| `modules/business/agent/chat/chat.ts` | **Logs** de preparación de mensaje y resultados de save. |
| `modules/business/models/open-ai/caller/index.ts` | **Logs** `[LLM:openai][request\|response]` (simétricos con DeepSeek). |

---

## 12. Referencias

- [DeepSeek API — JSON Output](https://api-docs.deepseek.com/guides/json_mode)
- [DeepSeek API — Context Caching](https://api-docs.deepseek.com/guides/kv_cache)
- [OpenAI — Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [JSON Schema spec](https://json-schema.org/)

---

**Fecha del análisis**: 2026-04-16
**Autor**: investigación conjunta (sesión con Claude Code)
**Branch**: `development`
