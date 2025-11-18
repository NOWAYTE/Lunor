import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { AppSidebar } from "~/components/app-sidebar"
import { cookies } from "next/headers"
import Infobar from "~/components/infobar"
import { UserButton } from "@daveyplate/better-auth-ui"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebarOpen")?.value === "true"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/60 backdrop-blur-md">
          <div className="flex items-center">
            <SidebarTrigger size="icon-lg" className="mr-2" />
            <Infobar />
          </div>
          <UserButton size="icon"/>
          </header>
          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}