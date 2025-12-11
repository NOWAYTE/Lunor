# Implementation Patterns & Examples

## Client Component Patterns

### Basic Data Fetching
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAccounts } from '~/hooks/useAccounts'

export function AccountsPage() {
  const { loading, fetchBrokerAccounts } = useAccounts()
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    const load = async () => {
      const accts = await fetchBrokerAccounts()
      setAccounts(accts)
    }
    load()
  }, [])

  return (
    <div>
      {loading && <div>Loading...</div>}
      {accounts.map(acc => (
        <div key={acc.id}>{acc.brokerName}</div>
      ))}
    </div>
  )
}
```

### Form with Submission
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTrades } from '~/hooks/useTrades'
import { createTradeSchema } from '~/lib/validations/trades/trades'

export function AddTradeForm() {
  const { addTrade, loading } = useTrades()
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createTradeSchema)
  })

  const onSubmit = async (data) => {
    const result = await addTrade(data)
    if (result) {
      // Toast shown automatically
      // Form submission successful
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('symbol')} />
      {errors.symbol && <span>{errors.symbol.message}</span>}
      
      <button disabled={loading}>
        {loading ? 'Adding...' : 'Add Trade'}
      </button>
    </form>
  )
}
```

### Data Refresh Button
```typescript
'use client'

import { useState } from 'react'
import { useAnalytics } from '~/hooks/useAnalytics'
import { RefreshCw } from 'lucide-react'

export function MetricsCard() {
  const { loading, fetchDashboardMetrics } = useAnalytics()
  const [metrics, setMetrics] = useState(null)

  const handleRefresh = async () => {
    const data = await fetchDashboardMetrics()
    setMetrics(data)
  }

  return (
    <div>
      <button 
        onClick={handleRefresh} 
        disabled={loading}
        className="flex items-center gap-2"
      >
        <RefreshCw className={loading ? 'animate-spin' : ''} />
        Refresh
      </button>
      {metrics && <pre>{JSON.stringify(metrics, null, 2)}</pre>}
    </div>
  )
}
```

### Paginated List
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useTrades } from '~/hooks/useTrades'

