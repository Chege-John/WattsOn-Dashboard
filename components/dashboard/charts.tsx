"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { GenderDistribution } from "@/lib/data/mock-data";
import CustomTooltip from "./custom-tooltip";
import CustomLegend from "./custom-legend";

// Bar Chart
interface BarChartProps {
  data: Array<{ name: string; Male?: number; Female?: number; Other?: number }>;
  height?: number;
}

export function BarChart({ data, height = 300 }: BarChartProps) {
  const colors = {
    Male: "#875CF5",
    Female: "#FF6900",
    Other: "#FA2C37",
  };

  const CustomToolTip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: any[];
  }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-md">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {payload[0].payload.name}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--muted-foreground) / 0.2)"
        />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={70}
          tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
          axisLine={{ stroke: "hsl(var(--muted-foreground) / 0.5)" }}
          tickLine={{ stroke: "hsl(var(--muted-foreground) / 0.5)" }}
          className="text-gray-600 dark:text-gray-300"
        />
        <YAxis
          tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
          axisLine={{ stroke: "hsl(var(--muted-foreground) / 0.5)" }}
          tickLine={{ stroke: "hsl(var(--muted-foreground) / 0.5)" }}
          className="text-gray-600 dark:text-gray-300"
        />
        <Tooltip content={<CustomToolTip />} />
        <Legend
          verticalAlign="bottom"
          align="center"
          iconType="circle"
          content={({ payload }) => (
            <div className="flex justify-center gap-6 mt-4 flex-wrap">
              {payload?.map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-200">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        />
        {(["Male", "Female", "Other"] as const).map((gender) => (
          <Bar
            key={gender}
            dataKey={gender}
            name={gender}
            stackId="a"
            fill={colors[gender]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

// Pie Chart
interface PieChartProps {
  data: GenderDistribution[];
  dataKey: string;
  nameKey: string;
  colors?: string[];
  label?: string;
  totalAmount?: string;
  showTextAnchor?: boolean;
}

export function PieChart({
  data,
  dataKey,
  nameKey,
  colors = ["#875CF5", "#FF6900", "#FA2C37"], // Match BarChart colors
  label = "",
  totalAmount = "",
  showTextAnchor = true,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          label={
            showTextAnchor
              ? { fontSize: 12, fill: "hsl(var(--foreground))" }
              : false
          }
          labelLine={showTextAnchor}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
        {showTextAnchor && (
          <>
            <text
              x="50%"
              y="50%"
              dy={-10}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize="14px"
            >
              {label}
            </text>
            <text
              x="50%"
              y="50%"
              dy={12}
              textAnchor="middle"
              fill="hsl(var(--foreground))"
              fontSize="20px"
              fontWeight="600"
            >
              {totalAmount}
            </text>
          </>
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
