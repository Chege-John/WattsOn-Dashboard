"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Building2,
  Users,
  MapPin,
  Zap,
  Smartphone,
  UtensilsCrossed,
  Navigation,
  Share2,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  BarChart4,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { transformKoboDataToAppFormat } from "@/lib/data/kobo-transformer";
import { School } from "@/lib/data/mock-data";

// Constants
const FORM_UIDS = [
  "akGkJBQrKG6gWJ6daFNRtR",
  "aHcZMhtYyZVbHmeSBWekQV",
  "aUBsroNaJkqhgmuXnxCbJT",
  "aXnSzAesKR8e6sp4ZzDAdr",
] as const;

const CACHE_KEY = "schools_detail_data";
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// Types
interface CacheData {
  schools: School[];
  timestamp: number;
}

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
      return null;
    }

    console.log(
      `Using cached schools data for detail view (${Math.round(
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
  } catch (error) {
    console.warn("Failed to cache schools data:", error);
  }
};

// Optimized data fetching
const fetchSchoolsData = async (signal?: AbortSignal): Promise<School[]> => {
  // Check cache first
  const cachedSchools = getCachedSchools();
  if (cachedSchools) {
    return cachedSchools;
  }

  console.log("Fetching fresh schools data for detail view");

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
      console.warn(`Failed to fetch data for UID ${uid}:`, error);
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

// Loading skeleton components
const DetailSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>

    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// Utility functions
const formatCoordinate = (coord: number): string => {
  return coord.toFixed(6);
};

const getGoogleMapsUrl = (lat: number, lng: number, name: string): string => {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(
    name
  )}`;
};

