"use client";

import { useEffect, useMemo, useState } from "react";
import { CardStat } from "@/components/dashboard/card-stat";
import { ChartContainer } from "@/components/dashboard/chart-container";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart } from "@/components/dashboard/charts";
import { prepareCareerAspirationsByGender } from "@/lib/chartData";
import { Student, Summary } from "@/lib/data/mock-data";
import { mockStudents, mockSummary } from "@/lib/data/mock-data";
import { transformKoboDataToAppFormat } from "@/lib/data/kobo-transformer";

// Lazy load BarChart
import dynamic from "next/dynamic";
const LazyBarChart = dynamic(
  () => import("@/components/dashboard/charts").then((mod) => mod.BarChart),
  {
    ssr: false, // Only render on the client side
    loading: () => (
      <div className="animate-pulse flex flex-col gap-6 mt-6">
        {/* Skeleton for BarChart */}
        <div className="bg-muted/20 rounded-md h-[600px] w-full"></div>
      </div>
    ), // Show skeleton loader while the component is loading
  }
);

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [summary, setSummary] = useState<Summary>(mockSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/forms/akGkJBQrKG6gWJ6daFNRtR", {
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.statusText}`);
        }

        const data = await res.json();
        const transformed = transformKoboDataToAppFormat(data.results || data);

        if (!isMounted) return;

        // Only update state if data actually changed
        const isSameData =
          JSON.stringify(transformed.students) === JSON.stringify(students) &&
          JSON.stringify(transformed.summary) === JSON.stringify(summary);

        if (!isSameData) {
          setStudents(transformed.students);
          setSummary(transformed.summary);
        }

        setError(null);
      } catch (err) {
        console.error("❌ Error loading data:", err);
        if (isMounted) {
          setError(
            "Failed to load data from KoboToolbox. Using mock data instead."
          );
          setStudents(mockStudents);
          setSummary(mockSummary);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ⏱ Memoize computed data
  const careerAspirationsByGender = useMemo(() => {
    return prepareCareerAspirationsByGender(students);
  }, [students]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 p-4">
          {/* Skeleton Header */}
          <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />

          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`stat-card-${i}`}
                className="h-40 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
              />
            ))}
          </div>

          {/* Middle Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`middle-card-${i}`}
                className="h-[250px] bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
              />
            ))}
          </div>

          {/* Bar Chart */}
          <div className="grid gap-4 grid-cols-1 mt-4">
            <div className="h-[600px] bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <CardStat
            title="Total Students"
            value={summary.totalStudents ?? 0}
            description="Students reached"
            trend="up"
            trendValue="12%"
            className="h-40"
          />
          <CardStat
            title="Total Lamps"
            value={summary.totalLamps ?? 0}
            description="Lamps distributed"
            trend="up"
            trendValue="8%"
            className="h-40"
          />
          <CardStat
            title="Average Age"
            value={summary.averageAge ?? 0}
            description="Years"
            trend="neutral"
            className="h-40"
          />
          <CardStat
            title="Avg. Meals Per Day"
            value={summary.averageMealsPerDay ?? 0}
            description="Meals"
            trend="down"
            trendValue="3%"
            className="h-40"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Households with Smartphones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-[250px]">
                <div className="text-5xl font-bold">
                  {summary.percentWithSmartphones ?? 0}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  of households have smartphones
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Without Electricity Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-[250px]">
                <div className="text-5xl font-bold">
                  {summary.percentWithoutElectricity ?? 0}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  of households have no electricity
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 lg:col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {summary.genderDistribution?.length ? (
                  <PieChart
                    data={summary.genderDistribution}
                    dataKey="count"
                    nameKey="gender"
                    colors={["#875CF5", "#FA2C37", "#FF6900"]}
                    label="Gender"
                    totalAmount={`${summary.genderDistribution.reduce(
                      (acc, val) => acc + val.count,
                      0
                    )}`}
                    showTextAnchor
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No gender distribution data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lazy load BarChart */}
        <div className="grid gap-4 grid-cols-1">
          <ChartContainer title="Most Common Career Aspirations">
            <LazyBarChart data={careerAspirationsByGender} height={600} />
          </ChartContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
