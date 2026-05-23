# Correlated Trace Logs

Fetch logs associated with one trace. Use `limit` to cap returned log records.

```http
GET /api/traces/{traceId}/logs?limit=100 HTTP/1.1
Host: localhost:4318
Accept: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": "log-record-id",
    "traceId": "trace-id",
    "spanId": "span-id",
    "timeUnixNano": "1760000000000000000",
    "observedTimeUnixNano": "1760000000000000000",
    "severityNumber": 17,
    "severityText": "ERROR",
    "body": "log message"
  }
]
```
