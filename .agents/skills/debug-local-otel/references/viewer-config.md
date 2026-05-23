# Viewer Config

Fetch `otel-gui` runtime configuration and persistence status.

```http
GET /api/config HTTP/1.1
Host: localhost:4318
Accept: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "maxTraces": 1000,
  "persistence": {
    "mode": "memory"
  }
}
```
