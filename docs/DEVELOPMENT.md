# Development Configuration

## Logging Control

The application now has much quieter logging during development to reduce noise. Here's how to control logging levels:

### Default Development Logging

By default in development (`NODE_ENV=development`), the app will:
- ✅ Only show errors and warnings
- ✅ Skip HTTP request logging (clean console)
- ✅ Skip verbose auth activity logging
- ✅ Only log auth errors in a minimal format

### Environment Variables

You can control logging behavior with these environment variables:

```bash
# Set log level (error, warn, info, debug, trace)
LOG_LEVEL=error

# Enable HTTP request logging
ENABLE_HTTP_LOGGING=true

# Set HTTP logging verbosity (simple, detailed, verbose)
HTTP_LOG_LEVEL=simple

# Enable detailed auth activity logging
ENABLE_AUTH_LOGGING=true
```

### HTTP Logging Levels

- **`simple`** (default): Clean one-line logs with color-coded status
- **`detailed`**: Includes request/response headers and query parameters
- **`verbose`**: Full pino HTTP logging with complete request/response objects

### Quick Commands

**Minimal logging (recommended for development):**
```bash
pnpm dev
```

**Enable simple HTTP logging:**
```bash
ENABLE_HTTP_LOGGING=true pnpm dev
# OR
ENABLE_HTTP_LOGGING=true HTTP_LOG_LEVEL=simple pnpm dev
```

**Enable detailed HTTP logging with headers:**
```bash
ENABLE_HTTP_LOGGING=true HTTP_LOG_LEVEL=detailed pnpm dev
```

**Enable verbose HTTP logging (full JSON objects):**
```bash
ENABLE_HTTP_LOGGING=true HTTP_LOG_LEVEL=verbose pnpm dev
```

### HTTP Log Examples

**Simple (default):**
- `🟢 GET /api/vehicles 200 - 32ms`
- `🔴 GET /api/invalid 404 - 2ms`
- `🟡 POST /auth/login 302 - 45ms`

**Detailed:**
- Shows request/response headers and query parameters
- `➡️ GET /api/vehicles` with headers/query object
- `⬅️ 🟢 GET /api/vehicles 200 - 32ms` with response headers

**Verbose:**
- Full pino HTTP logging with complete request/response objects
- JSON formatted with all details

**Enable all logging:**
```bash
ENABLE_HTTP_LOGGING=true ENABLE_AUTH_LOGGING=true pnpm dev
```

**Debug level logging:**
```bash
LOG_LEVEL=debug pnpm dev
```

### What Changed

1. **HTTP Logging**: Disabled by default with three verbosity levels when enabled
2. **Auth Logging**: Simplified to only show errors in development
3. **Log Level**: Set to 'error' by default in development
4. **User Creation**: Only logs in production or when explicitly enabled
5. **Request Format**: Configurable from simple color-coded to full verbose JSON

### Production Behavior

In production (`NODE_ENV=production`), all logging is enabled by default for proper monitoring and audit trails.
