// src/app/(dashboard)/students/[id]/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { transformKoboDataToAppFormat } from "@/lib/data/kobo-transformer";
import { Student } from "@/lib/data/mock-data";

interface StudentDetailPageProps {
  params: { id: string };
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const { id } = params;

  // Ensure base URL is defined
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error("❌ NEXT_PUBLIC_BASE_URL is not defined");
    return (
      <ErrorMessage message="Server configuration error: Missing base URL" />
    );
  }

  // Fetch student data using absolute URL
  const res = await fetch(`${baseUrl}/api/forms/akGkJBQrKG6gWJ6daFNRtR`, {
    cache: "no-store",
  });
  if (!res.ok) {
    console.error(
      "❌ Failed to fetch student data:",
      res.status,
      res.statusText
    );
    return (
      <ErrorMessage
        message={`Failed to load student data: ${res.statusText}`}
      />
    );
  }

  const data = await res.json();
  console.log("📦 API response for student:", data);
  const koboData = data.results || data;
  const { students } = transformKoboDataToAppFormat(koboData);
  console.log("✅ Transformed student data:", students);

  // Find the student with the matching id
  const student = students.find((s) => s.id === id);

  if (!student) {
    console.error("❌ Student not found for ID:", id);
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold">Student not found</h2>
          <p className="text-muted-foreground">
            The student you are looking for doesnt exist.
          </p>
          <Link href="/dashboard/students" passHref>
            <Button className="mt-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Students
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/students" passHref>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={student.photo} alt={student.name} />
                  <AvatarFallback>
                    {student.name.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold">{student.name}</h2>
                  <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                    <Badge variant="outline">{student.gender}</Badge>
                    <Badge variant="outline">Age: {student.age}</Badge>
                    <Badge variant="outline">{student.grade}</Badge>
                    <Badge variant="secondary">
                      {student.careerAspiration}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium text-muted-foreground">School</h3>
                  <p>{student.school?.name || "Unknown"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground">
                    Location
                  </h3>
                  <p>{student.school?.location || "Unknown"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground">
                    Career Aspiration
                  </h3>
                  <p>{student.careerAspiration}</p>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground">
                    Lamp Serial Number
                  </h3>
                  <p className="font-mono">{student.lampSerialNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardHeader>
              <CardTitle>Household Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium text-muted-foreground">
                    Meals Per Day
                  </h3>
                  <p className="text-2xl font-bold">
                    {student.householdInfo.mealsPerDay}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground">
                    Electricity Source
                  </h3>
                  <p className="text-2xl font-bold">
                    {student.householdInfo.electricitySource}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground">
                    Smartphone Access
                  </h3>
                  <p className="text-2xl font-bold">
                    {student.householdInfo.hasSmartphone ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground">
                    Parent Income Source
                  </h3>
                  <p className="text-2xl font-bold">
                    {student.householdInfo.parentIncomeSource}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold">Error</h2>
        <p className="text-muted-foreground">{message}</p>
        <Link href="/dashboard/students" passHref>
          <Button className="mt-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
        </Link>
      </div>
    </DashboardLayout>
  );
}
