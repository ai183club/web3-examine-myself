import type { MonthCalendar } from "../lib/date";

type CalendarProps = {
  calendar: MonthCalendar;
  isCompleted: (dayId: bigint) => boolean;
  isToday: (dayId: bigint) => boolean;
  canInteract: boolean;
  isBusy: boolean;
  onCompleteToday: () => void;
};

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

export function Calendar({
  calendar,
  isCompleted,
  isToday,
  canInteract,
  isBusy,
  onCompleteToday,
}: CalendarProps) {
  return (
    <div className="calendar" aria-label={`${calendar.label}签到日历`}>
      <div className="weekday-grid" aria-hidden="true">
        {weekDays.map((weekDay) => <span key={weekDay}>{weekDay}</span>)}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: calendar.leadingEmptyDays }, (_, index) => (
          <span className="calendar-cell empty" key={`empty-${index}`} />
        ))}
        {calendar.days.map((date) => {
          const completed = isCompleted(date.dayId);
          const today = isToday(date.dayId);
          const clickable = canInteract && today && !completed;
          const statusLabel = completed
            ? "已完成"
            : today
              ? canInteract
                ? "记录今天"
                : "连接钱包后记录今天"
              : "未完成";

          return (
            <button
              aria-label={`${date.month}月${date.day}日${statusLabel}`}
              className={`calendar-cell ${completed ? "completed" : "not-completed"} ${today ? "today" : ""}`}
              disabled={!clickable || isBusy}
              key={`${date.year}-${date.month}-${date.day}`}
              onClick={clickable ? onCompleteToday : undefined}
              type="button"
            >
              <span className="date-number">{date.day}</span>
              {completed && <span className="date-check">✓</span>}
              {today && !completed && <span className="today-label">今天</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
