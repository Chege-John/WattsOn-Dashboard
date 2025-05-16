"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart4,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { transformKoboDataToAppFormat } from "@/lib/data/kobo-transformer";
import { School, mockSchools } from "@/lib/data/mock-data";

const ITEMS_PER_PAGE = 6;

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSchools() {
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
              `Failed to fetch data for UID ${uid}: ${res.status} ${res.statusText}`
            );
          }

          const data = await res.json();
          const koboData = data.results || data;
          allResults.push(...koboData);
        }

        console.log("📦 Combined API response:", allResults);

        const { summary } = transformKoboDataToAppFormat(allResults);
        console.log("✅ Transformed combined school data:", summary.schools);

        setSchools(summary.schools || []);
        setError(null);
      } catch (err: any) {
        console.error("❌ Error fetching schools:", err);
        setError(err.message || "Failed to load schools");
        setSchools(mockSchools); // fallback
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchools();
  }, []);

  const filteredSchools = schools.filter(
    (school) =>
      school?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school?.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSchools.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSchools = filteredSchools.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Schools</h1>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schools..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading schools...
          </div>
        ) : paginatedSchools.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No schools found
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedSchools.map((school) => (
              <Card key={school.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                  <Building2 className="h-8 w-8 mb-2" />
                  <CardTitle>{school.name}</CardTitle>
                  <Badge
                    variant="outline"
                    className="text-white border-white w-fit"
                  >
                    {school.location}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Solar Recipients
                        </p>
                        <p className="text-2xl font-bold">
                          {school.totalStudents}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Without Electricity
                        </span>
                        <span className="font-medium">
                          {school.povertyIndicators.percentWithoutElectricity}%
                        </span>
                      </div>
                      <Progress
                        value={
                          school.povertyIndicators.percentWithoutElectricity
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <BarChart4 className="h-5 w-5 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Avg. Meals Per Day
                        </p>
                        <p className="text-xl font-bold">
                          {school.povertyIndicators.averageMealsPerDay}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 px-6 py-4">
                  <Link href={`/dashboard/schools/${school.id}`}>
                    <Button variant="outline" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredSchools.length)} of{" "}
              {filteredSchools.length} schools
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
