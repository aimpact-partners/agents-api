# About the Prompts

## Prompts

### Projects

### Languages

-   global
-   by project

### Literals

-   Pure literals
-   Dependencies:
-       Another prompt (ex: %HEADER)
-       Options: create and select

### Prompts categories: CRUD

```typescript
{
	name: string;
	prompts: {
		id: string;
		name: string;
	}
}
```

### Attributes

-   project
-   category
-   name
-   format: json (one phase / two phases) or text
-   is: can be 'prompt' or 'function'

### Functions

### Endpoints

```typescript
[execute: string, functions: {name: endpoint}]
```

## Tasks / Workflows

```typescript
{
	name: string;
	workflow: [{ prompt: string, apiCall: string }];
}
```
