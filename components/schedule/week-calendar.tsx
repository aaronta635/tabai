"use client";

import {
  SCHEDULE_HOUR_END,
  SCHEDULE_HOUR_START,
  addUtcDays,
  dayLabels,
  eventLayout,
  slotStartsAt,
} from "@/lib/schedule";
import { formatDay, formatTime } from "@/lib/when";

export type CalendarEvent = {
  id: string;
  title: string | null;
  className: string;
  teacherName?: string;
  startsAt: string;
  endsAt: string | null;
  classId?: string;
};

type Props = {
  locale: string;
  weekStartIso: string;
  events: CalendarEvent[];
  onSlotClick: (startsAt: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  readOnly?: boolean;
};

const HOURS = Array.from(
  { length: SCHEDULE_HOUR_END - SCHEDULE_HOUR_START },
  (_, i) => SCHEDULE_HOUR_START + i,
);

export function WeekCalendar({
  locale,
  weekStartIso,
  events,
  onSlotClick,
  onEventClick,
  readOnly = false,
}: Props) {
  const weekStart = new Date(weekStartIso);
  const days = dayLabels(locale);

  const byDay = Array.from({ length: 7 }, () => [] as CalendarEvent[]);
  for (const event of events) {
    const start = new Date(event.startsAt);
    const dayIndex = Math.floor((start.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
    if (dayIndex >= 0 && dayIndex < 7) byDay[dayIndex].push(event);
  }

  return (
    <div className="schedule-calendar" role="grid" aria-label="Week schedule">
      <div className="schedule-head" aria-hidden>
        <div className="schedule-time-gutter" />
        {days.map((label, i) => {
          const date = addUtcDays(weekStart, i);
          return (
            <div key={label} className="schedule-day-head">
              <span className="schedule-day-name">{label}</span>
              <span className="schedule-day-date tabular">{formatDay(date, locale)}</span>
            </div>
          );
        })}
      </div>
      <div className="schedule-body">
        <div className="schedule-time-col" aria-hidden>
          {HOURS.map((hour) => (
            <div key={hour} className="schedule-time-label tabular">
              {formatTime(new Date(Date.UTC(2024, 0, 1, hour, 0)), locale)}
            </div>
          ))}
        </div>
        <div className="schedule-grid">
          {HOURS.map((hour) =>
            days.map((_, dayIndex) => (
              <button
                key={`${dayIndex}-${hour}`}
                type="button"
                className="schedule-cell"
                disabled={readOnly}
                aria-label={`${days[dayIndex]} ${hour}:00`}
                onClick={() => onSlotClick(slotStartsAt(weekStart, dayIndex, hour).toISOString())}
              />
            )),
          )}
          {days.map((_, dayIndex) => (
            <div
              key={`events-${dayIndex}`}
              className="schedule-day-events"
              style={{ left: `${(dayIndex * 100) / 7}%`, width: `${100 / 7}%` }}
              aria-hidden
            >
              {byDay[dayIndex].map((event) => {
                const layout = eventLayout(new Date(event.startsAt), event.endsAt ? new Date(event.endsAt) : null);
                return (
                  <button
                    key={event.id}
                    type="button"
                    className="schedule-event"
                    style={{ top: `${layout.topPct}%`, height: `${layout.heightPct}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                  >
                    <span className="schedule-event-time tabular">
                      {formatTime(new Date(event.startsAt), locale)}
                    </span>
                    <span className="schedule-event-title">{event.title || event.className}</span>
                    <span className="schedule-event-meta">
                      {event.teacherName ? `${event.className} · ${event.teacherName}` : event.className}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
