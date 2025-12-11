'use server'

import { headers } from 'next/headers'
import { auth } from '~/lib/auth'
import { db } from '~/server/db'
import {
  createJournalEntrySchema,
  updateJournalEntrySchema,
  createEmotionRecordSchema,
} from '~/lib/validations/journal/journal'
import type {
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
  CreateEmotionRecordInput,
} from '~/lib/validations/journal/journal'

/**
 * Create a new journal entry
 */
export const createJournalEntry = async (input: CreateJournalEntryInput) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Validate input
    const validated = createJournalEntrySchema.parse(input)

    // If tradeId provided, verify it belongs to user
    if (validated.tradeId) {
      const trade = await db.trade.findFirst({
        where: { id: validated.tradeId, userId },
      })

      if (!trade) {
        return {
          success: false,
          message: 'Trade not found',
        }
      }
    }

    const entry = await db.journalEntry.create({
      data: {
        userId,
        tradeId: validated.tradeId,
        title: validated.title,
        content: validated.content,
        voiceUrl: validated.voiceUrl,
        transcript: validated.transcript,
        sentiment: validated.sentiment,
        tags: validated.tags,
      },
      select: {
        id: true,
        title: true,
        content: true,
        sentiment: true,
        createdAt: true,
      },
    })

    return {
      success: true,
      message: 'Journal entry created successfully',
      data: entry,
    }
  } catch (error: any) {
    console.error('createJournalEntry error:', error)
    return {
      success: false,
      message: error.message || 'Failed to create journal entry',
    }
  }
}

/**
 * Get journal entries with optional filters
 */
export const getJournalEntries = async (options?: {
  tradeId?: string
  startDate?: Date
  endDate?: Date
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
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

    const where: any = { userId }

    if (options?.tradeId) where.tradeId = options.tradeId
    if (options?.sentiment) where.sentiment = options.sentiment
    if (options?.startDate || options?.endDate) {
      where.createdAt = {}
      if (options.startDate) where.createdAt.gte = options.startDate
      if (options.endDate) where.createdAt.lte = options.endDate
    }

    const [entries, total] = await Promise.all([
      db.journalEntry.findMany({
        where,
        select: {
          id: true,
          title: true,
          content: true,
          sentiment: true,
          tags: true,
          voiceUrl: true,
          transcript: true,
          createdAt: true,
          trade: {
            select: {
              id: true,
              symbol: true,
              tradeType: true,
              profitLoss: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.journalEntry.count({ where }),
    ])

    return {
      success: true,
      data: entries,
      total,
      pages: Math.ceil(total / limit),
    }
  } catch (error: any) {
    console.error('getJournalEntries error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch journal entries',
      data: [],
    }
  }
}

/**
 * Update journal entry
 */
export const updateJournalEntry = async (
  entryId: string,
  input: UpdateJournalEntryInput
) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Verify ownership
    const entry = await db.journalEntry.findFirst({
      where: { id: entryId, userId },
    })

    if (!entry) {
      return {
        success: false,
        message: 'Journal entry not found',
      }
    }

    const validated = updateJournalEntrySchema.parse(input)

    const updated = await db.journalEntry.update({
      where: { id: entryId },
      data: validated,
      select: {
        id: true,
        title: true,
        content: true,
        sentiment: true,
      },
    })

    return {
      success: true,
      message: 'Journal entry updated successfully',
      data: updated,
    }
  } catch (error: any) {
    console.error('updateJournalEntry error:', error)
    return {
      success: false,
      message: error.message || 'Failed to update journal entry',
    }
  }
}

/**
 * Delete journal entry
 */
export const deleteJournalEntry = async (entryId: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    // Verify ownership
    const entry = await db.journalEntry.findFirst({
      where: { id: entryId, userId },
    })

    if (!entry) {
      return {
        success: false,
        message: 'Journal entry not found',
      }
    }

    await db.journalEntry.delete({
      where: { id: entryId },
    })

    return {
      success: true,
      message: 'Journal entry deleted successfully',
    }
  } catch (error: any) {
    console.error('deleteJournalEntry error:', error)
    return {
      success: false,
      message: error.message || 'Failed to delete journal entry',
    }
  }
}

/**
 * Create emotion record
 */
export const createEmotionRecord = async (input: CreateEmotionRecordInput) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) return null

    const userId = session.user.id

    const validated = createEmotionRecordSchema.parse(input)

    const record = await db.emotionRecord.create({
      data: {
        userId,
        emotion: validated.emotion,
        intensity: validated.intensity,
      },
      select: {
        id: true,
        emotion: true,
        intensity: true,
        notedAt: true,
      },
    })

    return {
      success: true,
      message: 'Emotion recorded successfully',
      data: record,
    }
  } catch (error: any) {
    console.error('createEmotionRecord error:', error)
    return {
      success: false,
      message: error.message || 'Failed to create emotion record',
    }
  }
}

