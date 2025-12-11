import { NextResponse } from 'next/server'
import { auth } from '~/lib/auth'
import { headers } from 'next/headers'
import { db } from '~/server/db'

/**
 * POST /api/alerts/test
 * Send test alert to verify setup
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
    const { alertId } = await request.json()

    if (!alertId) {
      return NextResponse.json(
        { success: false, message: 'Alert ID required' },
        { status: 400 }
      )
    }

    // Verify alert ownership
    const alert = await db.alert.findFirst({
      where: { id: alertId, userId },
    })

    if (!alert) {
      return NextResponse.json(
        { success: false, message: 'Alert not found' },
        { status: 404 }
      )
    }

    // TODO: Implement actual alert sending logic
    // This could send email, SMS, push notification, etc.
    console.log('Test alert sent:', alert)

    return NextResponse.json({
      success: true,
      message: 'Test alert sent successfully',
      data: {
        alertId,
        type: alert.type,
        testSentAt: new Date(),
      },
    })
  } catch (error: any) {
    console.error('Alert test error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to send test alert',
      },
      { status: 500 }
    )
  }
}
