"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BarChart4,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Users,
  MapPin,
  Zap,
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc,
  Download,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transformKoboDataToAppFormat } from "@/lib/data/kobo-transformer";
import { School, mockSchools } from "@/lib/data/mock-data";

// Constants
const FORM_UIDS = [
  "akGkJBQrKG6gWJ6daFNRtR",
  "aHcZMhtYyZVbHmeSBWekQV",
  "aUBsroNaJkqhgmuXnxCbJT",
  "aXnSzAesKR8e6sp4ZzDAdr",
] as const;

const ITEMS_PER_PAGE_OPTIONS = [6, 12, 24, 48];
const DEFAULT_ITEMS_PER_PAGE = 12;

const CACHE_KEY = "schools_data";
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// Types
interface CacheData {
  schools: School[];
  timestamp: number;
}

type SortOption = "name" | "students" | "electricity" | "meals";
type SortDirection = "asc" | "desc";

// Cache utilities
const getCachedSchools = (): School[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsedCache = JSON.parse(cached) as CacheData;
    const now = Date.now();
    const timeRemaining = CACHE_DURATION - (now - parsedCache.timestamp);

    if (timeRemaining <= 0) {
      localStorage.removeItem(CACHE_KEY);
      console.log("Schools cache expired, will fetch fresh data");
      return null;
    }

    console.log(
      `Using cached schools data (${Math.round(
        timeRemaining / 3600000
      )}h remaining)`
    );
    return parsedCache.schools;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCachedSchools = (schools: School[]) => {
  try {
    const cacheData: CacheData = {
      schools,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log(`Schools data cached for 6 hours`);
  } catch (error) {
    console.warn("Failed to cache schools data:", error);
  }
};

// Optimized data fetching
const fetchAllSchoolsData = async (signal?: AbortSignal): Promise<School[]> => {
  // Check cache first
  const cachedSchools = getCachedSchools();
  if (cachedSchools) {
    return cachedSchools;
  }

  console.log("Fetching fresh schools data from APIs");

  // Parallel fetch with timeout
  const fetchPromises = FORM_UIDS.map(async (uid) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

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
      console.warn(`Failed to fetch schools data for UID ${uid}:`, error);
      return {
        uid,
        data: [],
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  const allResults: any[] = [];
  let failedRequests = 0;

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.success) {
      allResults.push(...result.value.data);
    } else {
      failedRequests++;
    }
  });

  if (failedRequests === FORM_UIDS.length) {
    throw new Error("Failed to fetch data from all sources");
  }

  const { summary } = transformKoboDataToAppFormat(allResults);
  const schools = summary.schools || [];

  // Cache successful result
  setCachedSchools(schools);

  return schools;
};

// Loading skeleton component
const SchoolCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader className="bg-gray-200 dark:bg-gray-700 animate-pulse">
      <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-2" />
    </CardHeader>
    <CardContent className="pt-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          </div>
        </div>
      </div>
    </CardContent>
    <CardFooter className="border-t bg-muted/50">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
    </CardFooter>
  </Card>
);

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized data loading function
  const loadSchools = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const schoolsData = await fetchAllSchoolsData(signal);

      if (signal?.aborted) return;

      console.log("✅ Loaded schools:", schoolsData);
      setSchools(schoolsData);
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;

      console.error("❌ Error fetching schools:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load schools";
      setError(errorMessage);
      setSchools(mockSchools); // fallback
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    const controller = new AbortController();
    loadSchools(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadSchools]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    const controller = new AbortController();
    loadSchools(controller.signal);
  }, [loadSchools]);

  // Memoized filtered and sorted schools
  const processedSchools = useMemo(() => {
    let filtered = schools.filter((school) => {
      if (!school?.name && !school?.location) return false;

      const searchLower = searchQuery.toLowerCase();
      return (
        school.name?.toLowerCase().includes(searchLower) ||
        school.location?.toLowerCase().includes(searchLower)
      );
    });

    // Sort schools
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "students":
          aValue = a.totalStudents || 0;
          bValue = b.totalStudents || 0;
          break;
        case "electricity":
          aValue = a.povertyIndicators?.percentWithoutElectricity || 0;
          bValue = b.povertyIndicators?.percentWithoutElectricity || 0;
          break;
        case "meals":
          aValue = a.povertyIndicators?.averageMealsPerDay || 0;
          bValue = b.povertyIndicators?.averageMealsPerDay || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [schools, searchQuery, sortBy, sortDirection]);

  // Memoized pagination
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(processedSchools.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSchools = processedSchools.slice(
      startIndex,
      startIndex + itemsPerPage
    );

    return {
      totalPages,
      startIndex,
      paginatedSchools,
      totalSchools: processedSchools.length,
    };
  }, [processedSchools, currentPage, itemsPerPage]);

  // Export to CSV function
  const handleExportCSV = useCallback(() => {
    const csvContent = [
      [
        "School Name",
        "Location",
        "Total Students",
        "Without Electricity (%)",
        "Avg Meals Per Day",
      ].join(","),
      ...processedSchools.map((school) =>
        [
          `"${school.name || ""}"`,
          `"${school.location || ""}"`,
          school.totalStudents || 0,
          school.povertyIndicators?.percentWithoutElectricity || 0,
          school.povertyIndicators?.averageMealsPerDay || 0,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `schools-data-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [processedSchools]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortDirection, itemsPerPage]);

  if (!mounted) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Schools</h1>
              <p className="text-muted-foreground mt-1">
                Manage and monitor school participation
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                disabled={isLoading || processedSchools.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools or locations..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={sortBy}
                onValueChange={(value: SortOption) => setSortBy(value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">School Name</SelectItem>
                  <SelectItem value="students">Student Count</SelectItem>
                  <SelectItem value="electricity">
                    Without Electricity
                  </SelectItem>
                  <SelectItem value="meals">Meals Per Day</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                }
              >
                {sortDirection === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Show:
              </span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full" />
              {error}
            </div>
          </div>
        )}

        {/* Results Summary */}
        {!isLoading && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {paginationData.startIndex + 1} to{" "}
              {Math.min(
                paginationData.startIndex + itemsPerPage,
                paginationData.totalSchools
              )}{" "}
              of {paginationData.totalSchools} schools
              {searchQuery && ` (filtered from ${schools.length} total)`}
            </div>
            {paginationData.totalSchools > 0 && (
              <div>
                Total students:{" "}
                {processedSchools.reduce(
                  (sum, school) => sum + (school.totalStudents || 0),
                  0
                )}
              </div>
            )}
          </div>
        )}

        {/* Schools Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <SchoolCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : paginationData.paginatedSchools.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchQuery ? "No schools found" : "No schools available"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Schools data will appear here once available"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginationData.paginatedSchools.map((school) => (
              <Card
                key={school.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white relative">
                  <div className="absolute top-2 right-2">
                    <Building2 className="h-6 w-6 opacity-80" />
                  </div>
                  <CardTitle className="text-lg leading-tight pr-8">
                    {school.name || "Unnamed School"}
                  </CardTitle>
                  <div className="flex items-center gap-1 mt-2">
                    <MapPin className="h-3 w-3" />
                    <Badge
                      variant="outline"
                      className="text-white border-white/50 bg-white/10 text-xs"
                    >
                      {school.location || "Unknown Location"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  {/* Student Count */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Solar Recipients
                      </p>
                      <p className="text-2xl font-bold">
                        {school.totalStudents || 0}
                      </p>
                    </div>
                  </div>

                  {/* Electricity Access */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span className="text-muted-foreground">
                          Without Electricity
                        </span>
                      </div>
                      <span className="font-semibold text-amber-600">
                        {school.povertyIndicators?.percentWithoutElectricity ||
                          0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        school.povertyIndicators?.percentWithoutElectricity || 0
                      }
                      className="h-2"
                    />
                  </div>

                  {/* Meals Per Day */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <BarChart4 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Avg. Meals Per Day
                      </p>
                      <p className="text-xl font-bold">
                        {school.povertyIndicators?.averageMealsPerDay || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t bg-muted/30 px-6 py-4">
                  <Link
                    href={`/dashboard/schools/${school.id}`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {paginationData.totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-between border-t pt-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page indicators */}
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, paginationData.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (paginationData.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= paginationData.totalPages - 2) {
                      pageNum = paginationData.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10 h-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(paginationData.totalPages, prev + 1)
                  )
                }
                disabled={currentPage === paginationData.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {paginationData.totalPages}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
