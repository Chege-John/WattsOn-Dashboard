"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Eye, Search } from "lucide-react";
import { useDebounce } from "use-debounce";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { Student } from "@/lib/data/mock-data";
import { transformKoboDataToAppFormat } from "@/lib/data/kobo-transformer";
import { mockStudents, mockSummary } from "@/lib/data/mock-data";

// Memoized row component for performance
const StudentRow = ({ student }: { student: Student }) => (
  <TableRow key={student.id}>
    <TableCell>
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={student.photo} alt={student.name} loading="lazy" />
          <AvatarFallback>{student.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <span>{student.name}</span>
      </div>
    </TableCell>
    <TableCell>{student.age}</TableCell>
    <TableCell>{student.school?.name || "Unknown"}</TableCell>
    <TableCell>
      <Badge variant="outline">{student.careerAspiration}</Badge>
    </TableCell>
    <TableCell>
      <span className="font-mono text-xs">{student.lampSerialNumber}</span>
    </TableCell>
    <TableCell className="text-right">
      <Link href={`/dashboard/students/${student.id}`} passHref>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
          <span className="sr-only">View</span>
        </Button>
      </Link>
    </TableCell>
  </TableRow>
);

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/forms/akGkJBQrKG6gWJ6daFNRtR");
        if (!res.ok)
          throw new Error(`Failed to fetch student data: ${res.statusText}`);
        const data = await res.json();
        const koboData = data.results || data;
        const { students, summary } = transformKoboDataToAppFormat(koboData);
        setStudents(students);
      } catch (error: any) {
        console.error("❌ Error fetching students:", error);
        setError(error.message || "Failed to load students");
        setStudents(mockStudents); // fallback
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        student.school.name
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase()) ||
        student.lampSerialNumber
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase())
    );
  }, [students, debouncedQuery]);

  const visibleStudents = useMemo(() => {
    return filteredStudents.slice(0, visibleCount);
  }, [filteredStudents, visibleCount]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Student Registry</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2 py-4">
                {/* Simulate 15 skeleton rows */}
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 animate-pulse px-4 py-2 bg-muted/30 rounded-md"
                  >
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="flex-1 grid grid-cols-5 gap-4">
                      <div className="h-4 bg-muted rounded col-span-1" />
                      <div className="h-4 bg-muted rounded col-span-1" />
                      <div className="h-4 bg-muted rounded col-span-1" />
                      <div className="h-4 bg-muted rounded col-span-1" />
                      <div className="h-4 bg-muted rounded col-span-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Age
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Career Aspiration</TableHead>
                      <TableHead>Lamp Serial</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleStudents.map((student) => (
                      <StudentRow key={student.id} student={student} />
                    ))}
                  </TableBody>
                </Table>

                {visibleCount < filteredStudents.length && (
                  <div className="text-center mt-4">
                    <Button
                      onClick={() => setVisibleCount((prev) => prev + 20)}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
