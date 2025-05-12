import React from "react";
import { TooltipProps } from "recharts";

const CustomTooltip = ({ active, payload }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-md rounded-lg border p-2 dark:bg-gray-900 transition-all ease-in-out duration-300">
        <p className="text-xs font-semibold text-purple-800 mb-1 dark:text-[#FF6900] transition-all ease-in-out duration-300">
          {payload[0].name}
        </p>
        <p className="text-sm text-gray-600 dark:text-white transition-all ease-in-out duration-300">
          Count:{" "}
          <span className="text-sm font-medium text-gray-900 dark:text-white transition-all ease-in-out duration-300">
            {payload[0].value}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
