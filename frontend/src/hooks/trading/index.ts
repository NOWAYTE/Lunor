'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getAccountSummary,
  getBrokerAccounts,
  getAccountMetrics,
  disconnectBrokerAccount,
} from '~/actions/accounts'
import {
  getTrades,
  createTrade,
  updateTrade,
  deleteTrade,
  getTradeStats,
  getOpenTrades,
  getTradesByTimeframe,
} from '~/actions/trades'
import {
  createJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
  createEmotionRecord,
  getEmotionStats,
  analyzeEmotions,
} from '~/actions/journal'
import type { CreateTradeInput, UpdateTradeInput } from '~/lib/validations/trades/trades'
import type { CreateJournalEntryInput, UpdateJournalEntryInput, CreateEmotionRecordInput } from '~/lib/validations/journal/journal'

export const useAccounts = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccountSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAccountSummary()
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch account summary')
        return null
      }
      return result.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBrokerAccounts = useCallback(async (filters?: any) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getBrokerAccounts(filters)
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch accounts')
        return []
      }
      return result.data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAccountMetrics = useCallback(async (accountId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAccountMetrics(accountId)
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch metrics')
        return null
      }
      return result.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnect = useCallback(async (accountId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await disconnectBrokerAccount(accountId)
      if (!result?.success) {
        setError(result?.message || 'Failed to disconnect')
        toast.error(result?.message || 'Failed to disconnect')
        return false
      }
      toast.success('Account disconnected')
      return true
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    fetchAccountSummary,
    fetchBrokerAccounts,
    fetchAccountMetrics,
    disconnect,
  }
}

export const useTrades = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrades = useCallback(
    async (options?: any) => {
      setLoading(true)
      setError(null)
      try {
        const result = await getTrades(options)
        if (!result?.success) {
          setError(result?.message || 'Failed to fetch trades')
          return { data: [], total: 0, pages: 0 }
        }
        return { data: result.data || [], total: result.total || 0, pages: result.pages || 0 }
      } catch (err: any) {
        setError(err.message)
        return { data: [], total: 0, pages: 0 }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const addTrade = useCallback(async (input: CreateTradeInput) => {
    setLoading(true)
    setError(null)
    try {
      const result = await createTrade(input)
      if (!result?.success) {
        setError(result?.message || 'Failed to create trade')
        toast.error(result?.message || 'Failed to create trade')
        return null
      }
      toast.success('Trade created successfully')
      return result.data
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const editTrade = useCallback(async (tradeId: string, input: UpdateTradeInput) => {
    setLoading(true)
    setError(null)
    try {
      const result = await updateTrade(tradeId, input)
      if (!result?.success) {
        setError(result?.message || 'Failed to update trade')
        toast.error(result?.message || 'Failed to update trade')
        return null
      }
      toast.success('Trade updated successfully')
      return result.data
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const removeTrade = useCallback(async (tradeId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await deleteTrade(tradeId)
      if (!result?.success) {
        setError(result?.message || 'Failed to delete trade')
        toast.error(result?.message || 'Failed to delete trade')
        return false
      }
      toast.success('Trade deleted successfully')
      return true
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTradeStats = useCallback(async (accountId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getTradeStats(accountId)
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch stats')
        return null
      }
      return result.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchOpenTrades = useCallback(async (accountId?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getOpenTrades(accountId)
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch open trades')
        return []
      }
      return result.data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTradesByTimeframe = useCallback(
    async (accountId: string, timeframe: 'day' | 'week' | 'month') => {
      setLoading(true)
      setError(null)
      try {
        const result = await getTradesByTimeframe(accountId, timeframe)
        if (!result?.success) {
          setError(result?.message || 'Failed to fetch trades')
          return []
        }
        return result.data || []
      } catch (err: any) {
        setError(err.message)
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    loading,
    error,
    fetchTrades,
    addTrade,
    editTrade,
    removeTrade,
    fetchTradeStats,
    fetchOpenTrades,
    fetchTradesByTimeframe,
  }
}

export const useJournal = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addJournalEntry = useCallback(async (input: CreateJournalEntryInput) => {
    setLoading(true)
    setError(null)
    try {
      const result = await createJournalEntry(input)
      if (!result?.success) {
        setError(result?.message || 'Failed to create entry')
        toast.error(result?.message || 'Failed to create entry')
        return null
      }
      toast.success('Journal entry created')
      return result.data
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchJournalEntries = useCallback(async (options?: any) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getJournalEntries(options)
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch entries')
        return { data: [], total: 0, pages: 0 }
      }
      return { data: result.data || [], total: result.total || 0, pages: result.pages || 0 }
    } catch (err: any) {
      setError(err.message)
      return { data: [], total: 0, pages: 0 }
    } finally {
      setLoading(false)
    }
  }, [])

  const editJournalEntry = useCallback(
    async (entryId: string, input: UpdateJournalEntryInput) => {
      setLoading(true)
      setError(null)
      try {
        const result = await updateJournalEntry(entryId, input)
        if (!result?.success) {
          setError(result?.message || 'Failed to update entry')
          toast.error(result?.message || 'Failed to update entry')
          return null
        }
        toast.success('Journal entry updated')
        return result.data
      } catch (err: any) {
        setError(err.message)
        toast.error(err.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const removeJournalEntry = useCallback(async (entryId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await deleteJournalEntry(entryId)
      if (!result?.success) {
        setError(result?.message || 'Failed to delete entry')
        toast.error(result?.message || 'Failed to delete entry')
        return false
      }
      toast.success('Journal entry deleted')
      return true
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const recordEmotion = useCallback(async (input: CreateEmotionRecordInput) => {
    setLoading(true)
    setError(null)
    try {
      const result = await createEmotionRecord(input)
      if (!result?.success) {
        setError(result?.message || 'Failed to record emotion')
        toast.error(result?.message || 'Failed to record emotion')
        return null
      }
      toast.success('Emotion recorded')
      return result.data
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEmotionStats = useCallback(async (options?: any) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getEmotionStats(options)
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch emotion stats')
        return null
      }
      return result.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const analyzeEmotionsTrends = useCallback(async (options?: any) => {
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeEmotions(options)
      if (!result?.success) {
        setError(result?.message || 'Failed to analyze emotions')
        return null
      }
      return result.data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    addJournalEntry,
    fetchJournalEntries,
    editJournalEntry,
    removeJournalEntry,
    recordEmotion,
    fetchEmotionStats,
    analyzeEmotionsTrends,
  }
}
