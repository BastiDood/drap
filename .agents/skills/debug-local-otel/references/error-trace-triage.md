# Error Trace Triage

List recent trace summaries, then filter client-side for summaries where `hasError` is `true`.

```http
GET /api/traces?limit=100 HTTP/1.1
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
    "hasError": true,
    "startTimeUnixNano": "1760000000000000000",
    "endTimeUnixNano": "1760000001000000000"
  }
]
```
