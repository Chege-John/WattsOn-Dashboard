"use client";

import { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { School as SchoolIcon, Users } from "lucide-react";
import { transformKoboDataToAppFormat } from "@/lib/data/kobo-transformer";
import {
  School,
  Student,
  mockSchools,
  mockStudents,
} from "@/lib/data/mock-data";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function MapPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [activeTab, setActiveTab] = useState<"schools" | "students">("schools");

  // Fetch Kobo data
  useEffect(() => {
    async function fetchData() {
      if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        setError(
          "Mapbox token is missing. Please check your environment variables."
        );
        return;
      }
      try {
        setIsLoading(true);
        const res = await fetch("/api/forms/akGkJBQrKG6gWJ6daFNRtR");
        if (!res.ok)
          throw new Error(
            `Failed to fetch data: ${res.status} ${res.statusText}`
          );
        const data = await res.json();
        const koboData = data.results || data;
        const { students, summary } = transformKoboDataToAppFormat(koboData);
        setStudents(students || []);
        setSchools(summary.schools || []);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load map data");
        setStudents(mockStudents);
        setSchools(mockSchools);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current || mapInitialized) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [36.0, -0.3],
      zoom: 8,
      maxZoom: 15,
      minZoom: 5,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    mapRef.current.on("load", () => {
      setMapInitialized(true);

      const map = mapRef.current!;

      // ✅ Only add if not already added
      if (!map.getSource("schools")) {
        map.addSource("schools", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
      }

      if (!map.getSource("students")) {
        map.addSource("students", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      // ✅ Then safely add the layers
      if (!map.getLayer("school-clusters")) {
        map.addLayer({
          id: "school-clusters",
          type: "circle",
          source: "schools",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#3B82F6",
              100,
              "#2563EB",
              750,
              "#1E3A8A",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              20,
              100,
              30,
              750,
              40,
            ],
            "circle-opacity": 0.8,
          },
        });
      }

      if (!map.getLayer("school-cluster-count")) {
        map.addLayer({
          id: "school-cluster-count",
          type: "symbol",
          source: "schools",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Next Pro Bold"],
            "text-size": 12,
          },
          paint: {
            "text-color": "#ffffff",
          },
        });
      }

      if (!map.getLayer("school-markers")) {
        map.addLayer({
          id: "school-markers",
          type: "circle",
          source: "schools",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#3B82F6",
            "circle-radius": 10,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
      }

      if (!map.getLayer("student-markers")) {
        map.addLayer({
          id: "student-markers",
          type: "circle",
          source: "students",
          paint: {
            "circle-color": "#10B981",
            "circle-radius": 8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          },
        });
      }

      // Initial visibility
      const setLayerVisibility = (layerId: string, visible: boolean) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId,
            "visibility",
            visible ? "visible" : "none"
          );
        }
      };

      setLayerVisibility("school-clusters", activeTab === "schools");
      setLayerVisibility("school-cluster-count", activeTab === "schools");
      setLayerVisibility("school-markers", activeTab === "schools");
      setLayerVisibility("student-markers", activeTab === "students");
    });
  }, [mapInitialized, activeTab]);

  // Dynamically update source data after fetch
  useEffect(() => {
    if (!mapRef.current || !mapInitialized) return;

    const schoolFeatures = schools
      .filter((s) => s.coordinates.lat && s.coordinates.lng)
      .map((school) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [school.coordinates.lng, school.coordinates.lat],
        },
        properties: {
          id: school.id,
          name: school.name,
          type: "school",
          count: school.totalStudents,
        },
      }));

    const studentFeatures = students
      .filter((s) => s.location.lat && s.location.lng)
      .map((student) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [student.location.lng, student.location.lat],
        },
        properties: {
          id: student.id,
          name: student.name,
          type: "student",
          schoolName: student.school.name,
        },
      }));

    const schoolSource = mapRef.current.getSource(
      "schools"
    ) as mapboxgl.GeoJSONSource;
    const studentSource = mapRef.current.getSource(
      "students"
    ) as mapboxgl.GeoJSONSource;

    if (schoolSource) {
      schoolSource.setData({
        type: "FeatureCollection",
        features: schoolFeatures,
      });
    }

    if (studentSource) {
      studentSource.setData({
        type: "FeatureCollection",
        features: studentFeatures,
      });
    }
  }, [schools, students, mapInitialized]);

  // Handle tab change to toggle layer visibility
  useEffect(() => {
    if (!mapRef.current || !mapInitialized) return;

    const setLayerVisibility = (layerId: string, visible: boolean) => {
      mapRef.current!.setLayoutProperty(
        layerId,
        "visibility",
        visible ? "visible" : "none"
      );
    };

    setLayerVisibility("school-clusters", activeTab === "schools");
    setLayerVisibility("school-cluster-count", activeTab === "schools");
    setLayerVisibility("school-markers", activeTab === "schools");
    setLayerVisibility("student-markers", activeTab === "students");
  }, [activeTab, mapInitialized]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Distribution Map</h1>
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md">
            {error}
          </div>
        )}

        <Tabs
          defaultValue="schools"
          onValueChange={(value) =>
            setActiveTab(value as "schools" | "students")
          }
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="schools" className="flex-1 sm:flex-none">
                <SchoolIcon className="mr-2 h-4 w-4" />
                Schools
              </TabsTrigger>
              <TabsTrigger value="students" className="flex-1 sm:flex-none">
                <Users className="mr-2 h-4 w-4" />
                Students
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Badge className="bg-blue-500">{schools.length} Schools</Badge>
              <Badge className="bg-green-500">{students.length} Students</Badge>
            </div>
          </div>

          <TabsContent value="schools" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>School Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-[600px] rounded-md border bg-muted/40 overflow-hidden">
                  <div className="relative w-full h-full">
                    <div ref={mapContainer} className="w-full h-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-[600px] rounded-md border bg-muted/40 overflow-hidden">
                  <div className="relative w-full h-full">
                    <div ref={mapContainer} className="w-full h-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
