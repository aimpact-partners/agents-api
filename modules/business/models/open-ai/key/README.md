# OpenAIKey

This is a TypeScript class designed to handle the management of an OpenAI API key. The class provides methods for
obtaining and setting the key, and it makes use of the `dotenv` library to securely load environment variables.

## Example

```typescript
// Import the OpenAIKey class
import { OpenAIKey } from '@aimpact/agents-client/openai-key';

// Create an instance of the class
const openaiKeyInstance = new OpenAIKey();

// Get the OpenAI API key
const apiKey = await openaiKeyInstance.get();

if (apiKey) console.log('API key:', apiKey);
else console.error('Failed to obtain the API key.');
```

### In this example

1. Import and create an instance of the `OpenAIKey` class.
2. Use the `get` method to obtain the OpenAI API key. If it's already stored, it returns it; otherwise, it uses `dotenv`
   to load environment variables and obtains the key from `process.env.OPEN_AI_KEY` (if you are running the code on the
   server side, for example, in a Node.js environment).
3. Check if the key was obtained successfully, and if so, display it in the console. Otherwise, display an error
   message.

## Set a New API Key from the Client

Use the `set` method to set a new API key from the client. This is useful when you need to dynamically change the key
from your application.

```typescript
import { OpenAIKey } from '@aimpact/agents-client/openai-key';
const newApiKey = 'your_new_key';
openaiKeyInstance.set(newApiKey);
console.log('New API key set:', openaiKeyInstance.get());
```

## NOTES

It is recommended to configure a `.env` file with the `OPEN_AI_KEY` variable to securely store the API key. If you are
running the code on the server side, the value of `OPEN_AI_KEY` will be automatically taken from the environment
variables.
