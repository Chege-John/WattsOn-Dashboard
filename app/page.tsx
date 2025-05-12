import { redirect } from "next/navigation"

export default function Home() {
  // For MVP, redirect to dashboard
  redirect("/dashboard")
}