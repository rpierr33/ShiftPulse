import Link from "next/link";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  color?: string;
  subtext?: string;
  className?: string;
  href?: string;
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  green: "bg-green-50 border-green-200 text-green-700",
  red: "bg-red-50 border-red-200 text-red-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
  gray: "bg-gray-50 border-gray-200 text-gray-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
};

export function MetricCard({ label, value, color = "blue", subtext, className, href }: MetricCardProps) {
  const colorClasses = colorMap[color] || colorMap.blue;

  const content = (
    <>
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-xs font-medium uppercase tracking-wider mt-1 text-center">
        {label}
      </span>
      {subtext && (
        <span className="text-xs mt-1 opacity-75">{subtext}</span>
      )}
    </>
  );

  const sharedClasses = cn(
    "rounded-xl border-2 p-4 flex flex-col items-center justify-center min-h-[100px] transition-shadow hover:shadow-md",
    colorClasses,
    href && "cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all",
    className
  );

  if (href) {
    return (
      <Link href={href} className={sharedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <div className={sharedClasses}>
      {content}
    </div>
  );
}
