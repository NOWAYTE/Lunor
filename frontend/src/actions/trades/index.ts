'use server'

import { headers } from 'next/headers'
import { auth } from '~/lib/auth'
import { db } from '~/server/db'
import { createTradeSchema, updateTradeSchema } from '~/lib/validations/trades/trades'
import type { CreateTradeInput, UpdateTradeInput } from '~/lib/validations/trades/trades'

/**
 * Get trades with filters and pagination
 */
export const getTrades = async (options?: {
  accountId?: string
  symbol?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id
    const limit = options?.limit || 50
    const offset = options?.offset || 0

    const where: any = { user: { id: userId } }

    if (options?.accountId) {
      where.brokerAccountId = options.accountId
    }
    if (options?.symbol) {
      where.symbol = { contains: options.symbol, mode: 'insensitive' }
    }
    if (options?.startDate || options?.endDate) {
      where.openTime = {}
      if (options.startDate) where.openTime.gte = options.startDate
      if (options.endDate) where.openTime.lte = options.endDate
    }

    const [trades, total] = await Promise.all([
      db.trade.findMany({
        where,
        select: {
          id: true,
          symbol: true,
          tradeType: true,
          lotSize: true,
          entryPrice: true,
          exitPrice: true,
          profitLoss: true,
          openTime: true,
          closeTime: true,
          session: true,
          strategyTag: true,
          riskReward: true,
          notes: true,
          brokerAccount: {
            select: { brokerName: true },
          },
        },
        orderBy: { openTime: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.trade.count({ where }),
    ])

    return {
      success: true,
      data: trades,
      total,
      pages: Math.ceil(total / limit),
    }
  } catch (error: any) {
    console.error('getTrades error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch trades',
      data: [],
    }
  }
}

/**
 * Create a new trade
 */
export const createTrade = async (input: CreateTradeInput) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Validate input
    const validated = createTradeSchema.parse(input)

    // Verify account ownership
    const account = await db.brokerAccount.findFirst({
      where: { id: validated.brokerAccountId, userId },
    })

    if (!account) {
      return {
        success: false,
        message: 'Broker account not found',
      }
    }

    // Calculate P&L
    const profitLoss =
      validated.tradeType === 'BUY'
        ? (validated.exitPrice - validated.entryPrice) * validated.lotSize
        : (validated.entryPrice - validated.exitPrice) * validated.lotSize

    const trade = await db.trade.create({
      data: {
        userId,
        brokerAccountId: validated.brokerAccountId,
        symbol: validated.symbol,
        tradeType: validated.tradeType,
        lotSize: validated.lotSize,
        entryPrice: validated.entryPrice,
        exitPrice: validated.exitPrice,
        profitLoss,
        openTime: validated.openTime,
        closeTime: validated.closeTime,
        session: validated.session,
        strategyTag: validated.strategyTag,
        riskReward: validated.riskReward,
        notes: validated.notes,
      },
      select: {
        id: true,
        symbol: true,
        tradeType: true,
        profitLoss: true,
        createdAt: true,
      },
    })

    return {
      success: true,
      message: 'Trade created successfully',
      data: trade,
    }
  } catch (error: any) {
    console.error('createTrade error:', error)
    return {
      success: false,
      message: error.message || 'Failed to create trade',
    }
  }
}

/**
 * Update an existing trade
 */
export const updateTrade = async (tradeId: string, input: UpdateTradeInput) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Verify ownership
    const trade = await db.trade.findFirst({
      where: { id: tradeId, userId },
    })

    if (!trade) {
      return {
        success: false,
        message: 'Trade not found',
      }
    }

    // Validate input
    const validated = updateTradeSchema.parse(input)

    // Recalculate P&L if prices changed
    let updateData: any = { ...validated }
    if (
      validated.exitPrice ||
      validated.entryPrice ||
      validated.lotSize ||
      validated.tradeType
    ) {
      const exitPrice = validated.exitPrice || trade.exitPrice
      const entryPrice = validated.entryPrice || trade.entryPrice
      const lotSize = validated.lotSize || trade.lotSize
      const tradeType = validated.tradeType || trade.tradeType

      updateData.profitLoss =
        tradeType === 'BUY'
          ? (exitPrice - entryPrice) * lotSize
          : (entryPrice - exitPrice) * lotSize
    }

    const updated = await db.trade.update({
      where: { id: tradeId },
      data: updateData,
      select: {
        id: true,
        symbol: true,
        profitLoss: true,
      },
    })

    return {
      success: true,
      message: 'Trade updated successfully',
      data: updated,
    }
  } catch (error: any) {
    console.error('updateTrade error:', error)
    return {
      success: false,
      message: error.message || 'Failed to update trade',
    }
  }
}

