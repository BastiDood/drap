# Recent Trace Summaries

List recent trace summaries. Use `limit` to control how many summaries are returned.

```http
GET /api/traces?limit=25 HTTP/1.1
Host: localhost:4318
Accept: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "traceId": "trace-id",
    "rootSpanName": "GET /dashboard",
    "serviceName": "drap",
    "spanCount": 12,
    "logCount": 3,
    "hasError": false,
    "startTimeUnixNano": "1760000000000000000",
    "endTimeUnixNano": "1760000001000000000"
  }
]
```
