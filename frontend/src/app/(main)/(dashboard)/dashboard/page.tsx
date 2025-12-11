import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getAccountSummary } from "~/actions/accounts"
import { getDashboardMetrics } from "~/actions/analytics"
import AccountInfo from "~/components/dashboard/AccountInfo"
import SummaryContent from "~/components/dashboard/SummaryContent"
import { auth } from "~/lib/auth"

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect("/auth/sign-in")

  const [accountSummary, dashboardMetrics] = await Promise.all([
    getAccountSummary(),
    getDashboardMetrics(),
  ])

  const primaryAccount = accountSummary?.data || null
  const metrics = dashboardMetrics?.data || {
    totalTrades: 0,
    winningTrades: 0,
    totalPL: 0,
    winRate: 0,
    activeAccounts: 0,
    totalAccounts: 0,
    dominantEmotion: "NEUTRAL",
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 pb-10 pt-6 space-y-6">
      <AccountInfo
        account={primaryAccount}
        metrics={metrics}
      />
      <SummaryContent metrics={metrics} />
    </div>
  )
}