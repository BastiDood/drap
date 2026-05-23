# Route Trace Triage

List recent traces, fetch candidate trace details, then filter spans client-side by span name, `http.route`, or `url.path`.

```http
GET /api/traces?limit=100 HTTP/1.1
Host: localhost:4318
Accept: application/json
```

```http
GET /api/traces/{traceId} HTTP/1.1
Host: localhost:4318
Accept: application/json
```