/**
 * Get emotion statistics
 */
export const getEmotionStats = async (options?: {
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

    if (options?.startDate || options?.endDate) {
      where.notedAt = {}
      if (options.startDate) where.notedAt.gte = options.startDate
      if (options.endDate) where.notedAt.lte = options.endDate
    }

    const records = await db.emotionRecord.findMany({
      where,
      select: {
        emotion: true,
        intensity: true,
      },
    })

    // Group by emotion type
    const emotionGroups: Record<string, number[]> = {}
    records.forEach(record => {
      if (!emotionGroups[record.emotion]) emotionGroups[record.emotion] = []
      emotionGroups[record.emotion]!.push(record.intensity)
    })

    // Calculate stats per emotion
    const stats = Object.entries(emotionGroups).map(([emotion, intensities]) => ({
      emotion,
      count: intensities.length,
      avgIntensity: parseFloat(
        (intensities.reduce((a, b) => a + b, 0) / intensities.length).toFixed(1)
      ),
      maxIntensity: Math.max(...intensities),
      minIntensity: Math.min(...intensities),
    }))

    return {
      success: true,
      data: {
        totalRecords: records.length,
        stats,
      },
    }
  } catch (error: any) {
    console.error('getEmotionStats error:', error)
    return {
      success: false,
      message: error.message || 'Failed to fetch emotion stats',
      data: null,
    }
  }
}

/**
 * Analyze emotions over time (correlate with trades)
 */
export const analyzeEmotions = async (options?: {
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

    if (options?.startDate || options?.endDate) {
      where.notedAt = {}
      if (options.startDate) where.notedAt.gte = options.startDate
      if (options.endDate) where.notedAt.lte = options.endDate
    }

    const [emotions, trades] = await Promise.all([
      db.emotionRecord.findMany({
        where,
        orderBy: { notedAt: 'desc' },
      }),
      db.trade.findMany({
        where: {
          userId,
          ...(options?.startDate && { openTime: { gte: options.startDate } }),
          ...(options?.endDate && { openTime: { lte: options.endDate } }),
        },
        select: {
          profitLoss: true,
          openTime: true,
        },
      }),
    ])

    // Calculate daily averages
    const dailyEmotions: Record<string, any> = {}
    emotions.forEach(emotion => {
      const dateStr = emotion.notedAt.toISOString().split('T')[0] || 'unknown'
      const date = dateStr as string
      if (!dailyEmotions[date]) {
        dailyEmotions[date] = { emotions: [], totalIntensity: 0, count: 0 }
      }
      dailyEmotions[date]!.emotions.push(emotion.emotion)
      dailyEmotions[date]!.totalIntensity += emotion.intensity
      dailyEmotions[date]!.count += 1
    })

    const dailyAverage = Object.entries(dailyEmotions).map(([date, data]) => ({
      date,
      avgIntensity: parseFloat((data.totalIntensity / data.count).toFixed(1)),
      emotionCount: data.count,
      dominantEmotion: data.emotions[0],
    }))

    const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0)
    const avgTradeSize = trades.length > 0 ? totalPL / trades.length : 0

    return {
      success: true,
      data: {
        dailyAverage,
        totalTradesAnalyzed: trades.length,
        totalPL: parseFloat(totalPL.toFixed(2)),
        avgTradeSize: parseFloat(avgTradeSize.toFixed(2)),
      },
    }
  } catch (error: any) {
    console.error('analyzeEmotions error:', error)
    return {
      success: false,
      message: error.message || 'Failed to analyze emotions',
      data: null,
    }
  }
}
