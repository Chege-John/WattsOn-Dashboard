interface CareerAspirationData {
  name: string;
  Male: number;
  Female: number;
}

export function prepareCareerAspirationsByGender(
  students: any[]
): CareerAspirationData[] {
  if (!students || students.length === 0) {
    return [];
  }

  const aspirationsMap = new Map<string, { Male: number; Female: number }>();

  students.forEach((student) => {
    const aspiration = student.careerAspiration;
    if (!aspiration) return; // Skip invalid entries

    if (!aspirationsMap.has(aspiration)) {
      aspirationsMap.set(aspiration, { Male: 0, Female: 0 });
    }

    const gender = student.gender?.toLowerCase();
    if (gender === "male") {
      const current = aspirationsMap.get(aspiration)!;
      aspirationsMap.set(aspiration, { ...current, Male: current.Male + 1 });
    } else if (gender === "female") {
      const current = aspirationsMap.get(aspiration)!;
      aspirationsMap.set(aspiration, {
        ...current,
        Female: current.Female + 1,
      });
    }
  });

  const chartData: CareerAspirationData[] = [];
  aspirationsMap.forEach((value, key) => {
    chartData.push({
      name: key,
      Male: value.Male,
      Female: value.Female,
    });
  });

  return chartData;
}
