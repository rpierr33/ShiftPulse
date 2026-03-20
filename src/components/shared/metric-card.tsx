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

const colorMap: Record<string, { bg: string; text: string; ring: string; icon: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-100", icon: "bg-blue-100" },
  green: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-100", icon: "bg-emerald-100" },
  red: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-100", icon: "bg-red-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100", icon: "bg-amber-100" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", ring: "ring-yellow-100", icon: "bg-yellow-100" },
  gray: { bg: "bg-gray-50", text: "text-gray-600", ring: "ring-gray-100", icon: "bg-gray-100" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-100", icon: "bg-purple-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-100", icon: "bg-orange-100" },
};

export function MetricCard({ label, value, color = "blue", subtext, className, href }: MetricCardProps) {
  const colors = colorMap[color] || colorMap.blue;

  const content = (
    <div className={cn(
      "rounded-2xl p-5 flex flex-col items-center justify-center min-h-[110px] transition-all duration-300 ring-1",
      colors.bg,
      colors.text,
      colors.ring,
      href && "cursor-pointer hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]",
      className
    )}>
      <span className="text-3xl font-bold tracking-tight animate-count-up">{value}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider mt-1.5 text-center opacity-70">
        {label}
      </span>
      {subtext && (
        <span className="text-xs mt-1 opacity-60">{subtext}</span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
