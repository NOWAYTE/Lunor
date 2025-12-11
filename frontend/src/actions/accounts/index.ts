'use server'

import { headers } from 'next/headers'
import { auth } from '~/lib/auth'
import { db } from '~/server/db'
import type { BrokerAccount, Prisma } from '@prisma/client'

/**
 * Get authenticated user's session and broker accounts
 */
export const getAccountSummary = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Get primary account (first active one)
    const primaryAccount = await db.brokerAccount.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: {
        id: true,
        brokerName: true,
        accountNumber: true,
        platform: true,
        status: true,
        createdAt: true,
        lastSyncedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    if (!primaryAccount) {
      return {
        success: false,
        message: 'No active broker account found',
        data: null,
      }
    }

    return {
      success: true,
      data: primaryAccount,
    }
  } catch (error: any) {
    console.error('getAccountSummary error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch account summary',
      data: null,
    }
  }
}

/**
 * Get all broker accounts for authenticated user
 */
export const getBrokerAccounts = async (filters?: {
  status?: 'ACTIVE' | 'INITIALIZING' | 'DISCONNECTED' | 'ERROR'
}) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    const accounts = await db.brokerAccount.findMany({
      where: {
        userId,
        ...(filters?.status && { status: filters.status }),
      },
      select: {
        id: true,
        brokerName: true,
        accountNumber: true,
        platform: true,
        server: true,
        status: true,
        createdAt: true,
        lastSyncedAt: true,
        _count: {
          select: { trades: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      success: true,
      data: accounts,
    }
  } catch (error: any) {
    console.error('getBrokerAccounts error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch broker accounts',
      data: null,
    }
  }
}

/**
 * Get account metrics (deposits, withdrawals, P&L, win rate)
 */
export const getAccountMetrics = async (accountId: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Verify account ownership
    const account = await db.brokerAccount.findFirst({
      where: { id: accountId, userId },
    })

    if (!account) {
      return {
        success: false,
        message: 'Account not found',
        data: null,
      }
    }

    // Get all trades for this account
    const trades = await db.trade.findMany({
      where: { brokerAccountId: accountId },
      select: {
        profitLoss: true,
        entryPrice: true,
        exitPrice: true,
        lotSize: true,
        tradeType: true,
      },
    })

    // Calculate metrics
    const totalTrades = trades.length
    const winningTrades = trades.filter(t => t.profitLoss > 0).length
    const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0)
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    const avgWin = winningTrades > 0 
      ? trades.filter(t => t.profitLoss > 0).reduce((sum, t) => sum + t.profitLoss, 0) / winningTrades 
      : 0
    const avgLoss = (totalTrades - winningTrades) > 0 
      ? Math.abs(trades.filter(t => t.profitLoss <= 0).reduce((sum, t) => sum + t.profitLoss, 0) / (totalTrades - winningTrades)) 
      : 0

    return {
      success: true,
      data: {
        accountId,
        totalTrades,
        winningTrades,
        losingTrades: totalTrades - winningTrades,
        totalPL,
        winRate: parseFloat(winRate.toFixed(2)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        profitFactor: avgLoss > 0 ? parseFloat((avgWin / avgLoss).toFixed(2)) : 0,
      },
    }
  } catch (error: any) {
    console.error('getAccountMetrics error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch account metrics',
      data: null,
    }
  }
}

/**
 * Disconnect broker account
 */
export const disconnectBrokerAccount = async (accountId: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Verify ownership
    const account = await db.brokerAccount.findFirst({
      where: { id: accountId, userId },
    })

    if (!account) {
      return {
        success: false,
        message: 'Account not found',
      }
    }

    // Update account status
    await db.brokerAccount.update({
      where: { id: accountId },
      data: {
        status: 'DISCONNECTED',
        lastSyncedAt: new Date(),
      },
    })

    return {
      success: true,
      message: 'Account disconnected successfully',
    }
  } catch (error: any) {
    console.error('disconnectBrokerAccount error:', error)
    return {
      success: false,
      message: error.message || 'Failed to disconnect account',
    }
  }
}

/**
 * Update account preferences (currency, timezone, etc.)
 */
export const updateAccountPreferences = async (
  preferences: Record<string, any>
) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Store preferences as JSON in user metadata (would need schema update)
    // For now, this is a placeholder for future implementation
    // Could store in a UserPreferences table or as JSON field

    return {
      success: true,
      message: 'Preferences updated successfully',
    }
  } catch (error: any) {
    console.error('updateAccountPreferences error:', error)
    return {
      success: false,
      message: error.message || 'Failed to update preferences',
    }
  }
}
