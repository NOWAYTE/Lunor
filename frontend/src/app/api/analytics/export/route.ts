import { NextResponse } from 'next/server'
import { auth } from '~/lib/auth'
import { headers } from 'next/headers'
import { db } from '~/server/db'

/**
 * POST /api/analytics/export
 * Export performance data as JSON/CSV
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { format = 'json', accountId } = await request.json()

    // Fetch trades
    const where: any = { userId }
    if (accountId) where.brokerAccountId = accountId

    const trades = await db.trade.findMany({
      where,
      select: {
        id: true,
        symbol: true,
        tradeType: true,
        entryPrice: true,
        exitPrice: true,
        lotSize: true,
        profitLoss: true,
        openTime: true,
        closeTime: true,
        session: true,
        strategyTag: true,
        riskReward: true,
        notes: true,
      },
      orderBy: { openTime: 'desc' },
    })

    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'Symbol',
        'Type',
        'Entry Price',
        'Exit Price',
        'Lot Size',
        'P&L',
        'Open Time',
        'Close Time',
        'Session',
        'Strategy',
        'Risk/Reward',
        'Notes',
      ]

      const rows = trades.map(t => [
        t.symbol,
        t.tradeType,
        t.entryPrice,
        t.exitPrice,
        t.lotSize,
        t.profitLoss,
        t.openTime.toISOString(),
        t.closeTime.toISOString(),
        t.session || '',
        t.strategyTag || '',
        t.riskReward || '',
        t.notes || '',
      ])

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=trades.csv',
        },
      })
    }

    // JSON format (default)
    return NextResponse.json({
      success: true,
      data: {
        exportedAt: new Date(),
        tradeCount: trades.length,
        trades,
      },
    })
  } catch (error: any) {
    console.error('Analytics export error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to export data',
      },
      { status: 500 }
    )
  }
}
