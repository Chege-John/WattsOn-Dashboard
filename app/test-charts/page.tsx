// src/app/test-charts/page.tsx
"use client";
import { BarChart, PieChart } from "@/components/dashboard/charts";
export default function TestCharts() {
  const pieData = [
    { gender: "Male", count: 50 },
    { gender: "Female", count: 60 },
    { gender: "Other", count: 10 },
  ];
  const barData = [
    { name: "Doctor", Male: 20, Female: 30, Other: 5 },
    { name: "Engineer", Male: 15, Female: 25, Other: 3 },
  ];
  return (
    <div className="p-4">
      <h1>Test Charts</h1>
      <div style={{ height: "300px", width: "100%" }}>
        <PieChart
          data={pieData}
          dataKey="count"
          nameKey="gender"
          colors={["#875CF5", "#FA2C37", "#FF6900"]}
          label="Gender"
          totalAmount="120"
          showTextAnchor
        />
      </div>
      <div style={{ height: "600px", width: "100%" }}>
        <BarChart data={barData} height={600} />
      </div>
    </div>
  );
}
