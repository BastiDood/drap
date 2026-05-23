# Trace Span Inspection

Fetch full trace detail and inspect the `spans` object client-side. Filter spans by fields such as `status.code`, `name`, `attributes.http.route`, `attributes.url.path`, or `resource.service.name`.

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
  "spans": {
    "span-id": {
      "spanId": "span-id",
      "name": "GET /dashboard",
      "startTimeUnixNano": "1760000000000000000",
      "endTimeUnixNano": "1760000001000000000",
      "attributes": {
        "http.route": "/dashboard"
      },
      "status": {
        "code": 0
      }
    }
  }
}
```
