import React from 'react'
import { TrendingUp, Award, Activity, PieChart, Layers, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'

type SummaryContentProps = {
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

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)

const SummaryContent: React.FC<SummaryContentProps> = ({ metrics }) => {
  const profitColor = metrics.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-foreground">Summary</h2>
        <p className="text-sm text-muted-foreground">Performance snapshot across all connected accounts.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-border/50 bg-zinc-900/50 md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <PieChart className="size-4" /> Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 rounded-lg border border-dashed border-border/40 bg-zinc-950 text-muted-foreground grid place-items-center">
              Donut chart coming soon
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <MetricCard
              label="Total P&L"
              value={formatUsd(metrics.totalPL)}
              icon={<TrendingUp className="size-5" />}
              valueClass={profitColor}
            />
            <MetricCard
              label="Win Rate"
              value={`${metrics.winRate.toFixed(2)}%`}
              icon={<Award className="size-5" />}
            />
            <MetricCard
              label="Winning Trades"
              value={`${metrics.winningTrades}/${metrics.totalTrades || 0}`}
              icon={<Activity className="size-5" />}
            />
          </div>

          <Card className="border-border/50 bg-zinc-900/50">
            <CardHeader className="flex flex-col gap-1">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Layers className="size-4" /> Accounts Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">{metrics.activeAccounts} active</p>
                <p className="text-sm text-muted-foreground">of {metrics.totalAccounts} connected accounts</p>
              </div>
              <Separator className="bg-border/30 md:hidden" />
              <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-zinc-800/30 px-3 py-2 text-sm text-foreground">
                <Sparkles className="size-4 text-amber-300" />
                <span className="text-muted-foreground">Dominant emotion:</span>
                <span className="font-semibold text-foreground">{metrics.dominantEmotion}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

const MetricCard = ({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string
  value: string
  icon: React.ReactNode
  valueClass?: string
}) => (
  <Card className="border-border/50 bg-zinc-900/50">
    <CardContent className="flex items-center gap-3 py-4">
      <div className="rounded-lg bg-zinc-800 p-2 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`text-xl font-semibold text-foreground ${valueClass || ''}`}>{value}</p>
      </div>
    </CardContent>
  </Card>
)

export default SummaryContent