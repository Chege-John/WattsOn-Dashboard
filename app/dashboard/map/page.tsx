"use client";

import { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { School as SchoolIcon, Users, Info } from "lucide-react";
import { transformKoboDataToAppFormat } from "@/lib/data/kobo-transformer";
import {
  School,
  Student,
  mockSchools,
  mockStudents,
} from "@/lib/data/mock-data";
import type { Feature, Point, GeoJsonProperties } from "geojson";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function MapPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [activeTab, setActiveTab] = useState<"schools" | "students">("schools");
  const [mapStyle] = useState("mapbox://styles/mapbox/streets-v11");

  // Fetch data
  useEffect(() => {
    async function fetchData() {
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

        const { students, summary } = transformKoboDataToAppFormat(allResults);
        setStudents(students || []);
        setSchools(summary.schools || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error loading map data");
        setStudents(mockStudents);
        setSchools(mockSchools);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapInitialized) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [36.0, -0.3],
      zoom: 8,
      attributionControl: false,
    });

    mapRef.current = map;

    // Add custom controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );
    map.addControl(new mapboxgl.ScaleControl(), "bottom-left");

    // Create a reusable popup
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: "300px",
      className: "custom-popup",
    });

    // Wait for style to load before adding sources and layers
    map.on("load", () => {
      // Add custom map style layer
      map.addSource("schools", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addSource("students", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // School symbols
      map.addLayer({
        id: "school-markers",
        type: "circle",
        source: "schools",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#3B82F6",
          "circle-radius": 12,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });

      // School icon
      map.addLayer({
        id: "school-symbols",
        type: "symbol",
        source: "schools",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": "school-15",
          "icon-size": 1,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      // Clusters
      map.addLayer({
        id: "school-clusters",
        type: "circle",
        source: "schools",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#4299E1", // light blue for small clusters
            5,
            "#3182CE", // medium blue for medium clusters
            15,
            "#2C5282", // dark blue for large clusters
          ],
          "circle-radius": ["step", ["get", "point_count"], 20, 5, 30, 15, 40],
          "circle-opacity": 0.9,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.5,
        },
      });

      map.addLayer({
        id: "school-cluster-count",
        type: "symbol",
        source: "schools",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Student markers
      map.addLayer({
        id: "student-markers",
        type: "circle",
        source: "students",
        paint: {
          "circle-color": "#10B981",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.8,
        },
      });

      // Student symbols
      map.addLayer({
        id: "student-symbols",
        type: "symbol",
        source: "students",
        layout: {
          "icon-image": "marker-15",
          "icon-size": 1,
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      // Add hover effect for schools
      map.on("mouseenter", "school-markers", (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = "pointer";

          const feature = e.features[0];
          const coordinates = (feature.geometry as Point).coordinates as [
            number,
            number
          ];

          const props = feature.properties;
          if (props) {
            const html = `
              <div class="p-2">
                <h3 class="font-bold text-blue-600">${
                  props.name || "School"
                }</h3>
                <p class="text-gray-700">Students: ${props.count || 0}</p>
              </div>
            `;

            popupRef.current?.setLngLat(coordinates).setHTML(html).addTo(map);
          }
        }
      });

      map.on("mouseleave", "school-markers", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });

      // Add hover effect for students
      map.on("mouseenter", "student-markers", (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = "pointer";

          const feature = e.features[0];
          const coordinates = (feature.geometry as Point).coordinates as [
            number,
            number
          ];

          const props = feature.properties;
          if (props) {
            const html = `
              <div class="p-2">
                <h3 class="font-bold text-green-600">${
                  props.name || "Student"
                }</h3>
                <p class="text-gray-700">ID: ${props.id || "Unknown"}</p>
              </div>
            `;

            popupRef.current?.setLngLat(coordinates).setHTML(html).addTo(map);
          }
        }
      });

      map.on("mouseleave", "student-markers", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });

      // Handle cluster clicks
      // Handle cluster clicks
      map.on("click", "school-clusters", (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const clusterId = feature.properties?.cluster_id;
          const source = map.getSource("schools") as mapboxgl.GeoJSONSource;

          source.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || typeof zoom !== "number") return; // Ensure zoom is a number

            if (feature.geometry.type === "Point") {
              map.easeTo({
                center: (feature.geometry as Point).coordinates as [
                  number,
                  number
                ],
                zoom: zoom, // Safe to pass zoom now
              });
            }
          });
        }
      });

      setMapInitialized(true);

      // Initial data update once map is loaded
      const schoolFeatures: Array<Feature<Point, GeoJsonProperties>> = schools
        .filter((s) => s.coordinates.lat && s.coordinates.lng)
        .map((school) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [school.coordinates.lng, school.coordinates.lat],
          },
          properties: {
            id: school.id,
            name: school.name,
            type: "school",
            count: school.totalStudents,
          },
        }));

      const studentFeatures: Array<Feature<Point, GeoJsonProperties>> = students
        .filter((s) => s.location.lat && s.location.lng)
        .map((student) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [student.location.lng, student.location.lat],
          },
          properties: {
            id: student.id,
            name: student.name,
            type: "student",
          },
        }));

      try {
        const schoolsSource = map.getSource("schools");
        if (schoolsSource) {
          (schoolsSource as mapboxgl.GeoJSONSource).setData({
            type: "FeatureCollection",
            features: schoolFeatures,
          });
        }

        const studentsSource = map.getSource("students");
        if (studentsSource) {
          (studentsSource as mapboxgl.GeoJSONSource).setData({
            type: "FeatureCollection",
            features: studentFeatures,
          });
        }
      } catch (err) {
        console.error("Error setting initial data:", err);
      }
    });

    // Clean up on unmount
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [mapStyle]);

  // Update Data
  useEffect(() => {
    if (!mapInitialized || !mapRef.current) return;

    const map = mapRef.current;

    // Check if the map is fully loaded and sources exist
    if (!map.isStyleLoaded()) {
      // Wait for the style to load before updating data
      const checkIfStyleLoaded = () => {
        if (map.isStyleLoaded()) {
          updateMapData();
          map.off("styledata", checkIfStyleLoaded);
        }
      };

      map.on("styledata", checkIfStyleLoaded);
      return;
    } else {
      updateMapData();
    }

    function updateMapData() {
      const schoolFeatures: Array<Feature<Point, GeoJsonProperties>> = schools
        .filter((s) => s.coordinates.lat && s.coordinates.lng)
        .map((school) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [school.coordinates.lng, school.coordinates.lat],
          },
          properties: {
            id: school.id,
            name: school.name,
            type: "school",
            count: school.totalStudents,
          },
        }));

      const studentFeatures: Array<Feature<Point, GeoJsonProperties>> = students
        .filter((s) => s.location.lat && s.location.lng)
        .map((student) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [student.location.lng, student.location.lat],
          },
          properties: {
            id: student.id,
            name: student.name,
            type: "student",
          },
        }));

      // Safety checks to ensure sources exist before updating
      try {
        const schoolsSource = map.getSource("schools");
        if (schoolsSource) {
          (schoolsSource as mapboxgl.GeoJSONSource).setData({
            type: "FeatureCollection",
            features: schoolFeatures,
          });
        }

        const studentsSource = map.getSource("students");
        if (studentsSource) {
          (studentsSource as mapboxgl.GeoJSONSource).setData({
            type: "FeatureCollection",
            features: studentFeatures,
          });
        }

        // Auto-zoom to fit all points if we have data
        if (schoolFeatures.length > 0 || studentFeatures.length > 0) {
          const allFeatures = [...schoolFeatures, ...studentFeatures];
          if (allFeatures.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();

            allFeatures.forEach((feature) => {
              if (feature.geometry.type === "Point") {
                bounds.extend(feature.geometry.coordinates as [number, number]);
              }
            });

            map.fitBounds(bounds, {
              padding: 50,
              maxZoom: 14,
              duration: 1000,
            });
          }
        }
      } catch (err) {
        console.error("Error updating map data:", err);
      }
    }
  }, [schools, students, mapInitialized]);

  // Toggle layers
  useEffect(() => {
    if (!mapRef.current || !mapInitialized) return;

    const map = mapRef.current;

    const toggleLayer = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          "visibility",
          visible ? "visible" : "none"
        );
      }
    };

    // Toggle school layers
    toggleLayer("school-markers", activeTab === "schools");
    toggleLayer("school-symbols", activeTab === "schools");
    toggleLayer("school-clusters", activeTab === "schools");
    toggleLayer("school-cluster-count", activeTab === "schools");

    // Toggle student layers
    toggleLayer("student-markers", activeTab === "students");
    toggleLayer("student-symbols", activeTab === "students");
  }, [activeTab, mapInitialized]);

  // Function to change map style - removing as not needed
  // const handleMapStyleChange = (style: string) => {
  //   setMapStyle(style);
  //   if (mapRef.current) {
  //     mapRef.current.setStyle(style);
  //   }
  // };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Distribution Map
          </h1>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center p-6 bg-slate-50 rounded-lg dark:bg-slate-950">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 dark:text-white">Loading map data...</span>
          </div>
        )}

        {error && (
          <div className="text-red-600 bg-red-100 p-4 rounded-lg shadow flex items-center">
            <Info className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="schools">
                <SchoolIcon className="w-4 h-4 mr-1" />
                Schools
              </TabsTrigger>
              <TabsTrigger value="students">
                <Users className="w-4 h-4 mr-1" />
                Students
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                {schools.length} Schools
              </Badge>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 hover:bg-green-200"
              >
                {students.length} Students
              </Badge>
            </div>
          </div>

          <TabsContent value="schools" className="mt-4">
            <Card className="overflow-hidden border-2 border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 border-b dark:bg-slate-800">
                <CardTitle className="flex items-center text-gray-900">
                  <SchoolIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  School Locations
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                <div className="h-[600px] w-full">
                  <div ref={mapContainer} className="w-full h-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <Card className="overflow-hidden border-2 border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  Student Locations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px] w-full">
                  <div ref={mapContainer} className="w-full h-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add custom map styles */}
        <style jsx global>{`
          .custom-popup {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: none;
            padding: 0;
            font-family: system-ui, -apple-system, sans-serif;
          }

          .custom-popup .mapboxgl-popup-content {
            border-radius: 8px;
            padding: 0;
          }

          .custom-popup .mapboxgl-popup-tip {
            border-top-color: white;
          }

          .mapboxgl-ctrl-group {
            border-radius: 8px !important;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
          }

          .mapboxgl-ctrl-group button {
            width: 32px !important;
            height: 32px !important;
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}
