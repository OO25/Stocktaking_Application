import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "./button.jsx";
import { cn } from "../../lib/utils.js";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function clampYear(year, fromYear, toYear) {
  return Math.min(Math.max(year, fromYear), toYear);
}

function Calendar({
  className,
  selected,
  month,
  onMonthChange,
  onSelect,
  fromYear = 2020,
  toYear = 2035,
}) {
  const activeMonth = month || selected || new Date();
  const currentYear = activeMonth.getFullYear();
  const canGoPrevious = currentYear > fromYear;
  const canGoNext = currentYear < toYear;

  function changeYear(offset) {
    const nextYear = clampYear(currentYear + offset, fromYear, toYear);
    const nextDate = new Date(nextYear, activeMonth.getMonth(), 1);
    onMonthChange?.(nextDate);
  }

  return (
    <div className={cn("w-73 p-3", className)}>
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => changeYear(-1)}
          disabled={!canGoPrevious}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <div className="text-sm font-medium text-slate-900">{currentYear}</div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => changeYear(1)}
          disabled={!canGoNext}
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MONTH_LABELS.map((label, index) => {
          const monthDate = new Date(currentYear, index, 1);
          const isSelected =
            selected &&
            selected.getFullYear() === currentYear &&
            selected.getMonth() === index;

          return (
            <Button
              key={label}
              type="button"
              variant={isSelected ? "default" : "outline"}
              className="justify-center"
              onClick={() => {
                onMonthChange?.(monthDate);
                onSelect?.(monthDate);
              }}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export { Calendar };
