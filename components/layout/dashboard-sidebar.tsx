"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Home,
  Map,
  Menu,
  School2,
  Sun,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface DashboardSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardSidebar({
  open,
  onOpenChange,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Students",
      href: "/dashboard/students",
      icon: Users,
    },
    {
      title: "Schools",
      href: "/dashboard/schools",
      icon: School2,
    },
    {
      title: "Map",
      href: "/dashboard/map",
      icon: Map,
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      title: "Data Upload",
      href: "/dashboard/upload",
      icon: Upload,
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-all duration-300 ease-in-out",
        open ? "w-64" : "w-[70px]",
        !open && "items-center"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b px-4 py-2",
          !open && "justify-center px-2"
        )}
      >
        <Sun className="h-8 w-8 text-primary" />
        {open && (
          <div className="flex flex-col">
            <span className="text-lg font-semibold">SolarBright</span>
            <span className="text-xs text-muted-foreground">NGO Dashboard</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto", !open && "hidden")}
          onClick={() => onOpenChange(!open)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item, index) => (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-[#FF6900] text-white"
                      : "hover:text-[#FF6900]",
                    !open && "justify-center p-2"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", !open && "h-6 w-6")} />
                  {open && <span>{item.title}</span>}
                </Link>
              </TooltipTrigger>
              {!open && (
                <TooltipContent side="right">{item.title}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        {open && (
          <div className="text-xs text-muted-foreground">
            <p>Econic Earth Foundation</p>
          </div>
        )}
      </div>
    </aside>
  );
}
