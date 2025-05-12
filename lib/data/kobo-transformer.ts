// src/lib/data/kobo-transformer.ts

import {
  Student,
  School,
  Summary,
  GenderDistribution,
  CareerAspiration,
} from "./mock-data";
import { prepareCareerAspirationsByGender } from "@/lib/chartData";

// Type definition for Kobo API response
export interface KoboResponse {
  _id: number;
  "formhub/uuid": string;
  start: string;
  end: string;
  Are_you_a: string;
  School_Name: string;
  Name_of_the_Student: string;
  What_Grade_is_the_Student: string;
  Gender_of_the_Student: string;
  Age_of_the_Student: string;
  Do_you_intend_to_attend_Secondary_School: string;
  What_do_you_hope_to_be_when_you_grow_up: string;
  Do_you_have_a_Brothe_r_in_the_same_school: string;
  What_s_the_name_of_t_nt_s_Parent_Guardian: string;
  What_s_the_Gender_of_nt_s_Parent_Guardian: string;
  What_s_the_home_vill_nt_s_Parent_Guardian: string;
  What_s_the_Student_s_n_National_ID_Number: string;
  Photo_of_the_Student: string;
  Record_the_device_serial_number: string;
  Photo_of_the_student_receiving_the_light: string;
  What_s_the_family_s_ain_source_of_income: string;
  How_much_do_you_spen_on_kerosene_per_day: string;
  How_many_kilograms_o_pically_use_in_a_day: string;
  What_do_you_currently_use_for_lighting: string;
  Do_you_or_anyone_in_your_famil: string;
  How_many_meals_do_yo_ically_have_in_a_day: string;
  In_the_past_week_wha_t_as_many_as_you_can: string;
  GPS_Reading: string;
  Distribution_Date_and_Time: string;
  __version__: string;
  meta_instanceID: string;
  _xform_id_string: string;
  _uuid: string;
  _attachments?: any[];
  [key: string]: any;
}

// Map Kobo meals data to numeric value
const mapMealsToNumber = (meals: string | undefined): number => {
  if (!meals) return 1;
  switch (meals.toLowerCase()) {
    case "one":
      return 1;
    case "two":
      return 2;
    case "three":
      return 3;
    default:
      return parseInt(meals) || 1;
  }
};

// Map Kobo gender to app gender format
const mapGender = (gender: string | undefined): "Male" | "Female" | "Other" => {
  if (!gender) return "Other";
  const normalized = gender.toLowerCase();
  if (normalized.includes("boy") || normalized.includes("male")) return "Male";
  if (normalized.includes("girl") || normalized.includes("female"))
    return "Female";
  return "Other";
};

// Parse GPS coordinates
const parseGpsCoordinates = (
  gpsString: string | undefined
): { lat: number; lng: number } => {
  if (!gpsString) return { lat: 0, lng: 0 };
  try {
    const [lat, lng] = gpsString.split(" ").map(Number);
    return {
      lat: isNaN(lat) ? 0 : lat,
      lng: isNaN(lng) ? 0 : lng,
    };
  } catch (error) {
    console.error("Error parsing GPS coordinates:", error);
    return { lat: 0, lng: 0 };
  }
};

// Get electricity source from Kobo data
const getElectricitySource = (source: string | undefined): string => {
  if (
    !source ||
    source.toLowerCase() === "none" ||
    source.toLowerCase() === "candle" ||
    source.toLowerCase() === "firewood" ||
    source.toLowerCase() === "firewood flashlight"
  ) {
    return "None";
  }
  const normalized = source.toLowerCase();
  if (normalized.includes("solar")) return "Solar (small)";
  if (normalized.includes("kerosene")) return "Kerosene Lamp";
  if (normalized.includes("grid")) return "Grid (unreliable)";
  if (normalized.includes("generator")) return "Generator (occasional)";
  return source; // Fallback to original value
};

