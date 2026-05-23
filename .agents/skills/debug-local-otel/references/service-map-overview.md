# Service Map Overview

Fetch the aggregated service topology across stored traces.

```http
GET /api/service-map HTTP/1.1
Host: localhost:4318
Accept: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "nodes": [
    {
      "serviceName": "drap",
      "spanCount": 42,
      "errorCount": 0,
      "nodeType": "service"
    }
  ],
  "edges": [
    {
      "source": "drap",
      "target": "postgresql/postgres",
      "callCount": 8,
      "errorCount": 0,
      "p50Ms": 12,
      "p99Ms": 120
    }
  ]
}
```
