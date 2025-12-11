'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getDashboardMetrics,
  getMonthlyPerformance,
  getEquityCurve,
  getSymbolAnalytics,
  getSessionAnalytics,
  getDrawdown,
} from '~/actions/analytics'
import {
  createAlert,
  getAlerts,
  updateAlert,
  deleteAlert,
  toggleAlert,
} from '~/actions/alerts'
import type { CreateAlertInput, UpdateAlertInput } from '~/lib/validations/alerts/alerts'

export const useAnalytics = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getDashboardMetrics()
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

  const fetchMonthlyPerformance = useCallback(async (months?: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getMonthlyPerformance({ months })
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch performance')
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

  const fetchEquityCurve = useCallback(async (options?: any) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getEquityCurve(options)
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch equity curve')
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

  const fetchSymbolAnalytics = useCallback(async (symbol: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getSymbolAnalytics(symbol)
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch symbol analytics')
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

  const fetchSessionAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getSessionAnalytics()
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch session analytics')
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

  const fetchDrawdown = useCallback(async (accountId?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getDrawdown(accountId)
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch drawdown')
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
    fetchDashboardMetrics,
    fetchMonthlyPerformance,
    fetchEquityCurve,
    fetchSymbolAnalytics,
    fetchSessionAnalytics,
    fetchDrawdown,
  }
}

export const useAlertsConfig = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addAlert = useCallback(async (input: CreateAlertInput) => {
    setLoading(true)
    setError(null)
    try {
      const result = await createAlert(input)
      if (!result?.success) {
        setError(result?.message || 'Failed to create alert')
        toast.error(result?.message || 'Failed to create alert')
        return null
      }
      toast.success('Alert created successfully')
      return result.data
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAlerts = useCallback(async (options?: any) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAlerts(options)
      if (!result?.success) {
        setError(result?.message || 'Failed to fetch alerts')
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

  const editAlert = useCallback(async (alertId: string, input: UpdateAlertInput) => {
    setLoading(true)
    setError(null)
    try {
      const result = await updateAlert(alertId, input)
      if (!result?.success) {
        setError(result?.message || 'Failed to update alert')
        toast.error(result?.message || 'Failed to update alert')
        return null
      }
      toast.success('Alert updated successfully')
      return result.data
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const removeAlert = useCallback(async (alertId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await deleteAlert(alertId)
      if (!result?.success) {
        setError(result?.message || 'Failed to delete alert')
        toast.error(result?.message || 'Failed to delete alert')
        return false
      }
      toast.success('Alert deleted successfully')
      return true
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleAlertStatus = useCallback(async (alertId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await toggleAlert(alertId)
      if (!result?.success) {
        setError(result?.message || 'Failed to toggle alert')
        toast.error(result?.message || 'Failed to toggle alert')
        return null
      }
      toast.success(result.message)
      return result.data
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    addAlert,
    fetchAlerts,
    editAlert,
    removeAlert,
    toggleAlertStatus,
  }
}
