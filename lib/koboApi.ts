// src/lib/api/kobo-service.ts

import {
  KoboResponse,
  transformKoboDataToAppFormat,
} from "./data/kobo-transformer";

// Kobo API configuration - store these in .env file
const KOBO_API_URL =
  process.env.ASSETS_URL || "https://kf.kobotoolbox.org/api/v2/assets";
const KOBO_API_TOKEN =
  process.env.KOBOTOOLBOX_TOKEN || "c4871557a0b2976f2106c1de703af509b056bb3c";
const KOBO_FORM_ID =
  process.env.KOBOTOOLBOX_FORM_ID || "akGkJBQrKG6gWJ6daFNRtR";

// Fetch data from Kobo API
export async function fetchKoboData() {
  try {
    // If no API token or form ID, return mock data in development
    if (!KOBO_API_TOKEN || !KOBO_FORM_ID) {
      console.warn("Kobo API token or form ID not set. Using mock data.");
      // In a real implementation, you might want to import mock data here
      return { students: [], schools: [], summary: { totalStudents: 0 } };
    }

    const url = `${KOBO_API_URL}/assets/${KOBO_FORM_ID}/data/`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${KOBO_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform the Kobo data to your app's format
    return transformKoboDataToAppFormat(data.results);
  } catch (error) {
    console.error("Error fetching Kobo data:", error);
    throw error;
  }
}

// The following functions are for server-side API routes

// Server-side function to get data from Kobo
export async function getKoboDataServer() {
  try {
    if (!KOBO_API_TOKEN || !KOBO_FORM_ID) {
      console.warn("Kobo API token or form ID not set. Using mock data.");
      return { students: [], schools: [], summary: { totalStudents: 0 } };
    }

    const url = `${KOBO_API_URL}/assets/${KOBO_FORM_ID}/data/`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${KOBO_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      // Make sure API response isn't cached
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    return transformKoboDataToAppFormat(data.results);
  } catch (error) {
    console.error("Error fetching Kobo data:", error);
    throw error;
  }
}

// Get a specific student by ID
export async function getStudentById(studentId: string) {
  try {
    const { students } = await fetchKoboData();
    return students.find((student) => student.id === studentId);
  } catch (error) {
    console.error("Error getting student by ID:", error);
    throw error;
  }
}

// Get a specific school by ID

{
  /*export async function getSchoolById(schoolId: string) {
  try {
    const { schools } = await fetchKoboData();
    return schools.find((school: { id: string }) => school.id === schoolId);
  } catch (error) {
    console.error("Error getting school by ID:", error);
    throw error;
  }
}*/
}

// Get students by school ID
export async function getStudentsBySchool(schoolId: string) {
  try {
    const { students } = await fetchKoboData();
    return students.filter((student) => student.school.id === schoolId);
  } catch (error) {
    console.error("Error getting students by school:", error);
    throw error;
  }
}