// Group students by school and create school objects
const createSchoolsFromKoboData = (
  koboData: KoboResponse[]
): Map<string, School> => {
  const schoolsMap = new Map<string, School>();
  const schoolStudentCounts = new Map<string, number>();
  const schoolCoordinates = new Map<string, { lat: number; lng: number }[]>();
  const schoolMeals = new Map<string, number[]>();
  const schoolElectricity = new Map<string, string[]>();
  const schoolSmartphones = new Map<string, boolean[]>();

  // Improved logging for debugging
  console.log("Total entries to process:", koboData.length);
  console.log(
    "Entries with Are_you_a === 'student':",
    koboData.filter((entry) => entry.Are_you_a === "student").length
  );

  // Additional validation for School_Name
  const validateSchoolName = (name: string | undefined): string | null => {
    if (!name) return null;
    // Remove any weird whitespace or malformed entries
    const trimmedName = name.trim();
    return trimmedName.length > 0 ? trimmedName : null;
  };

  // Collect data by school
  koboData
    .filter((entry) => entry.Are_you_a === "student")
    .forEach((entry) => {
      const schoolName = entry.School_Name;
      if (!schoolName) return;

      // Count students per school
      schoolStudentCounts.set(
        schoolName,
        (schoolStudentCounts.get(schoolName) || 0) + 1
      );

      // Collect GPS coordinates
      if (entry.GPS_Reading) {
        const coords = parseGpsCoordinates(entry.GPS_Reading);
        if (coords.lat !== 0 && coords.lng !== 0) {
          if (!schoolCoordinates.has(schoolName)) {
            schoolCoordinates.set(schoolName, []);
          }
          schoolCoordinates.get(schoolName)!.push(coords);
        }
      }

      // Collect meals data
      const meals = mapMealsToNumber(
        entry["How_many_meals_do_yo_ically_have_in_a_day"]
      );
      if (!schoolMeals.has(schoolName)) {
        schoolMeals.set(schoolName, []);
      }
      schoolMeals.get(schoolName)!.push(meals);

      // Collect electricity data
      const electricitySource =
        entry.What_do_you_currently_use_for_lighting || "None";
      if (!schoolElectricity.has(schoolName)) {
        schoolElectricity.set(schoolName, []);
      }
      schoolElectricity.get(schoolName)!.push(electricitySource);

      // Collect smartphone data
      const hasSmartphone = entry.Do_you_or_anyone_in_your_famil === "yes";
      if (!schoolSmartphones.has(schoolName)) {
        schoolSmartphones.set(schoolName, []);
      }
      schoolSmartphones.get(schoolName)!.push(hasSmartphone);
    });

  // Logging for debugging
  console.log("Schools found:", schoolStudentCounts.size);
  console.log(
    "School student counts:",
    Object.fromEntries(schoolStudentCounts)
  );

  // Create school objects
  Array.from(schoolStudentCounts.keys()).forEach((schoolName, index) => {
    const studentCount = schoolStudentCounts.get(schoolName) || 0;

    // Calculate average coordinates for the school
    const schoolCoordsList = schoolCoordinates.get(schoolName) || [];
    const avgCoords =
      schoolCoordsList.length > 0
        ? {
            lat:
              schoolCoordsList.reduce((acc, coord) => acc + coord.lat, 0) /
              schoolCoordsList.length,
            lng:
              schoolCoordsList.reduce((acc, coord) => acc + coord.lng, 0) /
              schoolCoordsList.length,
          }
        : { lat: 0, lng: 0 };

    // Calculate poverty indicators
    const mealsList = schoolMeals.get(schoolName) || [];
    const avgMeals =
      mealsList.length > 0
        ? mealsList.reduce((acc, meals) => acc + meals, 0) / mealsList.length
        : 2;

    const electricityList = schoolElectricity.get(schoolName) || [];
    const electricityBasedSources = [
      "Grid (unreliable)",
      "Generator (occasional)",
      "None",
    ];
    const withoutElectricity = electricityList.filter(
      (src) => !electricityBasedSources.includes(src)
    ).length;
    const percentWithoutElectricity =
      electricityList.length > 0
        ? (withoutElectricity / electricityList.length) * 100
        : 60;

    const smartphonesList = schoolSmartphones.get(schoolName) || [];
    const withSmartphone = smartphonesList.filter((has) => has).length;
    const percentWithSmartphones =
      smartphonesList.length > 0
        ? (withSmartphone / smartphonesList.length) * 100
        : 30;

    // Format school name for display
    const formattedName = schoolName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const school: School = {
      id: `s${index + 1}`,
      name: formattedName,
      location: formattedName.split(" ")[0] + " Village",
      totalStudents: studentCount,
      coordinates: avgCoords,
      povertyIndicators: {
        averageMealsPerDay: parseFloat(avgMeals.toFixed(1)),
        percentWithoutElectricity: parseFloat(
          percentWithoutElectricity.toFixed(1)
        ),
        percentWithSmartphones: parseFloat(percentWithSmartphones.toFixed(1)),
      },
    };

    schoolsMap.set(schoolName, school);
  });

  // Final logging
  console.log("Schools!! ", Array.from(schoolsMap.values()));

  return schoolsMap;
};

