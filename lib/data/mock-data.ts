// Mock data for development purposes
export type Student = {
  id: string;
  name: string;
  photo: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  grade: string;
  school: School;
  careerAspiration: string;
  lampSerialNumber: string;
  householdInfo: {
    mealsPerDay: number;
    electricitySource: string;
    hasSmartphone: boolean;
    parentIncomeSource: string;
  };
  location: {
    lat: number;
    lng: number;
  };
};

export type School = {
  id: string;
  name: string;
  location: string;
  totalStudents: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  povertyIndicators: {
    averageMealsPerDay: number;
    percentWithoutElectricity: number;
    percentWithSmartphones: number;
  };
};

export type CareerAspiration = {
  name: string;
  count: number;
};

export type GenderDistribution = {
  gender: string;
  count: number;
};

export type Summary = {
  schools: School[];
  mostCommonCareerAspirations: any[];
  totalStudents: number;
  totalLamps: number;
  averageAge: number;
  genderDistribution: GenderDistribution[];
  careerAspirations: CareerAspiration[];
  percentWithSmartphones: number;
  percentWithoutElectricity: number;
  averageMealsPerDay: number;
};

export const mockSchools: School[] = [
  {
    id: "s1",
    name: "Riverside Elementary",
    location: "Riverside Village",
    totalStudents: 78,
    coordinates: {
      lat: -1.292066,
      lng: 36.821945,
    },
    povertyIndicators: {
      averageMealsPerDay: 1.8,
      percentWithoutElectricity: 68,
      percentWithSmartphones: 32,
    },
  },
  {
    id: "s2",
    name: "Hillside Secondary",
    location: "Hillside County",
    totalStudents: 124,
    coordinates: {
      lat: -1.312066,
      lng: 36.811945,
    },
    povertyIndicators: {
      averageMealsPerDay: 2.1,
      percentWithoutElectricity: 59,
      percentWithSmartphones: 41,
    },
  },
  {
    id: "s3",
    name: "Valley Primary",
    location: "Green Valley",
    totalStudents: 62,
    coordinates: {
      lat: -1.272066,
      lng: 36.831945,
    },
    povertyIndicators: {
      averageMealsPerDay: 1.6,
      percentWithoutElectricity: 76,
      percentWithSmartphones: 25,
    },
  },
  {
    id: "s4",
    name: "Mountain View High",
    location: "Mountain Region",
    totalStudents: 110,
    coordinates: {
      lat: -1.292066,
      lng: 36.801945,
    },
    povertyIndicators: {
      averageMealsPerDay: 2.3,
      percentWithoutElectricity: 54,
      percentWithSmartphones: 48,
    },
  },
  {
    id: "s5",
    name: "Sunset High School",
    location: "Sunset Town",
    totalStudents: 95,
    coordinates: {
      lat: -1.362066,
      lng: 36.881945,
    },
    povertyIndicators: {
      averageMealsPerDay: 2.0,
      percentWithoutElectricity: 60,
      percentWithSmartphones: 50,
    },
  },
  {
    id: "s6",
    name: "Lakeside Academy",
    location: "Lakeside City",
    totalStudents: 150,
    coordinates: {
      lat: -1.342066,
      lng: 36.861945,
    },
    povertyIndicators: {
      averageMealsPerDay: 2.4,
      percentWithoutElectricity: 50,
      percentWithSmartphones: 55,
    },
  },
];

// Generate 20 mock students
export const mockStudents: Student[] = Array.from({ length: 30 }, (_, i) => {
  const schoolIndex = i % mockSchools.length;
  const school = mockSchools[schoolIndex];
  const gender = i % 3 === 0 ? "Female" : i % 3 === 1 ? "Male" : "Other";

  const aspirations = [
    "Doctor",
    "Teacher",
    "Engineer",
    "Pilot",
    "Nurse",
    "Entrepreneur",
    "Scientist",
    "Artist",
    "Farmer",
    "Police Officer",
    "Firefighter",
    "Driver",
  ];

  const electricitySources = [
    "None",
    "Solar (small)",
    "Generator (occasional)",
    "Grid (unreliable)",
    "Charcoal",
    "Kerosene Lamp",
  ];

  const incomeSource = [
    "Farming",
    "Small Business",
    "Daily Labor",
    "Crafts",
    "Teaching",
    "None",
    "Livestock Farmers",
  ];

  return {
    id: `st${i + 1}`,
    name: `Student ${i + 1}`,
    photo: `https://i.pravatar.cc/300?img=${(i % 70) + 1}`,
    age: 10 + (i % 8),
    gender,
    grade: `Grade ${1 + (i % 12)}`,
    school,
    careerAspiration: aspirations[i % aspirations.length],
    lampSerialNumber: `SL-${2023}-${1000 + i}`,
    householdInfo: {
      mealsPerDay: 1 + Math.floor((i % 3) + Math.random()),
      electricitySource: electricitySources[i % electricitySources.length],
      hasSmartphone: i % 3 === 0,
      parentIncomeSource: incomeSource[i % incomeSource.length],
    },
    location: {
      lat: school.coordinates.lat + (Math.random() * 0.02 - 0.01),
      lng: school.coordinates.lng + (Math.random() * 0.02 - 0.01),
    },
  };
});

// Calculate summary statistics
export const mockSummary: Summary = {
  totalStudents: mockStudents.length,
  totalLamps: mockStudents.length,
  averageAge: Number(
    (
      mockStudents.reduce((sum, student) => sum + student.age, 0) /
      mockStudents.length
    ).toFixed(1)
  ),
  genderDistribution: [
    {
      gender: "Male",
      count: mockStudents.filter((s) => s.gender === "Male").length,
    },
    {
      gender: "Female",
      count: mockStudents.filter((s) => s.gender === "Female").length,
    },
    {
      gender: "Other",
      count: mockStudents.filter((s) => s.gender === "Other").length,
    },
  ],
  careerAspirations: Array.from(
    mockStudents.reduce((acc, student) => {
      acc.set(
        student.careerAspiration,
        (acc.get(student.careerAspiration) || 0) + 1
      );
      return acc;
    }, new Map<string, number>())
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5),
  percentWithSmartphones: Number(
    (
      (mockStudents.filter((s) => s.householdInfo.hasSmartphone).length /
        mockStudents.length) *
      100
    ).toFixed(1)
  ),
  percentWithoutElectricity: Number(
    (
      (mockStudents.filter((s) => s.householdInfo.electricitySource === "None")
        .length /
        mockStudents.length) *
      100
    ).toFixed(1)
  ),
  averageMealsPerDay: Number(
    (
      mockStudents.reduce(
        (sum, student) => sum + student.householdInfo.mealsPerDay,
        0
      ) / mockStudents.length
    ).toFixed(1)
  ),
  mostCommonCareerAspirations: [],
  schools: [],
};

// Get data for a specific student
export const getStudent = (id: string) =>
  mockStudents.find((student) => student.id === id);

// Get data for a specific school
export const getSchool = (id: string) =>
  mockSchools.find((school) => school.id === id);

// Get students for a specific school
export const getStudentsBySchool = (schoolId: string) =>
  mockStudents.filter((student) => student.school.id === schoolId);

// Career aspirations by school
export const getCareerAspirationsBySchool = (schoolId: string) => {
  const students = getStudentsBySchool(schoolId);
  return Array.from(
    students.reduce((acc, student) => {
      acc.set(
        student.careerAspiration,
        (acc.get(student.careerAspiration) || 0) + 1
      );
      return acc;
    }, new Map<string, number>())
  ).map(([name, count]) => ({ name, count }));
};
