"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { transformKoboDataToAppFormat } from "@/lib/data/kobo-transformer";
import { School } from "@/lib/data/mock-data";

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSchool() {
      try {
        setIsLoading(true);

        const formUids = [
          "akGkJBQrKG6gWJ6daFNRtR", // original
          "aHcZMhtYyZVbHmeSBWekQV",
          "aUBsroNaJkqhgmuXnxCbJT",
          "aXnSzAesKR8e6sp4ZzDAdr",
        ];

        const allResults: any[] = [];

        for (const uid of formUids) {
          const res = await fetch(`/api/forms/${uid}`);
          if (!res.ok) {
            throw new Error(
              `Failed to fetch data for UID ${uid}: ${res.statusText}`
            );
          }

          const data = await res.json();
          const koboData = data.results || data;
          allResults.push(...koboData);
        }

        console.log("📦 Combined detail API response:", allResults);

        const { summary } = transformKoboDataToAppFormat(allResults);
        const foundSchool = summary.schools.find((s: School) => s.id === id);

        if (!foundSchool) {
          throw new Error(`School not found for ID: ${id}`);
        }

        setSchool(foundSchool);
        setError(null);
      } catch (err: any) {
        console.error("❌ Error fetching school:", err);
        setError(err.message || "Failed to load school data");
        setSchool(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchool();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Loading school...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !school) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold">
            {error ? "Error" : "School not found"}
          </h2>
          <p className="text-muted-foreground">
            {error || "The school you are looking for doesn't exist."}
          </p>
          <Link href="/dashboard/schools" passHref>
            <Button className="mt-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Schools
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
          <Link href="/dashboard/schools" passHref>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">School Profile</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{school.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h3 className="font-medium text-muted-foreground">Location</h3>
                <p>{school.location}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">
                  Total Students
                </h3>
                <p>{school.totalStudents}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">
                  Percent Without Electricity
                </h3>
                <p>{school.povertyIndicators.percentWithoutElectricity}%</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">
                  Average Meals Per Day
                </h3>
                <p>{school.povertyIndicators.averageMealsPerDay}</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">
                  Percent With Smartphones
                </h3>
                <p>{school.povertyIndicators.percentWithSmartphones}%</p>
              </div>
              <div>
                <h3 className="font-medium text-muted-foreground">
                  Coordinates
                </h3>
                <p>
                  Lat: {school.coordinates.lat}, Lng: {school.coordinates.lng}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
