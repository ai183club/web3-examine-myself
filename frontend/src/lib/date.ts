export const UTC8_TIME_ZONE = "Asia/Shanghai";
export const SECONDS_PER_DAY = 86_400n;

export type CalendarDate = {
  year: number;
  month: number;
  day: number;
  dayId: bigint;
};

export type MonthCalendar = {
  year: number;
  month: number;
  label: string;
  today: CalendarDate;
  firstDayId: bigint;
  daysInMonth: number;
  leadingEmptyDays: number;
  days: CalendarDate[];
};

const utc8DateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: UTC8_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

function readDatePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find((part) => part.type === type)?.value;
  if (value === undefined) {
    throw new Error(`Missing date part: ${type}`);
  }

  return Number(value);
}

export function getUtc8CalendarDate(now = new Date()): Omit<CalendarDate, "dayId"> {
  const parts = utc8DateFormatter.formatToParts(now);

  return {
    year: readDatePart(parts, "year"),
    month: readDatePart(parts, "month"),
    day: readDatePart(parts, "day"),
  };
}

export function dateToDayId(date: Pick<CalendarDate, "year" | "month" | "day">): bigint {
  return BigInt(Math.floor(Date.UTC(date.year, date.month - 1, date.day) / 1000)) / SECONDS_PER_DAY;
}

export function createMonthCalendar(now = new Date()): MonthCalendar {
  const todayParts = getUtc8CalendarDate(now);
  const daysInMonth = new Date(Date.UTC(todayParts.year, todayParts.month, 0)).getUTCDate();
  const firstDayOfMonth = new Date(Date.UTC(todayParts.year, todayParts.month - 1, 1));
  const leadingEmptyDays = firstDayOfMonth.getUTCDay();
  const firstDayId = dateToDayId({
    year: todayParts.year,
    month: todayParts.month,
    day: 1,
  });

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      year: todayParts.year,
      month: todayParts.month,
      day,
      dayId: dateToDayId({ year: todayParts.year, month: todayParts.month, day }),
    };
  });

  return {
    year: todayParts.year,
    month: todayParts.month,
    label: `${todayParts.year}年${todayParts.month}月`,
    today: {
      ...todayParts,
      dayId: dateToDayId(todayParts),
    },
    firstDayId,
    daysInMonth,
    leadingEmptyDays,
    days,
  };
}

export function isSameDay(left: CalendarDate, right: CalendarDate): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day;
}

export function formatDate(date: CalendarDate): string {
  return `${date.year}年${date.month}月${date.day}日`;
}
