import React from 'react'
import { LayoutGrid, MoreVertical, RefreshCcw, Wallet, Gauge, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'

type AccountInfoProps = {
  account: {
    id: string
    brokerName: string | null
    accountNumber: string | null
    platform: string | null
    status: string | null
    createdAt?: Date | string | null
    lastSyncedAt?: Date | string | null
  } | null
  metrics: {
    totalTrades: number
    winningTrades: number
    totalPL: number
    winRate: number
    activeAccounts: number
    totalAccounts: number
    dominantEmotion: string
  }
}

const formatDate = (value?: Date | string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  return date.toLocaleString()
}

const StatPill = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
    <span className="font-medium text-foreground">{value}</span>
    <span className="mx-1 text-muted-foreground">•</span>
    <span>{label}</span>
  </div>
)

const StatCard = ({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
}) => {
  return (
    <Card className="border-border/50 bg-zinc-900/50">
      <CardContent className="flex items-center gap-3 py-4">
        <div className="rounded-lg bg-zinc-800 p-2 text-muted-foreground">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const AccountInfo: React.FC<AccountInfoProps> = ({ account, metrics }) => {
  const accountLabel = account?.brokerName || 'Broker Account'
  const accountNumber = account?.accountNumber || '—'
  const platform = account?.platform || 'Unknown platform'
  const status = account?.status || 'UNKNOWN'

  return (
    <Card className="border-border/50 bg-zinc-900/60">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-zinc-800 text-amber-300">
            <LayoutGrid className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{platform}</p>
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
              <span>{accountLabel}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{accountNumber}</span>
              <span className="text-muted-foreground">•</span>
              <span className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] uppercase tracking-wide text-foreground">
                {status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <StatPill label="Last sync" value={formatDate(account?.lastSyncedAt)} />
              <StatPill label="Created" value={formatDate(account?.createdAt)} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border/50 bg-zinc-800/40">
            <RefreshCcw className="size-4" />
            Sync now
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <Separator className="bg-border/50" />

      <CardContent className="pt-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Trades" value={metrics.totalTrades} icon={<Wallet className="size-4" />} />
          <StatCard
            label="Win Rate"
            value={`${metrics.winRate.toFixed(2)}%`}
            icon={<TrendingUp className="size-4" />}
          />
          <StatCard
            label="Active Accounts"
            value={`${metrics.activeAccounts}/${metrics.totalAccounts}`}
            icon={<Gauge className="size-4" />}
          />
          <StatCard
            label="Dominant Emotion"
            value={metrics.dominantEmotion}
            icon={<LayoutGrid className="size-4" />}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default AccountInfo