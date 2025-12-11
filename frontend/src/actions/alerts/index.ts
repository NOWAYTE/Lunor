'use server'

import { headers } from 'next/headers'
import { auth } from '~/lib/auth'
import { db } from '~/server/db'
import { createAlertSchema, updateAlertSchema } from '~/lib/validations/alerts/alerts'
import type { CreateAlertInput, UpdateAlertInput } from '~/lib/validations/alerts/alerts'

/**
 * Create a new alert
 */
export const createAlert = async (input: CreateAlertInput) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Validate input
    const validated = createAlertSchema.parse(input)

    const alert = await db.alert.create({
      data: {
        userId,
        type: validated.type,
        symbol: validated.symbol,
        triggerValue: validated.triggerValue,
        message: validated.message,
        active: validated.active,
      },
      select: {
        id: true,
        type: true,
        symbol: true,
        message: true,
        active: true,
        createdAt: true,
      },
    })

    return {
      success: true,
      message: 'Alert created successfully',
      data: alert,
    }
  } catch (error: any) {
    console.error('createAlert error:', error)
    return {
      success: false,
      message: error.message || 'Failed to create alert',
    }
  }
}

/**
 * Get all alerts for user
 */
export const getAlerts = async (options?: {
  active?: boolean
  type?: 'PRICE' | 'BEHAVIOR' | 'SESSION'
}) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    const where: any = { userId }

    if (options?.active !== undefined) {
      where.active = options.active
    }

    if (options?.type) {
      where.type = options.type
    }

    const alerts = await db.alert.findMany({
      where,
      select: {
        id: true,
        type: true,
        symbol: true,
        triggerValue: true,
        message: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return {
      success: true,
      data: alerts,
    }
  } catch (error: any) {
    console.error('getAlerts error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch alerts',
      data: [],
    }
  }
}

/**
 * Update alert
 */
export const updateAlert = async (
  alertId: string,
  input: UpdateAlertInput
) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Verify ownership
    const alert = await db.alert.findFirst({
      where: { id: alertId, userId },
    })

    if (!alert) {
      return {
        success: false,
        message: 'Alert not found',
      }
    }

    const validated = updateAlertSchema.parse(input)

    const updated = await db.alert.update({
      where: { id: alertId },
      data: validated,
      select: {
        id: true,
        type: true,
        symbol: true,
        message: true,
        active: true,
        createdAt: true,
      },
    })

    return {
      success: true,
      message: 'Alert updated successfully',
      data: updated,
    }
  } catch (error: any) {
    console.error('updateAlert error:', error)
    return {
      success: false,
      message: error.message || 'Failed to update alert',
    }
  }
}

/**
 * Delete alert
 */
export const deleteAlert = async (alertId: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Verify ownership
    const alert = await db.alert.findFirst({
      where: { id: alertId, userId },
    })

    if (!alert) {
      return {
        success: false,
        message: 'Alert not found',
      }
    }

    await db.alert.delete({
      where: { id: alertId },
    })

    return {
      success: true,
      message: 'Alert deleted successfully',
    }
  } catch (error: any) {
    console.error('deleteAlert error:', error)
    return {
      success: false,
      message: error.message || 'Failed to delete alert',
    }
  }
}

/**
 * Toggle alert active/inactive
 */
export const toggleAlert = async (alertId: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Verify ownership
    const alert = await db.alert.findFirst({
      where: { id: alertId, userId },
    })

    if (!alert) {
      return {
        success: false,
        message: 'Alert not found',
      }
    }

    const updated = await db.alert.update({
      where: { id: alertId },
      data: {
        active: !alert.active,
      },
      select: {
        id: true,
        active: true,
      },
    })

    return {
      success: true,
      message: `Alert ${updated.active ? 'enabled' : 'disabled'} successfully`,
      data: updated,
    }
  } catch (error: any) {
    console.error('toggleAlert error:', error)
    return {
      success: false,
      message: error.message || 'Failed to toggle alert',
    }
  }
}
