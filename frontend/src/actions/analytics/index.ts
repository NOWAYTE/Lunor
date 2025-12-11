'use server'

import { headers } from 'next/headers'
import { auth } from '~/lib/auth'
import { db } from '~/server/db'

/**
 * Get dashboard metrics aggregated across all accounts
 */
export const getDashboardMetrics = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Get all trades for user
    const trades = await db.trade.findMany({
      where: { userId },
      select: {
        profitLoss: true,
        tradeType: true,
      },
    })

    // Get all emotions for recent analysis
    const emotionDays = new Date()
    emotionDays.setDate(emotionDays.getDate() - 30)

    const emotions = await db.emotionRecord.findMany({
      where: {
        userId,
        notedAt: { gte: emotionDays },
      },
      select: {
        emotion: true,
        intensity: true,
      },
    })

    // Calculate metrics
    const totalTrades = trades.length
    const winningTrades = trades.filter(t => t.profitLoss > 0).length
    const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0)
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    // Emotion dominant in past 30 days
    const emotionCounts: Record<string, number> = {}
    emotions.forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1
    })

    const dominantEmotion = Object.entries(emotionCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || 'NEUTRAL'

    // Get broker accounts
    const accounts = await db.brokerAccount.findMany({
      where: { userId },
      select: { id: true, status: true },
    })

    return {
      success: true,
      data: {
        totalTrades,
        winningTrades,
        totalPL: parseFloat(totalPL.toFixed(2)),
        winRate: parseFloat(winRate.toFixed(2)),
        activeAccounts: accounts.filter(a => a.status === 'ACTIVE').length,
        totalAccounts: accounts.length,
        dominantEmotion,
      },
    }
  } catch (error: any) {
    console.error('getDashboardMetrics error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch dashboard metrics',
      data: null,
    }
  }
}

/**
 * Get monthly performance breakdown
 */
export const getMonthlyPerformance = async (options?: {
  months?: number
}) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id
    const months = options?.months || 12

    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - months)

    const trades = await db.trade.findMany({
      where: {
        userId,
        openTime: { gte: cutoffDate },
      },
      select: {
        openTime: true,
        profitLoss: true,
      },
    })

    // Group by month
    const monthlyData: Record<string, any> = {}

    trades.forEach(trade => {
      const date = new Date(trade.openTime)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[key]) {
        monthlyData[key] = { trades: [], totalPL: 0 }
      }
      monthlyData[key].trades.push(trade)
      monthlyData[key].totalPL += trade.profitLoss
    })

    const result = Object.entries(monthlyData).map(([month, data]) => {
      const winningTrades = data.trades.filter((t: any) => t.profitLoss > 0).length

      return {
        month,
        totalTrades: data.trades.length,
        totalPL: parseFloat(data.totalPL.toFixed(2)),
        winRate: parseFloat(
          ((winningTrades / data.trades.length) * 100).toFixed(2)
        ),
      }
    })

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error('getMonthlyPerformance error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch monthly performance',
      data: [],
    }
  }
}

/**
 * Get equity curve data
 */
export const getEquityCurve = async (options?: {
  accountId?: string
  startDate?: Date
  endDate?: Date
}) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    const where: any = { userId }

    if (options?.accountId) {
      where.brokerAccountId = options.accountId
    }

    if (options?.startDate || options?.endDate) {
      where.openTime = {}
      if (options.startDate) where.openTime.gte = options.startDate
      if (options.endDate) where.openTime.lte = options.endDate
    }

    const trades = await db.trade.findMany({
      where,
      select: {
        openTime: true,
        profitLoss: true,
      },
      orderBy: { openTime: 'asc' },
    })

    // Build cumulative curve
    let runningBalance = 0
    const curve = trades.map(trade => {
      runningBalance += trade.profitLoss
      return {
        date: trade.openTime,
        balance: parseFloat(runningBalance.toFixed(2)),
      }
    })

    return {
      success: true,
      data: curve,
    }
  } catch (error: any) {
    console.error('getEquityCurve error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch equity curve',
      data: [],
    }
  }
}

/**
 * Get symbol-specific analytics
 */
export const getSymbolAnalytics = async (symbol: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    const trades = await db.trade.findMany({
      where: {
        userId,
        symbol: { contains: symbol, mode: 'insensitive' },
      },
      select: {
        profitLoss: true,
        tradeType: true,
      },
    })

    if (trades.length === 0) {
      return {
        success: false,
        message: 'No trades found for this symbol',
        data: null,
      }
    }

    const winningTrades = trades.filter(t => t.profitLoss > 0).length
    const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0)
    const avgPL = totalPL / trades.length

    return {
      success: true,
      data: {
        symbol,
        totalTrades: trades.length,
        winningTrades,
        losingTrades: trades.length - winningTrades,
        winRate: parseFloat(((winningTrades / trades.length) * 100).toFixed(2)),
        totalPL: parseFloat(totalPL.toFixed(2)),
        avgPL: parseFloat(avgPL.toFixed(2)),
      },
    }
  } catch (error: any) {
    console.error('getSymbolAnalytics error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch symbol analytics',
      data: null,
    }
  }
}

/**
 * Get session-based analytics (London, NY, Asia)
 */
export const getSessionAnalytics = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    const trades = await db.trade.findMany({
      where: {
        userId,
        session: { not: null },
      },
      select: {
        session: true,
        profitLoss: true,
      },
    })

    // Group by session
    const sessionGroups: Record<string, any[]> = {}

    trades.forEach(trade => {
      const sessionType = trade.session || 'UNKNOWN'
      if (!sessionGroups[sessionType]) {
        sessionGroups[sessionType] = []
      }
      sessionGroups[sessionType]!.push(trade)
    })

    const result = Object.entries(sessionGroups).map(([sessionType, trades]) => {
      const winningTrades = trades.filter(t => t.profitLoss > 0).length
      const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0)

      return {
        session: sessionType,
        totalTrades: trades.length,
        winningTrades,
        winRate: parseFloat(((winningTrades / trades.length) * 100).toFixed(2)),
        totalPL: parseFloat(totalPL.toFixed(2)),
        avgPL: parseFloat((totalPL / trades.length).toFixed(2)),
      }
    })

    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error('getSessionAnalytics error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch session analytics',
      data: [],
    }
  }
}

/**
 * Calculate drawdown metrics
 */
export const getDrawdown = async (accountId?: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    const where: any = { userId }
    if (accountId) where.brokerAccountId = accountId

    const trades = await db.trade.findMany({
      where,
      select: { profitLoss: true, openTime: true },
      orderBy: { openTime: 'asc' },
    })

    let peak = 0
    let maxDrawdown = 0
    let runningPL = 0

    trades.forEach(trade => {
      runningPL += trade.profitLoss
      if (runningPL > peak) peak = runningPL

      const drawdown = peak - runningPL
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    })

    const currentDrawdown = peak - runningPL
    const drawdownPercent =
      peak > 0 ? parseFloat(((currentDrawdown / peak) * 100).toFixed(2)) : 0
    const maxDrawdownPercent =
      peak > 0 ? parseFloat(((maxDrawdown / peak) * 100).toFixed(2)) : 0

    return {
      success: true,
      data: {
        currentDrawdown: parseFloat(currentDrawdown.toFixed(2)),
        currentDrawdownPercent: drawdownPercent,
        maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
        maxDrawdownPercent: maxDrawdownPercent,
        peak: parseFloat(peak.toFixed(2)),
      },
    }
  } catch (error: any) {
    console.error('getDrawdown error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch drawdown data',
      data: null,
    }
  }
}
