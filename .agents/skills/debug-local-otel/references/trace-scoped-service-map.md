# Trace-Scoped Service Map

Fetch service topology for one trace.

```http
GET /api/service-map?traceId={traceId} HTTP/1.1
Host: localhost:4318
Accept: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "nodes": [],
  "edges": []
}
```