/**
 * Delete a trade
 */
export const deleteTrade = async (tradeId: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Verify ownership
    const trade = await db.trade.findFirst({
      where: { id: tradeId, userId },
    })

    if (!trade) {
      return {
        success: false,
        message: 'Trade not found',
      }
    }

    // Delete related journal entries first
    await db.journalEntry.deleteMany({
      where: { tradeId },
    })

    await db.trade.delete({
      where: { id: tradeId },
    })

    return {
      success: true,
      message: 'Trade deleted successfully',
    }
  } catch (error: any) {
    console.error('deleteTrade error:', error)
    return {
      success: false,
      message: error.message || 'Failed to delete trade',
    }
  }
}

/**
 * Get open trades (active positions)
 */
export const getOpenTrades = async (accountId?: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    const where: any = { userId }
    if (accountId) {
      where.brokerAccountId = accountId
    }

    // Assuming open trades don't have closeTime set or closeTime is in future
    const trades = await db.trade.findMany({
      where,
      select: {
        id: true,
        symbol: true,
        tradeType: true,
        entryPrice: true,
        lotSize: true,
        openTime: true,
        strategyTag: true,
        brokerAccount: {
          select: { brokerName: true },
        },
      },
      orderBy: { openTime: 'desc' },
    })

    return {
      success: true,
      data: trades,
    }
  } catch (error: any) {
    console.error('getOpenTrades error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch open trades',
      data: [],
    }
  }
}

/**
 * Get trades grouped by timeframe (day, week, month)
 */
export const getTradesByTimeframe = async (
  accountId: string,
  timeframe: 'day' | 'week' | 'month'
) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Verify account ownership
    await db.brokerAccount.findFirstOrThrow({
      where: { id: accountId, userId },
    })

    const trades = await db.trade.findMany({
      where: { brokerAccountId: accountId },
      select: {
        openTime: true,
        profitLoss: true,
        symbol: true,
      },
      orderBy: { openTime: 'desc' },
    })

    // Group trades by timeframe
    const grouped: Record<string, any[]> = {}

    trades.forEach(trade => {
      let key: string
      const date = new Date(trade.openTime)
      const dateStr = date.toISOString().split('T')[0] || 'unknown'

      if (timeframe === 'day') {
        key = dateStr
      } else if (timeframe === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0] || 'unknown'
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      if (!grouped[key]) grouped[key] = []
      grouped[key]!.push(trade)
    })

    // Calculate stats per timeframe
    const result = Object.entries(grouped).map(([period, trades]) => {
      const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0)
      const winningTrades = trades.filter(t => t.profitLoss > 0).length

      return {
        period,
        trades: trades.length,
        totalPL: parseFloat(totalPL.toFixed(2)),
        winRate: parseFloat(((winningTrades / trades.length) * 100).toFixed(2)),
      }
    })

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error('getTradesByTimeframe error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch trades by timeframe',
      data: [],
    }
  }
}

/**
 * Get comprehensive trade statistics
 */
export const getTradeStats = async (accountId: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Verify account ownership
    await db.brokerAccount.findFirstOrThrow({
      where: { id: accountId, userId },
    })

    const trades = await db.trade.findMany({
      where: { brokerAccountId: accountId },
      select: {
        profitLoss: true,
        entryPrice: true,
        exitPrice: true,
        lotSize: true,
        riskReward: true,
        symbol: true,
        tradeType: true,
      },
    })

    const totalTrades = trades.length
    if (totalTrades === 0) {
      return {
        success: true,
        data: {
          totalTrades: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          profitFactor: 0,
          totalPL: 0,
        },
      }
    }

    const winningTrades = trades.filter(t => t.profitLoss > 0)
    const losingTrades = trades.filter(t => t.profitLoss <= 0)

    const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0)
    const avgWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + t.profitLoss, 0) /
          winningTrades.length
        : 0
    const avgLoss =
      losingTrades.length > 0
        ? Math.abs(
            losingTrades.reduce((sum, t) => sum + t.profitLoss, 0) /
              losingTrades.length
          )
        : 0
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0
    const winRate = (winningTrades.length / totalTrades) * 100

    return {
      success: true,
      data: {
        totalTrades,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: parseFloat(winRate.toFixed(2)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        totalPL: parseFloat(totalPL.toFixed(2)),
      },
    }
  } catch (error: any) {
    console.error('getTradeStats error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch trade stats',
      data: null,
    }
  }
}
