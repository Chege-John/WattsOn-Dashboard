"use client"

import { Bell, Menu } from "lucide-react"
import { UserNav } from "./user-nav"
import { ModeToggle } from "../mode-toggle"
import { Button } from "../ui/button"

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden" 
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Button>
        <ModeToggle />
        <UserNav />
      </div>
    </header>
  )
}