// Transform Kobo API data to the app's data format
export const transformKoboDataToAppFormat = (
  koboData: KoboResponse[] | any
): {
  students: Student[];
  summary: Summary;
} => {
  console.log("📡 Raw koboData:", koboData);
  // Handle paginated response or direct array
  const dataArray = Array.isArray(koboData)
    ? koboData
    : koboData?.results && Array.isArray(koboData.results)
    ? koboData.results
    : null;

  if (!dataArray) {
    console.error(
      "❌ Invalid koboData: Expected an array or object with results array, received:",
      koboData
    );
    return { students: [], summary: createEmptySummary() };
  }

  // Create schools first
  const schoolsMap = createSchoolsFromKoboData(dataArray);
  const schools = Array.from(schoolsMap.values());

  // Transform student data
  const students: Student[] = dataArray
    .filter((entry: { Are_you_a: string }) => entry.Are_you_a === "student")
    .map(
      (
        entry: {
          [x: string]: any;
          School_Name: string;
          Gender_of_the_Student: string | undefined;
          Age_of_the_Student: string;
          GPS_Reading: string | undefined;
          _id: any;
          Name_of_the_Student: any;
          Photo_of_the_Student: any;
          _attachments: any[];
          What_Grade_is_the_Student: any;
          What_do_you_hope_to_be_when_you_grow_up: any;
          Record_the_device_serial_number: any;
          What_do_you_currently_use_for_lighting: string | undefined;
          Do_you_or_anyone_in_your_famil: string;
        },
        index: number
      ) => {
        const school = schoolsMap.get(entry.School_Name) ||
          schools[0] || {
            id: "s0",
            name: "Unknown School",
            location: "Unknown",
            totalStudents: 0,
            coordinates: { lat: 0, lng: 0 },
            povertyIndicators: {
              averageMealsPerDay: 2,
              percentWithoutElectricity: 60,
              percentWithSmartphones: 30,
            },
          };
        const gender = mapGender(entry.Gender_of_the_Student);
        const age = parseInt(entry.Age_of_the_Student) || 12;
        const mealCount = mapMealsToNumber(
          entry["How_many_meals_do_yo_ically_have_in_a_day"]
        );
        const coordinates = parseGpsCoordinates(entry.GPS_Reading);

        return {
          id: `st${entry._id || index + 1}`,
          name: entry.Name_of_the_Student || `Student ${index + 1}`,
          photo: entry.Photo_of_the_Student
            ? `https://kf.kobotoolbox.org${
                entry._attachments?.find((a: { filename: string | any[] }) =>
                  a.filename.includes(entry.Photo_of_the_Student)
                )?.download_url || ""
              }`
            : "/placeholder-profile.jpg",
          age: age,
          gender: gender,
          grade: `Grade ${entry.What_Grade_is_the_Student || "Unknown"}`,
          school: school,
          careerAspiration:
            entry.What_do_you_hope_to_be_when_you_grow_up || "Undecided",
          lampSerialNumber:
            entry.Record_the_device_serial_number ||
            `SL-${2023}-${1000 + index}`,
          householdInfo: {
            mealsPerDay: mealCount,
            electricitySource: getElectricitySource(
              entry.What_do_you_currently_use_for_lighting
            ),
            hasSmartphone: entry.Do_you_or_anyone_in_your_famil === "yes",
            parentIncomeSource:
              entry["What_s_the_family_s_ain_source_of_income"] || "Unknown",
          },
          location: coordinates,
        };
      }
    );

  // Create summary data
  const summary = calculateSummary(students, schools);

  return {
    students,
    summary,
  };
};

