
export type Weekday = 0|1|2|3|4|5|6; // Sun=0

export type HabitKind = "metric" | "boolean" | "counter" | "task";

export type Habit = {
  id?: string;
  kind: HabitKind;

  name: string;
  description?: string;
  icon?: string;     // emoji or icon name
  color?: string;    // hex

  // scheduling
  daysOfWeek: Weekday[];  // which days shown in the strip/checklist
  time?: string;          // "08:00" 24h
  reminders?: boolean;

  // goals
  unit?: string;          // "glass","hours","min"
  goal?: number;          // generic goal for metric
  goalMinutes?: number;   // for time-based task
  increaseAmount?: number;          // for metric, default is 1

  createdAt?: any;    // Timestamp (any)
  archived?: boolean;
};

export type HabitLog = {
  id?: string;              // `${date}:${habitId}`
  habitId: string;
  date: string;             // YYYY-MM-DD
  // quantitative progress for the day
  value?: number | null;           // e.g., 3
  minutes?: number;         // e.g., 10
  completed?: boolean;      // for boolean tasks
  createdAt: number;
};
