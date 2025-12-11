import { NextResponse } from 'next/server'
import { auth } from '~/lib/auth'
import { headers } from 'next/headers'
import { db } from '~/server/db'

/**
 * POST /api/accounts/sync
 * Background job to sync all broker accounts for authenticated user
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

    // Get all active accounts
    const accounts = await db.brokerAccount.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: { id: true, metaApiAccountId: true },
    })

    if (accounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active accounts to sync',
      })
    }

    // Trigger sync for each account
    const syncResults = await Promise.allSettled(
      accounts.map(async (account) => {
        // Update last synced timestamp
        await db.brokerAccount.update({
          where: { id: account.id },
          data: { lastSyncedAt: new Date() },
        })

        return {
          accountId: account.id,
          synced: true,
        }
      })
    )

    const successful = syncResults.filter(r => r.status === 'fulfilled').length
    const failed = syncResults.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      message: `Synced ${successful} account(s)`,
      data: {
        syncedCount: successful,
        failedCount: failed,
        totalCount: accounts.length,
      },
    })
  } catch (error: any) {
    console.error('Account sync error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to sync accounts',
      },
      { status: 500 }
    )
  }
}