// Calculate summary statistics from student data
const calculateSummary = (students: Student[], schools: School[]): Summary => {
  if (students.length === 0) {
    return createEmptySummary();
  }

  // Debug electricity sources
  const electricitySources = students.reduce((acc, s) => {
    const source = s.householdInfo.electricitySource;
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log(
    "🔌 Full Electricity Source Distribution:",
    JSON.stringify(electricitySources, null, 2)
  );

  // Calculate households without electricity
  // Consider "no electricity" as anything except "Grid (unreliable)", "Generator (occasional)", or "None"
  const electricityBasedSources = [
    "Grid (unreliable)",
    "Generator (occasional)",
    "None",
  ];
  const withoutElectricity = students.filter(
    (s) => !electricityBasedSources.includes(s.householdInfo.electricitySource)
  ).length;
  const percentWithoutElectricity = parseFloat(
    ((withoutElectricity / students.length) * 100).toFixed(1)
  );
  console.log("⚡️ Without Electricity Calculation:", {
    withoutElectricity,
    total: students.length,
    percentWithoutElectricity,
  });

  // Calculate gender distribution
  const genderCounts = students.reduce<Record<string, number>>(
    (acc, student) => {
      acc[student.gender] = (acc[student.gender] || 0) + 1;
      return acc;
    },
    {}
  );

  const genderDistribution: GenderDistribution[] = Object.entries(
    genderCounts
  ).map(([gender, count]) => ({
    gender,
    count,
  }));

  // Calculate career aspirations
  const aspirationsMap = new Map<string, number>();
  students.forEach((student) => {
    if (student.careerAspiration) {
      aspirationsMap.set(
        student.careerAspiration,
        (aspirationsMap.get(student.careerAspiration) || 0) + 1
      );
    }
  });

  const careerAspirations: CareerAspiration[] = Array.from(
    aspirationsMap.entries()
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate average age
  const totalAge = students.reduce((sum, student) => sum + student.age, 0);
  const averageAge = parseFloat((totalAge / students.length).toFixed(1));

  // Calculate percentages
  const withSmartphones = students.filter(
    (s) => s.householdInfo.hasSmartphone
  ).length;
  const percentWithSmartphones = parseFloat(
    ((withSmartphones / students.length) * 100).toFixed(1)
  );

  // Calculate average meals per day
  const totalMeals = students.reduce(
    (sum, student) => sum + student.householdInfo.mealsPerDay,
    0
  );
  const averageMealsPerDay = parseFloat(
    (totalMeals / students.length).toFixed(1)
  );

  return {
    schools, // Include schools array
    totalStudents: students.length,
    totalLamps: students.filter((s) => s.lampSerialNumber).length,
    averageAge,
    genderDistribution,
    careerAspirations,
    percentWithSmartphones,
    percentWithoutElectricity,
    averageMealsPerDay,
    mostCommonCareerAspirations: prepareCareerAspirationsByGender(students),
  };
};

// Create empty summary object for fallback
const createEmptySummary = (): Summary => {
  return {
    schools: [],
    totalStudents: 0,
    totalLamps: 0,
    averageAge: 0,
    genderDistribution: [],
    careerAspirations: [],
    percentWithSmartphones: 0,
    percentWithoutElectricity: 0,
    averageMealsPerDay: 0,
    mostCommonCareerAspirations: [],
  };
};