export function TradesList() {
  const { fetchTrades, loading } = useTrades()
  const [trades, setTrades] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const load = async () => {
      const result = await fetchTrades({
        limit: 20,
        offset: page * 20
      })
      setTrades(result.data)
      setTotal(result.total)
    }
    load()
  }, [page])

  return (
    <div>
      <table>
        <tbody>
          {trades.map(trade => (
            <tr key={trade.id}>
              <td>{trade.symbol}</td>
              <td>{trade.profitLoss}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2">
        <button 
          disabled={page === 0 || loading}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button 
          disabled={page >= Math.ceil(total / 20) - 1 || loading}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

### With Error Display
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useJournal } from '~/hooks/useAlerts'
import { AlertCircle } from 'lucide-react'

export function JournalEntries() {
  const { loading, error, fetchJournalEntries } = useJournal()
  const [entries, setEntries] = useState([])

  useEffect(() => {
    const load = async () => {
      const result = await fetchJournalEntries()
      setEntries(result.data)
    }
    load()
  }, [])

  return (
    <div>
      {error && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle />
          <span>{error}</span>
        </div>
      )}

      {loading && <div>Loading entries...</div>}

      {entries.length === 0 && !loading && (
        <div>No entries yet</div>
      )}

      <ul>
        {entries.map(entry => (
          <li key={entry.id}>
            <h3>{entry.title}</h3>
            <p>{entry.content}</p>
            <span className="text-sm text-gray-500">
              {entry.sentiment}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Server Action Patterns

### Direct Call (Server Component)
```typescript
// app/dashboard/page.tsx
import { getDashboardMetrics } from '~/actions/analytics'

export default async function DashboardPage() {
  const result = await getDashboardMetrics()

  if (!result?.success) {
    return <div>Error loading metrics</div>
  }

  return (
    <div>
      <h1>Total P&L: ${result.data.totalPL}</h1>
      <p>Win Rate: {result.data.winRate}%</p>
    </div>
  )
}
```

### With Error Handling
```typescript
const result = await createTrade({
  brokerAccountId: 'acc_123',
  symbol: 'EURUSD',
  // ... other fields
})

if (!result?.success) {
  console.error('Trade creation failed:', result?.message)
  // Handle error
} else {
  console.log('Trade created:', result.data)
  // Handle success
}
```

---

## Complex Scenarios

### Load Multiple Data Sources
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAccounts } from '~/hooks/useAccounts'
import { useAnalytics } from '~/hooks/useAnalytics'
import { useTrades } from '~/hooks/useTrades'

export function ComplexDashboard() {
  const [data, setData] = useState({
    account: null,
    metrics: null,
    stats: null
  })

  const { fetchAccountSummary } = useAccounts()
  const { fetchDashboardMetrics } = useAnalytics()
  const { fetchTradeStats } = useTrades()

  useEffect(() => {
    const load = async () => {
      const [account, metrics, stats] = await Promise.all([
        fetchAccountSummary(),
        fetchDashboardMetrics(),
        fetchTradeStats('acc_123')
      ])

      setData({ account, metrics, stats })
    }

    load()
  }, [])

  return (
    <div>
      <h2>{data.account?.brokerName}</h2>
      <p>Total P&L: ${data.metrics?.totalPL}</p>
      <p>Win Rate: {data.stats?.winRate}%</p>
    </div>
  )
}
```

### Conditional Fetching
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useTrades } from '~/hooks/useTrades'

export function SymbolSearch() {
  const [symbol, setSymbol] = useState('')
  const [trades, setTrades] = useState([])
  const { fetchTrades } = useTrades()

  useEffect(() => {
    if (!symbol) {
      setTrades([])
      return
    }

    const load = async () => {
      const result = await fetchTrades({ symbol })
      setTrades(result.data)
    }

    load()
  }, [symbol])

  return (
    <div>
      <input 
        value={symbol}
        onChange={e => setSymbol(e.target.value)}
        placeholder="Search symbol..."
      />
      <ul>
        {trades.map(t => (
          <li key={t.id}>{t.symbol}</li>
        ))}
      </ul>
    </div>
  )
}
```

### With Debouncing
```typescript
'use client'

import { useEffect, useState, useRef } from 'react'
import { useTrades } from '~/hooks/useTrades'

export function DebouncedSearch() {
  const [symbol, setSymbol] = useState('')
  const [trades, setTrades] = useState([])
  const { fetchTrades } = useTrades()
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!symbol) {
      setTrades([])
      return
    }

    timeoutRef.current = setTimeout(async () => {
      const result = await fetchTrades({ symbol })
      setTrades(result.data)
    }, 300)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [symbol])

  return (
    <div>
      <input 
        value={symbol}
        onChange={e => setSymbol(e.target.value)}
        placeholder="Search symbol (debounced)..."
      />
      <ul>
        {trades.map(t => (
          <li key={t.id}>{t.symbol}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Testing Patterns

### Unit Test Example
```typescript
// __tests__/actions/trades.test.ts
import { createTrade, getTradeStats } from '~/actions/trades'

describe('Trade Actions', () => {
  it('should create trade with calculated P&L', async () => {
    const result = await createTrade({
      brokerAccountId: 'test_acc',
      symbol: 'EURUSD',
      tradeType: 'BUY',
      entryPrice: 1.2400,
      exitPrice: 1.2450,
      lotSize: 1.0,
      openTime: new Date(),
      closeTime: new Date()
    })

    expect(result.success).toBe(true)
    expect(result.data?.profitLoss).toBe(50) // (1.2450 - 1.2400) * 1.0
  })

  it('should calculate win rate correctly', async () => {
    const stats = await getTradeStats('test_acc')
    
    expect(stats.success).toBe(true)
    expect(stats.data?.winRate).toBeGreaterThanOrEqual(0)
    expect(stats.data?.winRate).toBeLessThanOrEqual(100)
  })
})
```

---

## Error Handling Patterns

### Try-Catch Pattern
```typescript
'use client'

import { useState } from 'react'
import { createTrade } from '~/actions/trades'

export function SafeTradeCreation() {
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    try {
      const result = await createTrade({/* ... */})
      
      if (!result?.success) {
        setError(result?.message || 'Unknown error')
        return
      }

      // Success
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    }
  }

  return (
    <div>
      {error && <div className="text-red-600">{error}</div>}
      <button onClick={handleCreate}>Create Trade</button>
    </div>
  )
}
```

### With Validation
```typescript
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createTradeSchema } from '~/lib/validations/trades/trades'

export function ValidatedForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(createTradeSchema)
  })

  return (
    <form onSubmit={handleSubmit(async data => {
      // Data is guaranteed to be valid here
      const result = await createTrade(data)
    })}>
      <input {...register('symbol')} />
      {errors.symbol && (
        <span className="text-red-600">{errors.symbol.message}</span>
      )}
    </form>
  )
}
```

---

## Performance Patterns

### Memoization
```typescript
'use client'

import { useMemo } from 'react'
import { useTrades } from '~/hooks/useTrades'

export function TradesAnalysis() {
  const { fetchTradeStats } = useTrades()
  const [stats, setStats] = useState(null)

  const analysis = useMemo(() => {
    if (!stats) return null

    return {
      riskRewardRatio: stats.avgWin / stats.avgLoss,
      expectancy: (stats.winRate / 100 * stats.avgWin) - ((1 - stats.winRate / 100) * stats.avgLoss),
      returnOnRisk: stats.totalPL / (stats.totalTrades * 100) // Simplified
    }
  }, [stats])

  return (
    <div>
      <p>Risk/Reward: {analysis?.riskRewardRatio.toFixed(2)}</p>
      <p>Expectancy: ${analysis?.expectancy.toFixed(2)}</p>
    </div>
  )
}
```

### Lazy Loading
```typescript
'use client'

import { lazy, Suspense } from 'react'

const AnalyticsPanel = lazy(() => import('./AnalyticsPanel'))

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <Suspense fallback={<div>Loading analytics...</div>}>
        <AnalyticsPanel />
      </Suspense>
    </div>
  )
}
```

---

## Type Safety Patterns

### Typed Hook Usage
```typescript
'use client'

import { useTrades } from '~/hooks/useTrades'
import type { CreateTradeInput } from '~/lib/validations/trades/trades'

export function TypeSafeForm() {
  const { addTrade } = useTrades()

  const handleSubmit = async (formData: CreateTradeInput) => {
    // formData type is guaranteed by TypeScript
    const result = await addTrade(formData)
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>
}
```

### Typed Action Results
```typescript
import { getDashboardMetrics } from '~/actions/analytics'

async function processDashboard() {
  const result = await getDashboardMetrics()

  // TypeScript knows result.data contains:
  // { totalTrades, winningTrades, totalPL, winRate, activeAccounts, dominantEmotion }
  
  if (result?.success && result.data) {
    const pl = result.data.totalPL // Type: number
    const rate = result.data.winRate // Type: number
  }
}
```

---

**Use these patterns as templates for building your UI!** ✨
