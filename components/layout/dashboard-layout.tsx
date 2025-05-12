"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen light:bg-[#fcfbfc]">
      <DashboardSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div
        className={cn(
          "flex flex-col flex-1 transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
