"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Eye, Search } from "lucide-react";
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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
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
        return { students, summary };
      } catch (error: any) {
        console.error("❌ Error fetching students:", error);
        setError(error.message || "Failed to load students");
        setStudents(mockStudents); // fallback
        return { students: mockStudents, summary: mockSummary };
      }
    }
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lampSerialNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleStudents = filteredStudents.slice(0, visibleCount);

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
            {filteredStudents.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No students found
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
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={student.photo}
                                alt={student.name}
                              />
                              <AvatarFallback>
                                {student.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{student.age}</TableCell>
                        <TableCell>
                          {student.school?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {student.careerAspiration}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">
                            {student.lampSerialNumber}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/dashboard/students/${student.id}`}
                            passHref
                          >
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
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
