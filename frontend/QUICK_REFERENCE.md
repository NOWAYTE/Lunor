# Quick Reference Guide - Phase 1 & 2 Actions

## Import Statements

```typescript
// Accounts
import { 
  getAccountSummary, 
  getBrokerAccounts, 
  getAccountMetrics, 
  disconnectBrokerAccount 
} from '~/actions/accounts'

// Trades
import { 
  getTrades, 
  createTrade, 
  updateTrade, 
  deleteTrade, 
  getTradeStats, 
  getOpenTrades, 
  getTradesByTimeframe 
} from '~/actions/trades'

// Journal
import { 
  createJournalEntry, 
  getJournalEntries, 
  updateJournalEntry, 
  deleteJournalEntry, 
  createEmotionRecord, 
  getEmotionStats, 
  analyzeEmotions 
} from '~/actions/journal'

// Analytics
import { 
  getDashboardMetrics, 
  getMonthlyPerformance, 
  getEquityCurve, 
  getSymbolAnalytics, 
  getSessionAnalytics, 
  getDrawdown 
} from '~/actions/analytics'

// Alerts
import { 
  createAlert, 
  getAlerts, 
  updateAlert, 
  deleteAlert, 
  toggleAlert 
} from '~/actions/alerts'
```

## Hook Usage

```typescript
'use client'

import { useAccounts } from '~/hooks/useAccounts'
import { useTrades } from '~/hooks/useTrades'
import { useAnalytics } from '~/hooks/useAnalytics'
import { useJournal } from '~/hooks/useAlerts' // Note: stored here
import { useAlertsConfig } from '~/hooks/useAlertsConfig'

// In component
export default function DashboardPage() {
  const { loading, fetchAccountSummary } = useAccounts()
  const { fetchTrades, addTrade } = useTrades()
  const { fetchDashboardMetrics } = useAnalytics()
  
  // ... component logic
}
```

## Common Patterns

### Fetch Data on Mount
```typescript
'use client'
import { useEffect, useState } from 'react'
import { getDashboardMetrics } from '~/actions/analytics'

export function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const result = await getDashboardMetrics()
      if (result?.success) setMetrics(result.data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div>Loading...</div>
  return <div>{JSON.stringify(metrics)}</div>
}
```

### Using Hooks (Recommended)
```typescript
'use client'
import { useAnalytics } from '~/hooks/useAnalytics'

export function Dashboard() {
  const { loading, fetchDashboardMetrics } = useAnalytics()
  
  const handleRefresh = async () => {
    const metrics = await fetchDashboardMetrics()
    // metrics is automatically handled with toast notifications
  }

  return (
    <div>
      <button onClick={handleRefresh} disabled={loading}>
        Refresh
      </button>
    </div>
  )
}
```

### Form Integration
```typescript
'use client'
import { useTrades } from '~/hooks/useTrades'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTradeSchema } from '~/lib/validations/trades/trades'

export function TradeForm() {
  const { addTrade, loading } = useTrades()
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(createTradeSchema)
  })

  const onSubmit = async (data) => {
    const result = await addTrade(data)
    if (result) {
      // Trade created successfully, toast already shown
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form fields */}
      <button disabled={loading}>Submit</button>
    </form>
  )
}
```

## API Routes

### Sync Accounts
```typescript
const response = await fetch('/api/accounts/sync', { method: 'POST' })
const data = await response.json()
// { success: true, message: "Synced X account(s)", data: { syncedCount, failedCount, totalCount } }
```

### Test Alert
```typescript
const response = await fetch('/api/alerts/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ alertId: 'alert_xyz' })
})
const data = await response.json()
// { success: true, message: "Test alert sent successfully", data: { alertId, type, testSentAt } }
```

### Export Analytics
```typescript
// JSON
const response = await fetch('/api/analytics/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ format: 'json', accountId: 'acc_123' })
})
const data = await response.json()
// { success: true, data: { exportedAt, tradeCount, trades[] } }

// CSV
const response = await fetch('/api/analytics/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ format: 'csv', accountId: 'acc_123' })
})
const csv = await response.text()
// Returns CSV file as text
```

## Return Value Patterns

All actions follow this pattern:
```typescript
{
  success: boolean,
  message?: string,
  data?: T,
  total?: number,     // for paginated results
  pages?: number      // for paginated results
}
```

Example:
```typescript
const result = await getTrades()
if (result?.success) {
  console.log(result.data)  // Trade[]
  console.log(result.total) // number
  console.log(result.pages) // number
}
```

## Error Handling

All hooks include automatic error handling with toast notifications:

```typescript
const { loading, error, fetchTrades } = useTrades()

await fetchTrades()
// On error: 
// - error state is set
// - toast.error() is shown to user
// - returns null
```

## Type Safety

```typescript
import type { CreateTradeInput, UpdateTradeInput } from '~/lib/validations/trades/trades'
import type { CreateAlertInput } from '~/lib/validations/alerts/alerts'
import type { CreateJournalEntryInput } from '~/lib/validations/journal/journal'

// Fully typed function calls
const trade = await createTrade({
  brokerAccountId: 'acc_123',
  symbol: 'EURUSD',
  // ... rest of properties with autocomplete
} as CreateTradeInput)
```

## Filtering Examples

### Get Trades by Symbol
```typescript
const result = await getTrades({
  symbol: 'EURUSD',
  limit: 20,
  offset: 0
})
```

### Get Trades by Date Range
```typescript
const result = await getTrades({
  startDate: new Date('2024-12-01'),
  endDate: new Date('2024-12-31'),
  accountId: 'acc_123'
})
```

### Get Active Alerts
```typescript
const alerts = await getAlerts({ active: true, type: 'PRICE' })
```

### Get Emotions in Date Range
```typescript
const emotions = await getEmotionStats({
  startDate: new Date('2024-12-01'),
  endDate: new Date('2024-12-31')
})
```

## Performance Tips

1. **Use hooks instead of direct actions** - Built-in loading/error handling
2. **Implement pagination** - Use `limit` and `offset` for large datasets
3. **Filter before fetch** - Supply filters to reduce returned data
4. **Memoize results** - Use React.useMemo for expensive calculations
5. **Combine related queries** - Fetch multiple things at once when possible

Example:
```typescript
const [metrics, setMetrics] = useState(null)
const [stats, setStats] = useState(null)

// Good: Fetch simultaneously
useEffect(() => {
  Promise.all([
    getDashboardMetrics(),
    getTradeStats(accountId)
  ]).then(([m, s]) => {
    setMetrics(m)
    setStats(s)
  })
}, [])
```

---

**Need more details?** See `IMPLEMENTATION.md` for comprehensive documentation.
