# Full Trace Detail

Fetch one complete trace, including its spans keyed by span ID.

```http
GET /api/traces/{traceId} HTTP/1.1
Host: localhost:4318
Accept: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "traceId": "trace-id",
  "rootSpanName": "GET /dashboard",
  "serviceName": "drap",
  "hasError": false,
  "spans": {
    "span-id": {
      "traceId": "trace-id",
      "spanId": "span-id",
      "parentSpanId": "",
      "name": "GET /dashboard",
      "attributes": {},
      "resource": {},
      "status": { "code": 0, "message": "" }
    }
  }
}
```