const getElectricityStatus = (
  percentage: number
): { color: string; label: string; icon: React.ReactNode } => {
  if (percentage >= 80) {
    return {
      color: "text-red-600",
      label: "Critical Need",
      icon: <EyeOff className="h-4 w-4" />,
    };
  } else if (percentage >= 50) {
    return {
      color: "text-orange-600",
      label: "High Need",
      icon: <Eye className="h-4 w-4" />,
    };
  } else if (percentage >= 20) {
    return {
      color: "text-yellow-600",
      label: "Moderate Need",
      icon: <Zap className="h-4 w-4" />,
    };
  } else {
    return {
      color: "text-green-600",
      label: "Good Access",
      icon: <Zap className="h-4 w-4" />,
    };
  }
};

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized data loading function
  const loadData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const schoolsData = await fetchSchoolsData(signal);

      if (signal?.aborted) return;

      console.log("✅ Loaded schools for detail:", schoolsData);
      setSchools(schoolsData);
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;

      console.error("❌ Error fetching school detail:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load school data";
      setError(errorMessage);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadData]);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    const controller = new AbortController();
    loadData(controller.signal);
  }, [loadData]);

  // Find the specific school
  const school = useMemo(() => {
    return schools.find((s: School) => s.id === id) || null;
  }, [schools, id]);

  // Share functionality
  const handleShare = useCallback(async () => {
    if (!school) return;

    const shareData = {
      title: `${school.name} - School Profile`,
      text: `${school.name} in ${school.location} - ${school.totalStudents} students receiving solar lamps`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
        console.log("Link copied to clipboard");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  }, [school]);

  // Export school data
  const handleExport = useCallback(() => {
    if (!school) return;

    const data = {
      name: school.name,
      location: school.location,
      totalStudents: school.totalStudents,
      coordinates: school.coordinates,
      povertyIndicators: school.povertyIndicators,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${school.name.replace(/\s+/g, "_")}_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [school]);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <DetailSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !school) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {error ? "Unable to Load School" : "School Not Found"}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {error ||
                "The school you are looking for doesn't exist or may have been removed."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Link href="/dashboard/schools">
              <Button>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Schools
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const electricityStatus = getElectricityStatus(
    school.povertyIndicators?.percentWithoutElectricity || 0
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/schools">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {school.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {school.location}
                  </span>
                </div>
              </div>
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
              <Button onClick={handleShare} variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-fit">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Stats */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Key Metrics */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Solar Recipients
                            </p>
                            <p className="text-3xl font-bold">
                              {school.totalStudents}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total students
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className={`border-l-4 ${
                        electricityStatus.color.includes("red")
                          ? "border-l-red-500"
                          : electricityStatus.color.includes("orange")
                          ? "border-l-orange-500"
                          : electricityStatus.color.includes("yellow")
                          ? "border-l-yellow-500"
                          : "border-l-green-500"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-lg ${
                              electricityStatus.color.includes("red")
                                ? "bg-red-50 dark:bg-red-900/20"
                                : electricityStatus.color.includes("orange")
                                ? "bg-orange-50 dark:bg-orange-900/20"
                                : electricityStatus.color.includes("yellow")
                                ? "bg-yellow-50 dark:bg-yellow-900/20"
                                : "bg-green-50 dark:bg-green-900/20"
                            }`}
                          >
                            <Zap
                              className={`h-6 w-6 ${electricityStatus.color
                                .replace("text-", "text-")
                                .replace("-600", "-600 dark:")
                                .replace("-600 dark:", "-600 dark:text-")}`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Electricity Access
                            </p>
                            <p className="text-3xl font-bold">
                              {school.povertyIndicators
                                ?.percentWithoutElectricity || 0}
                              %
                            </p>
                            <Badge
                              variant="outline"
                              className={`${electricityStatus.color} border-current`}
                            >
                              {electricityStatus.label}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart4 className="h-5 w-5" />
                        Poverty Indicators & Living Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Without Electricity */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">
                              Households Without Electricity
                            </span>
                          </div>
                          <span className="text-lg font-bold">
                            {school.povertyIndicators
                              ?.percentWithoutElectricity || 0}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            school.povertyIndicators
                              ?.percentWithoutElectricity || 0
                          }
                          className="h-2"
                        />
                        <p className="text-sm text-muted-foreground">
                          {school.povertyIndicators
                            ?.percentWithoutElectricity || 0}
                          % of households in this school&#39;s community lack
                          access to electricity
                        </p>
                      </div>

                      <Separator />

                      {/* Meals Per Day */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <UtensilsCrossed className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium">Average Meals Per Day</p>
                            <p className="text-sm text-muted-foreground">
                              Nutritional indicator
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {school.povertyIndicators?.averageMealsPerDay || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            meals/day
                          </p>
                        </div>
                      </div>

                      {/* Smartphone Access */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <Smartphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium">Smartphone Access</p>
                            <p className="text-sm text-muted-foreground">
                              Digital connectivity
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {school.povertyIndicators?.percentWithSmartphones ||
                              0}
                            %
                          </p>
                          <p className="text-sm text-muted-foreground">
                            have smartphones
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() =>
                          window.open(
                            getGoogleMapsUrl(
                              school.coordinates?.lat || 0,
                              school.coordinates?.lng || 0,
                              school.name
                            ),
                            "_blank"
                          )
                        }
                      >
                        <Navigation className="mr-2 h-4 w-4" />
                        View on Maps
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleShare}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share School
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={handleExport}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Location Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-medium">{school.location}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCoordinate(school.coordinates?.lat || 0)},{" "}
                          {formatCoordinate(school.coordinates?.lng || 0)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          window.open(
                            getGoogleMapsUrl(
                              school.coordinates?.lat || 0,
                              school.coordinates?.lng || 0,
                              school.name
                            ),
                            "_blank"
                          )
                        }
                      >
                        <Globe className="mr-2 h-4 w-4" />
                        Open in Maps
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="demographics" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Population Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Students
                      </span>
                      <span className="font-semibold">
                        {school.totalStudents}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Average Household Size
                      </span>
                      <span className="font-semibold">N/A</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Technology Access</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Smartphone Access
                        </span>
                        <span className="font-semibold">
                          {school.povertyIndicators?.percentWithSmartphones ||
                            0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          school.povertyIndicators?.percentWithSmartphones || 0
                        }
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Electricity Access
                        </span>
                        <span className="font-semibold">
                          {100 -
                            (school.povertyIndicators
                              ?.percentWithoutElectricity || 0)}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          100 -
                          (school.povertyIndicators
                            ?.percentWithoutElectricity || 0)
                        }
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">
                        School Name
                      </h4>
                      <p className="text-lg">{school.name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">
                        Location
                      </h4>
                      <p>{school.location}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground mb-1">
                        Coordinates
                      </h4>
                      <div className="font-mono text-sm bg-muted p-2 rounded">
                        <p>
                          Latitude:{" "}
                          {formatCoordinate(school.coordinates?.lat || 0)}
                        </p>
                        <p>
                          Longitude:{" "}
                          {formatCoordinate(school.coordinates?.lng || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Map Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() =>
                        window.open(
                          getGoogleMapsUrl(
                            school.coordinates?.lat || 0,
                            school.coordinates?.lng || 0,
                            school.name
                          ),
                          "_blank"
                        )
                      }
                      className="w-full"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Open in Google Maps
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const coords = `${school.coordinates?.lat || 0},${
                          school.coordinates?.lng || 0
                        }`;
                        navigator.clipboard.writeText(coords);
                      }}
                      className="w-full"
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      Copy Coordinates
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
