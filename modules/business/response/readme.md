# Response Module

## Overview

The `Response` module provides a standard way of encapsulating data and error messages returned by API calls. It uses
the `ModelError` class from the `Errors` module for error handling.

## Features

-   Unified response object for data and errors.
-   Read-only properties for data, status, and errors.
-   JSON serialization support.

## Usage

To use this module in your project, import it as follows:

```typescript
import { Response } from '@aimpact/ailearn-api/response';
```

### Creating a Response Object

You can create a `Response` object as shown below:

```typescript
const response = new Response({ error: someError, data: someData });
```
