"use client"
import { useState } from "react"
import { Button } from "../ui/button"
import Link from "next/link"
import Image from "next/image"
import { Logout } from "~/icons/logout"
import { MenuIcon, X } from "lucide-react"
import GlassSheet from "./glass-sheet"
import Menu from "./menu"

type Props = {}

interface GlassSheetProps {
  children: React.ReactNode
  trigger: React.ReactNode
  className?: string
  triggerClass?: string
  open: boolean
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>
}

const LandingPageNavbar = (props: Props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div
      className="w-full flex justify-between sticky top-0 items-center text-themeTextWhite
    pb-10 z-50 px-4 md:px-6"
    >
      <div className="flex items-center">
        <Image src="/images/lunoru-1.png" width={150} height={150} alt="Logo" className="w-6 md:w-8 lg:w-10" />
        <span className="text-2xl font-thin md:font-bold ml-2">Lunoru</span>
      </div>
      <div className="hidden lg:block">
        <Menu orientation="desktop" />
      </div>
      <div className="flex gap-2 items-center justify-center">
        <Link href="/dashboard" className="hidden sm:block">
          <Button
            variant="outline"
            className="bg-emerald-600 rounded-2xl flex gap-2 border-themeGray hover:bg-emerald-500 text-themeBlack items-center justify-center mx-auto"
          >
            <Logout />
            <span className="hidden sm:inline">Login</span>
          </Button>
        </Link>
        <GlassSheet
          triggerClass="lg:hidden"
          open={isMenuOpen}
          onOpenChange={setIsMenuOpen}
          trigger={
            <Button variant="ghost" className="hover:bg-transparent p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </Button>
          }
        >
          <div className="p-4">
            <Menu orientation="mobile" />
            <Link href="/dashboard" className="block sm:hidden mt-4">
              <Button
                variant="outline"
                className="w-full bg-themeBlack rounded-2xl flex gap-2 border-themeGray hover:bg-themeGray items-center justify-evenly mx-auto"
              >
                <Logout />
                Login
              </Button>
            </Link>
          </div>
        </GlassSheet>
      </div>
    </div>
  )
}

export default LandingPageNavbar