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
import Image from "next/image";

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
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-[#001b2f] dark:bg-black transition-all duration-300 ease-in-out",
        open ? "w-64" : "w-[70px]",
        !open && "items-center"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center gap-2 border-b px-4 py-2 ",
          !open && "justify-center px-2"
        )}
      >
        {/*<Sun className="h-8 w-8 text-primary" />*/}
        {open && (
          <div className="w-full flex items-center p-4">
            <Image
              src="/wattson.png" // ✅ make sure this matches your file name in /public
              alt="Company Logo"
              width={105}
              height={40}
              className="object-contain"
            />
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto", !open && "hidden")}
          onClick={() => onOpenChange(!open)}
        >
          <Menu className="h-5 w-5 text-white" />
          <span className="sr-only text-white">Toggle menu</span>
        </Button>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2 text">
          {navItems.map((item, index) => (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    pathname === item.href
                      ? "bg-[#0D5C63] text-white" // ✅ updated active color
                      : "text-white hover:text-white hover:[text-shadow:_0_0_8px_rgba(255,255,255,0.9)]",
                    !open && "justify-center p-2"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      !open && "h-6 w-6",
                      "transition-all duration-200"
                    )}
                  />
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
          <div className="text-xs text-muted-foreground text-white">
            <p>Econic Earth Foundation</p>
          </div>
        )}
      </div>
    </aside>
  );
}
