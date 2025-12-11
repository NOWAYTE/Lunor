import { auth } from "~/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import AccountInfo from "~/components/dashboard/AccountInfo"
import SummaryContent from "~/components/dashboard/SummaryContent"

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
      })

      if(!session) redirect("/auth/sign-in")
    return(
  <div className="max-w-screen-2xl mx-auto items-center">
    <div>
      <AccountInfo />
      <SummaryContent />
    </div>
  </div>
  )

}