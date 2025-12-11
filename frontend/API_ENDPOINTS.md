# API Endpoints Reference

All API endpoints are POST requests and return standardized JSON responses.

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* endpoint-specific data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description for user"
}
```

---

## Accounts Sync API

**Endpoint:** `POST /api/accounts/sync`

**Purpose:** Trigger background synchronization of connected broker accounts. Should be called periodically (e.g., every hour) or on-demand.

**Request Body:**
```json
{
  "accountIds": ["acc_123", "acc_456"],  // Optional - sync specific accounts
  "force": false                          // Optional - skip cache check
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": 2,
    "failed": 0,
    "syncedAt": "2024-01-15T10:30:00Z",
    "nextSync": "2024-01-15T11:30:00Z"
  }
}
```

**Example Usage:**
```typescript
// app/dashboard/page.tsx (Server Component)
async function syncAccounts() {
  const response = await fetch('/api/accounts/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: true })
  })
  
  const result = await response.json()
  console.log(`Synced ${result.data.synced} accounts`)
}
```

---

## Alerts Test API

**Endpoint:** `POST /api/alerts/test`

**Purpose:** Send a test alert notification to verify alert configuration. Useful for testing alert delivery (Telegram, Discord, etc.).

**Request Body:**
```json
{
  "alertId": "alert_123",           // Required - alert to test
  "testType": "price",              // Optional - alert type to test
  "includeContext": true            // Optional - include sample data
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": true,
    "channel": "telegram",
    "messageId": "msg_12345",
    "sentAt": "2024-01-15T10:30:00Z"
  }
}
```

**Example Usage:**
```typescript
// components/AlertTest.tsx
'use client'

import { useState } from 'react'

export function AlertTestButton({ alertId }: { alertId: string }) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)

  const handleTest = async () => {
    setTesting(true)
    try {
      const response = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, includeContext: true })
      })

      const data = await response.json()
      setResult(data)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div>
      <button onClick={handleTest} disabled={testing}>
        {testing ? 'Testing...' : 'Test Alert'}
      </button>
      {result && (
        <div>
          {result.success ? '✓ Test sent successfully' : '✗ Test failed'}
        </div>
      )}
    </div>
  )
}
```

---

## Analytics Export API

**Endpoint:** `POST /api/analytics/export`

**Purpose:** Export trades, performance data, or journal entries in various formats. Useful for analysis in Excel/Python.

**Request Body:**
```json
{
  "exportType": "trades",           // Required: "trades" | "performance" | "journal"
  "format": "json",                 // Optional: "json" | "csv" | "xlsx" (default: json)
  "dateRange": {                    // Optional - filter by date
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "filters": {                      // Optional - type-specific filters
    "symbol": "EURUSD",
    "status": "closed"
  },
  "includeMetadata": true           // Optional - add summary stats (default: false)
}
```

**Response (JSON):**
```json
{
  "success": true,
  "data": {
    "format": "json",
    "itemCount": 150,
    "exportedAt": "2024-01-15T10:30:00Z",
    "items": [
      {
        "id": "trade_123",
        "symbol": "EURUSD",
        "tradeType": "BUY",
        "profitLoss": 50.25,
        "openTime": "2024-01-15T08:00:00Z",
        "closeTime": "2024-01-15T09:00:00Z"
      }
    ],
    "metadata": {
      "totalItems": 150,
      "totalPL": 2500.75,
      "averageTrade": 16.67
    }
  }
}
```

**Response (CSV/XLSX):** Returns binary file with appropriate headers

**Example Usage:**
```typescript
// components/ExportButton.tsx
'use client'

import { useState } from 'react'

export function ExportButton() {
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true)
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'trades',
          format,
          includeMetadata: true
        })
      })

      if (format === 'json') {
        const data = await response.json()
        console.log(`Exported ${data.data.itemCount} trades`)
      } else {
        // Download file
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `trades.${format}`
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <button onClick={() => handleExport('json')} disabled={exporting}>
        Export JSON
      </button>
      <button onClick={() => handleExport('csv')} disabled={exporting}>
        Export CSV
      </button>
    </div>
  )
}
```

---

## Custom Integration Patterns

### Background Sync on App Load
```typescript
// app/layout.tsx
import { syncAccounts } from '~/lib/server-utils'

export default async function RootLayout() {
  // Sync on page load (only in server components)
  // In reality, you'd want this on a schedule or triggered manually
  // await syncAccounts()

  return (
    <html>
      <body>{/* ... */}</body>
    </html>
  )
}
```

### Periodic Sync with Cron
```typescript
// This would be in a separate cron service (e.g., node-cron, AWS Lambda)
// Example using node-cron:

import cron from 'node-cron'

// Run sync every hour
cron.schedule('0 * * * *', async () => {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/accounts/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    },
    body: JSON.stringify({ force: false })
  })

  const result = await response.json()
  console.log(`Sync completed: ${result.data.synced} accounts synced`)
})
```

### Export for Analytics
```typescript
// utils/export-trades.ts
export async function exportTradesForAnalysis() {
  const response = await fetch('/api/analytics/export', {
    method: 'POST',
    body: JSON.stringify({
      exportType: 'trades',
      format: 'json',
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },
      includeMetadata: true
    })
  })

  const { data } = await response.json()
  
  // Process trades
  const trades = data.items.map(t => ({
    symbol: t.symbol,
    pnl: t.profitLoss,
    duration: new Date(t.closeTime) - new Date(t.openTime)
  }))

  return { trades, summary: data.metadata }
}
```

---

## Rate Limits

Currently no rate limits are enforced, but recommended limits:

- **Accounts Sync:** Once per 5 minutes per account
- **Alerts Test:** Once per minute per alert
- **Analytics Export:** Once per minute (to prevent DB overload)

Implement rate limiting in production using Redis or similar.

---

## Error Codes

All endpoints return appropriate HTTP status codes:

- **200 OK:** Operation successful
- **400 Bad Request:** Invalid request body or parameters
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** No permission to access this resource
- **404 Not Found:** Resource doesn't exist
- **500 Internal Server Error:** Server error

Error response format:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"  // Optional - for programmatic handling
}
```

---

## Security Notes

1. **Authentication:** All endpoints require valid Next Auth session
2. **User Isolation:** Endpoints only return/modify user's own data
3. **Validation:** All inputs validated with Zod before processing
4. **Database:** Parameterized queries prevent SQL injection
5. **Rate Limiting:** Should be implemented in production (not shown here)

---

## Testing Endpoints

### Using cURL

```bash
# Test alerts endpoint
curl -X POST http://localhost:3000/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{"alertId":"alert_123","includeContext":true}'

# Test export endpoint
curl -X POST http://localhost:3000/api/analytics/export \
  -H "Content-Type: application/json" \
  -d '{"exportType":"trades","format":"json"}'

# Test sync endpoint
curl -X POST http://localhost:3000/api/accounts/sync \
  -H "Content-Type: application/json" \
  -d '{"force":true}'
```

### Using Postman

1. Create new POST request
2. Set URL to `http://localhost:3000/api/[endpoint]`
3. Add header: `Content-Type: application/json`
4. Paste request body from examples above
5. Send and view response

---

## Next Steps

1. Implement UI for exporting trades
2. Set up periodic sync (cron job or scheduler)
3. Add alert notification channels (Telegram, Discord, etc.)
4. Monitor sync performance and adjust frequency
5. Add rate limiting in production
