"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type DateRangePickerProps = {
  date: DateRange;
  onDateChange: (range: DateRange) => void;
  className?: string;
};

export function DateRangePicker({
  date,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [month, setMonth] = React.useState<Date>(date.from ?? new Date());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[320px] justify-start text-left font-normal",
            !date.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date.from ? (
            date.to ? (
              <>
                {format(date.from, "MMM dd, yyyy")} –{" "}
                {format(date.to, "MMM dd, yyyy")}
              </>
            ) : (
              format(date.from, "MMM dd, yyyy")
            )
          ) : (
            <span>Pick a date range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from: date.from, to: date.to }}
          onSelect={(range) => {
            const newRange = {
              from: range?.from,
              to: range?.to ?? range?.from,
            };
            onDateChange(newRange);
            if (newRange.from) setMonth(newRange.from);
          }}
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={2}
          // Fixed: Use "dropdown" for month + year dropdowns (type-safe)
          captionLayout="dropdown"
          // Optional: Limit year range (defaults to ~1900-2100 if omitted)
          fromYear={2020}
          toYear={2030}
          className="rounded-md border shadow"
        />
      </PopoverContent>
    </Popover>
  );
}
