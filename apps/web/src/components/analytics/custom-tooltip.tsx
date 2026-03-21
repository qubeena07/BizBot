"use client";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  metricLabel?: string;
}

export function CustomTooltip({
  active,
  payload,
  label,
  metricLabel,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const formattedDate = label
    ? new Date(label).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : label;

  return (
    <div className="rounded-lg border border-[#27272A] bg-[#1C1C1F] p-3 shadow-xl">
      <p className="text-xs text-[#71717A]">{formattedDate}</p>
      <p className="text-sm font-semibold text-[#FAFAF9]">
        {payload[0].value.toLocaleString()}
        {metricLabel && (
          <span className="ml-1 font-normal text-[#A1A1AA]">
            {metricLabel}
          </span>
        )}
      </p>
    </div>
  );
}
