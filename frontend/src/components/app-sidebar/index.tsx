"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "~/components/ui/sidebar"
import { sidebarMenuItems } from "~/lib/constants"
import Link from "next/link"
import Image from "next/image"
import { UserButton } from "@daveyplate/better-auth-ui"
import { open } from "fs"

export function AppSidebar() {
    const { open } = useSidebar()
  return (
    <Sidebar variant="floating" collapsible="icon">

      <SidebarHeader>
        <div className="flex items-center px-2 py-4">
          <Image
            src="/images/lunoru-1.png"
            width={40}
            height={40}
            alt="Lunoru Logo"
            className="w-4 md:w-6 lg:w-8"
          />
          {open && <span className="ml-2 text-xl font-thin">Lunoru</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <Link href={item.path}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
      <UserButton
        style={{
          backgroundColor: "#B4B0AE"
        }}
        size={open ? "default" : "icon"}
        className="flex items-center justify-center mx-auto transition-all duration-200"
      />
    </SidebarFooter>
    </Sidebar>
  )
}
