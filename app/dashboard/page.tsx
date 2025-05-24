"use client";

import { useEffect, useMemo, useState, Suspense, useCallback } from "react";
import { CardStat } from "@/components/dashboard/card-stat";
import { ChartContainer } from "@/components/dashboard/chart-container";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prepareCareerAspirationsByGender } from "@/lib/chartData";
import { Student, Summary } from "@/lib/data/mock-data";
import { mockStudents, mockSummary } from "@/lib/data/mock-data";
import { transformKoboDataToAppFormat } from "@/lib/data/kobo-transformer";

// Import the chart components directly
import { BarChart, PieChart } from "@/components/dashboard/charts";

// Constants
const FORM_UIDS = [
  "akGkJBQrKG6gWJ6daFNRtR",
  "aHcZMhtYyZVbHmeSBWekQV",
  "aUBsroNaJkqhgmuXnxCbJT",
  "aXnSzAesKR8e6sp4ZzDAdr",
] as const;

const CACHE_KEY = "dashboard_data";
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
// 5 * 60 * 1000; // 5 minutes

// Types
interface CacheData {
  data: { students: Student[]; summary: Summary };
  timestamp: number;
}

// Fallback loading component
const ChartLoading = ({ height = 250 }: { height?: number }) => (
  <div
    className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md w-full"
    style={{ height: `${height}px` }}
  />
);

// Cache utilities
const getCachedData = (): CacheData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsedCache = JSON.parse(cached) as CacheData;
    const now = Date.now();

    if (now - parsedCache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsedCache;
  } catch {
    return null;
  }
};

const setCachedData = (data: { students: Student[]; summary: Summary }) => {
  try {
    const cacheData: CacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("Failed to cache data:", error);
  }
};

// Optimized data fetching with parallel requests and caching
const fetchAllFormsData = async (signal?: AbortSignal): Promise<any[]> => {
  // Check cache first
  const cachedData = getCachedData();
  if (cachedData) {
    console.log("Using cached data");
    return Promise.resolve([cachedData.data]);
  }


  // Create parallel fetch promises with timeout
  const fetchPromises = FORM_UIDS.map(async (uid) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(`/api/forms/${uid}`, {
        signal: signal || controller.signal,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        uid,
        data: data.results || data,
        success: true,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`Failed to fetch data for UID ${uid}:`, error);
      return {
        uid,
        data: [],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  // Wait for all requests to complete (or fail)
  const results = await Promise.allSettled(fetchPromises);

  // Extract successful results
  const allResults: any[] = [];
  let failedRequests = 0;

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.success) {
      allResults.push(...result.value.data);
    } else {
      failedRequests++;
      if (result.status === "fulfilled") {
        console.error(
          `Failed to fetch ${result.value.uid}:`,
          result.value.error
        );
      }
    }
  });

  // If more than half the requests failed, throw an error
  if (failedRequests > FORM_UIDS.length / 2) {
    throw new Error(
      `Failed to fetch data from ${failedRequests}/${FORM_UIDS.length} forms`
    );
  }

  return allResults;
};

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [summary, setSummary] = useState<Summary>(mockSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues by confirming client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized data loading function
  const loadData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedData = getCachedData();
      if (cachedData) {
        setStudents(cachedData.data.students);
        setSummary(cachedData.data.summary);
        setIsLoading(false);
        return;
      }

      const allResults = await fetchAllFormsData(signal);

      if (signal?.aborted) return;

      const transformed = transformKoboDataToAppFormat(allResults);


      // Validate transformed data
      if (
        !Array.isArray(transformed.students) ||
        !Array.isArray(transformed.summary?.genderDistribution)
      ) {
        console.warn("Invalid transformed data structure, using mock data");
        setError("Invalid data format, using mock data");
        return;
      }

      // Cache the successful result
      setCachedData(transformed);

      setStudents(transformed.students);
      setSummary(transformed.summary);
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;

      console.error("Error loading data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load data. Using mock data."
      );

      // Keep using mock data on error
      setStudents(mockStudents);
      setSummary(mockSummary);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Data loading effect with cleanup
  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadData]);

  // Memoize computed data with dependency optimization
  const careerAspirationsByGender = useMemo(() => {
    return prepareCareerAspirationsByGender(students);
  }, [students]);

  // Memoize validation checks
  const hasValidGenderData = useMemo(() => {
    return (
      summary?.genderDistribution &&
      Array.isArray(summary.genderDistribution) &&
      summary.genderDistribution.length > 0
    );
  }, [summary?.genderDistribution]);

  const hasValidCareerData = useMemo(() => {
    return (
      careerAspirationsByGender &&
      Array.isArray(careerAspirationsByGender) &&
      careerAspirationsByGender.length > 0
    );
  }, [careerAspirationsByGender]);

  // Memoize gender distribution total
  const genderTotal = useMemo(() => {
    if (!hasValidGenderData) return 0;
    return summary.genderDistribution.reduce((acc, val) => acc + val.count, 0);
  }, [hasValidGenderData, summary?.genderDistribution]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    const controller = new AbortController();
    loadData(controller.signal);
  }, [loadData]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 p-4">
          {/* Skeleton content */}
          <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`stat-card-${i}`}
                className="h-40 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
              />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`middle-card-${i}`}
                className="h-[250px] bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
              />
            ))}
          </div>
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
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>
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
                {!mounted ? (
                  <ChartLoading height={250} />
                ) : hasValidGenderData ? (
                  <Suspense fallback={<ChartLoading height={250} />}>
                    <PieChart
                      data={summary.genderDistribution}
                      dataKey="count"
                      nameKey="gender"
                      colors={["#875CF5", "#FA2C37", "#FF6900"]}
                      label="Gender"
                      totalAmount={`${genderTotal}`}
                      showTextAnchor
                    />
                  </Suspense>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No gender distribution data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1">
          <ChartContainer title="Most Common Career Aspirations">
            {!mounted ? (
              <ChartLoading height={600} />
            ) : hasValidCareerData ? (
              <Suspense fallback={<ChartLoading height={600} />}>
                <BarChart data={careerAspirationsByGender} height={600} />
              </Suspense>
            ) : (
              <div className="flex h-[600px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No career aspirations data available
                </p>
              </div>
            )}
          </ChartContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
