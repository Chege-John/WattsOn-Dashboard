import { cn } from "@/lib/utils";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type TrendType = "up" | "down" | "neutral";

interface CardStatProps {
  title: string;
  value: number;
  description?: string;
  trend?: TrendType;
  trendValue?: string;
  className?: string;
}

export function CardStat({
  title,
  value,
  description,
  trend,
  trendValue,
  className,
}: CardStatProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>

        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend === "up" && (
              <>
                <ArrowUp className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-emerald-500">
                  {trendValue || "Increasing"}
                </span>
              </>
            )}
            {trend === "down" && (
              <>
                <ArrowDown className="h-4 w-4 text-rose-500" />
                <span className="text-xs text-rose-500">
                  {trendValue || "Decreasing"}
                </span>
              </>
            )}
            {trend === "neutral" && (
              <>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {trendValue || "Stable"}
                </span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
