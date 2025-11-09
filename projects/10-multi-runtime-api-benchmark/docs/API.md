# API Dokumentation

## Base URLs

Nach dem Deployment:
```
https://{api-id}.execute-api.{region}.amazonaws.com/{environment}/
```

Beispiel:
```
https://abc123def.execute-api.us-east-1.amazonaws.com/dev/
```

## Authentifizierung

Aktuell keine Authentifizierung erforderlich. In Produktion sollte API Key oder JWT implementiert werden.

## Common Headers

### Request Headers
```
Content-Type: application/json
X-Runtime: python|typescript|go|kotlin  (optional)
```

### Response Headers
```
Content-Type: application/json
Access-Control-Allow-Origin: *
```

## Endpoints

### Health Check

#### GET /health
Prüft den Status der Runtime.

**Request:**
```bash
curl -X GET https://api.example.com/dev/health
```

**Response: 200 OK**
```json
{
  "status": "healthy",
  "runtime": "python",
  "version": "3.11",
  "framework": "FastAPI + Mangum"
}
```

#### GET /{runtime}/health
Runtime-spezifischer Health Check.

**Beispiel:**
```bash
curl -X GET https://api.example.com/dev/python/health
curl -X GET https://api.example.com/dev/typescript/health
```

---

### Metrics

#### GET /metrics
Gibt Performance-Metriken der Runtime zurück.

**Request:**
```bash
curl -X GET https://api.example.com/dev/python/metrics
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "runtime": "python",
    "cold_start": false,
    "uptime_seconds": 120.5,
    "memory": {
      "rss_mb": 85.2,
      "vms_mb": 512.0
    },
    "python_version": "3.11.6",
    "environment": "dev",
    "lambda": {
      "function_name": "multi-runtime-benchmark-python-dev",
      "function_version": "$LATEST",
      "memory_limit_mb": "512",
      "log_group": "/aws/lambda/multi-runtime-benchmark-python-dev"
    }
  }
}
```

---

### Items CRUD

#### POST /items
Erstellt einen neuen Eintrag.

**Request:**
```bash
curl -X POST https://api.example.com/dev/python/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro",
    "description": "16-inch M3 Max",
    "price": 2499.99
  }'
```

**Request Body:**
```json
{
  "name": "string (required, max 100 chars)",
  "description": "string (optional, max 500 chars)",
  "price": "number (required, > 0)"
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "MacBook Pro",
    "description": "16-inch M3 Max",
    "price": 2499.99,
    "created_at": 1704067200000,
    "updated_at": 1704067200000
  },
  "message": "Item created successfully"
}
```

**Error Response: 400 Bad Request**
```json
{
  "success": false,
  "message": "Missing required fields: name and price"
}
```

---

#### GET /items
Listet alle Einträge auf.

**Request:**
```bash
curl -X GET "https://api.example.com/dev/python/items?limit=50"
```

**Query Parameters:**
- `limit` (optional): Maximale Anzahl Einträge (default: 100)

**Response: 200 OK**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "MacBook Pro",
      "description": "16-inch M3 Max",
      "price": 2499.99,
      "created_at": 1704067200000,
      "updated_at": 1704067200000
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "iPhone 15 Pro",
      "description": "256GB Titanium",
      "price": 1199.99,
      "created_at": 1704067300000,
      "updated_at": 1704067300000
    }
  ],
  "count": 2,
  "message": "Items retrieved successfully"
}
```

---

#### GET /items/{id}
Ruft einen einzelnen Eintrag ab.

**Request:**
```bash
curl -X GET https://api.example.com/dev/python/items/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "MacBook Pro",
    "description": "16-inch M3 Max",
    "price": 2499.99,
    "created_at": 1704067200000,
    "updated_at": 1704067200000
  },
  "message": "Item retrieved successfully"
}
```

**Error Response: 404 Not Found**
```json
{
  "success": false,
  "message": "Item not found: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

#### PUT /items/{id}
Aktualisiert einen bestehenden Eintrag (partielle Updates unterstützt).

**Request:**
```bash
curl -X PUT https://api.example.com/dev/python/items/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 2399.99,
    "description": "16-inch M3 Max - SALE!"
  }'
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "price": "number (optional, > 0)"
}
```

**Response: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "MacBook Pro",
    "description": "16-inch M3 Max - SALE!",
    "price": 2399.99,
    "created_at": 1704067200000,
    "updated_at": 1704067500000
  },
  "message": "Item updated successfully"
}
```

**Error Response: 404 Not Found**
```json
{
  "success": false,
  "message": "Item not found: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

#### DELETE /items/{id}
Löscht einen Eintrag.

**Request:**
```bash
curl -X DELETE https://api.example.com/dev/python/items/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Response: 200 OK**
```json
{
  "success": true,
  "message": "Item a1b2c3d4-e5f6-7890-abcd-ef1234567890 deleted successfully"
}
```

**Error Response: 404 Not Found**
```json
{
  "success": false,
  "message": "Item not found: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (only in dev/staging)"
}
```

### HTTP Status Codes

- **200 OK**: Erfolgreiche GET/PUT/DELETE Requests
- **201 Created**: Erfolgreiche POST Requests
- **400 Bad Request**: Ungültige Request Parameter oder Body
- **404 Not Found**: Ressource nicht gefunden
- **500 Internal Server Error**: Server-seitiger Fehler

---

## Beispiel Workflows

### Kompletter CRUD Workflow

```bash
# 1. Item erstellen
ITEM_ID=$(curl -X POST https://api.example.com/dev/python/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","price":99.99}' \
  | jq -r '.data.id')

# 2. Item abrufen
curl -X GET https://api.example.com/dev/python/items/$ITEM_ID | jq

# 3. Item aktualisieren
curl -X PUT https://api.example.com/dev/python/items/$ITEM_ID \
  -H "Content-Type: application/json" \
  -d '{"price":89.99}' | jq

# 4. Alle Items auflisten
curl -X GET https://api.example.com/dev/python/items | jq

# 5. Item löschen
curl -X DELETE https://api.example.com/dev/python/items/$ITEM_ID | jq
```

### Runtime Vergleich

```bash
# Python erstellen
curl -X POST https://api.example.com/dev/python/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Python Test","price":10.00}' \
  -w "\nTime: %{time_total}s\n"

# TypeScript erstellen
curl -X POST https://api.example.com/dev/typescript/items \
  -H "Content-Type: application/json" \
  -d '{"name":"TypeScript Test","price":10.00}' \
  -w "\nTime: %{time_total}s\n"

# Metrics vergleichen
curl https://api.example.com/dev/python/metrics | jq .data.memory
curl https://api.example.com/dev/typescript/metrics | jq .data.memory
```

---

## Rate Limits

Aktuell keine Rate Limits implementiert. API Gateway Standard Limits gelten:
- 10.000 Requests/Sekunde (Burst)
- 5.000 Requests/Sekunde (Steady State)

In Produktion sollten Custom Rate Limits implementiert werden.

---

## Versioning

Aktuell: v1.0.0 (keine Versionierung in URL)

Zukünftig geplant:
```
/v1/items
/v2/items
```

---

## Support

Bei Problemen oder Fragen:
- GitHub Issues: [Repository Link]
- CloudWatch Logs überprüfen
- Metrics Dashboard konsultieren
