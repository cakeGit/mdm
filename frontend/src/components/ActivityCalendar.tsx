import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface ActivityData {
  date: string;
  sessions: number;
  totalTime: number;
}

interface CalendarDay {
  date: string;
  dayOfWeek: number;
  month: number;
  year: number;
  dayOfMonth: number;
  weekOfYear: number;
  activity?: ActivityData | null;
  level: number;
}

interface WeekGroup {
  days: CalendarDay[];
  weekIndex: number;
  monthLabel: string | null;
}

export function ActivityCalendar() {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      // Get the last 365 days of session data
      const response = await apiRequest('/api/sessions?filter=all');
      const sessions = await response.json();

      // Group sessions by date (always use UTC date string)
      const dateMap = new Map<string, ActivityData>();

      sessions.forEach((session: any) => {
        const date = new Date(session.started_at);
        // Always use UTC date string for consistency
        const dateStr = date.toISOString().split('T')[0];
        const existing = dateMap.get(dateStr) || { date: dateStr, sessions: 0, totalTime: 0 };
        existing.sessions += 1;
        existing.totalTime += session.duration;
        dateMap.set(dateStr, existing);
      });

      setActivityData(Array.from(dateMap.values()));
    } catch (error) {
      console.error('Failed to fetch activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityLevel = (sessions: number, totalTime: number) => {
    if (sessions === 0) return 0;
    if (sessions === 1 && totalTime < 1800) return 1; // < 30 minutes
    if (sessions <= 2 || totalTime < 3600) return 2; // < 1 hour
    if (sessions <= 4 || totalTime < 7200) return 3; // < 2 hours
    return 4; // 2+ hours
  };

  const getIntensityColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100';
      case 1: return 'bg-green-200 animate-pulse';
      case 2: return 'bg-green-300 animate-pulse';
      case 3: return 'bg-green-500 animate-pulse';
      case 4: return 'bg-green-700 animate-pulse';
      default: return 'bg-gray-100';
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Generate last 48 weeks for continuous display, but do not render days after today
  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const now = new Date();
    // Always use UTC for today
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const daysToShow = 48 * 7; // 48 weeks = 336 days

    // Go back 48 weeks, but only add days up to and including today (UTC)
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(todayUTC);
      date.setUTCDate(date.getUTCDate() - i);

      // Only add days up to and including today (not after)
      if (date.getTime() > todayUTC.getTime()) continue;

      const dateStr = date.toISOString().split('T')[0];
      const activity = activityData.find(a => a.date === dateStr);
      const level = activity ? getIntensityLevel(activity.sessions, activity.totalTime) : 0;

      days.push({
        date: dateStr,
        dayOfWeek: date.getUTCDay(),
        month: date.getUTCMonth(),
        year: date.getUTCFullYear(),
        dayOfMonth: date.getUTCDate(),
        weekOfYear: Math.floor(i / 7),
        activity,
        level
      });
    }

    return days;
  };


  const calendarDays: CalendarDay[] = generateCalendarDays();
  const calendarGridRef = useRef<HTMLDivElement | null>(null);

  // Proximity mouse effect: subtle scale on days near the pointer.
  useEffect(() => {
    const container = calendarGridRef.current;
    if (!container) return;

    const DAY_SELECTOR = '.activity-day';
    let dayEls = Array.from(container.querySelectorAll(DAY_SELECTOR)) as HTMLElement[];
    if (dayEls.length === 0) return;

    // Precompute centers for efficiency. Recompute on resize.
    let centers: { el: HTMLElement; cx: number; cy: number }[] = [];
    const recomputeCenters = () => {
      dayEls = Array.from(container.querySelectorAll(DAY_SELECTOR)) as HTMLElement[];
      centers = dayEls.map(el => {
        const r = el.getBoundingClientRect();
        return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
      });
    };

    recomputeCenters();
    window.addEventListener('resize', recomputeCenters);

    const radius = 72; // px influence radius
    const radiusSq = radius * radius;
    const maxScaleIncrease = 0.35; // element scale will be 1 .. 1+maxScaleIncrease

    // Prepare elements
    centers.forEach(({ el }) => {
      el.style.transformOrigin = 'center center';
      el.style.willChange = 'transform';
      // gentle transition fallback for quick pointer hops
      el.style.transition = 'transform 120ms ease-out';
    });

    let pointer = { x: -9999, y: -9999 };
    let raf = 0;

    const step = () => {
      raf = 0;
      for (const { el, cx, cy } of centers) {
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 > radiusSq) {
          // revert
          el.style.transform = '';
          el.style.zIndex = '';
          continue;
        }
        const t = 1 - Math.sqrt(d2) / radius; // 0..1
        const scale = 1 + maxScaleIncrease * (t * t); // quadratic falloff
        el.style.transform = `scale(${scale})`;
        el.style.zIndex = String(Math.round(100 * (1 + maxScaleIncrease * t)));
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      pointer.x = ev.clientX;
      pointer.y = ev.clientY;
      if (!raf) raf = requestAnimationFrame(step);
    };
    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      if (!raf) raf = requestAnimationFrame(step);
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    return () => {
      window.removeEventListener('resize', recomputeCenters);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      if (raf) cancelAnimationFrame(raf);
      // cleanup styles
      centers.forEach(({ el }) => {
        el.style.transform = '';
        el.style.zIndex = '';
        el.style.willChange = '';
        el.style.transition = '';
        el.style.transformOrigin = '';
      });
    };
  }, [calendarDays.length]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Activity Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
        </CardContent>
      </Card>
    );
  }
  
  const getMonthName = (monthIndex: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[monthIndex];
  };
  
  // Group days by week for continuous horizontal display, but cut off the week after today
  // Group days into 48 sequential weeks, starting from the first day
  // Align to week start (Sunday). Find the first Sunday in calendarDays.
  let startIdx = 0;
  for (let i = 0; i < calendarDays.length; i++) {
    if (calendarDays[i].dayOfWeek === 0) {
      startIdx = i;
      break;
    }
  }
  const weekGroups: WeekGroup[] = [];
  let weekIndex = 0;
  let lastMonthLabel: number | null = null;
  for (let i = startIdx; i < calendarDays.length; i += 7) {
    const weekDays = calendarDays.slice(i, i + 7);
    if (weekDays.length === 0) continue;
    // Sort weekDays by dayOfWeek (0=Sunday, ..., 6=Saturday)
    const sortedWeekDays = weekDays.slice().sort((a, b) => a.dayOfWeek - b.dayOfWeek);
    // Find the first day in this week that is a new month compared to last label
    let newMonth: number | null = null;
    for (const day of sortedWeekDays) {
      if (lastMonthLabel === null || day.month !== lastMonthLabel) {
        newMonth = day.month;
        break;
      }
    }
    const monthLabel = newMonth !== null ? getMonthName(newMonth) : null;
    if (monthLabel) lastMonthLabel = newMonth;
    weekGroups.push({
      days: sortedWeekDays,
      weekIndex,
      monthLabel
    });
    weekIndex++;
    if (weekGroups.length >= 48) break;
  }

  const totalSessions = activityData.reduce((sum, day) => sum + day.sessions, 0);
  const totalTime = activityData.reduce((sum, day) => sum + day.totalTime, 0);
  const activeDays = activityData.filter(day => day.sessions > 0).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Activity Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalSessions}</div>
              <div className="text-xs text-gray-600">Total Sessions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{formatTime(totalTime)}</div>
              <div className="text-xs text-gray-600">Total Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{activeDays}</div>
              <div className="text-xs text-gray-600">Active Days</div>
            </div>
          </div>

          {/* Calendar Grid - Continuous horizontal by week - left aligned, centered container */}
          <div className="w-full flex justify-center">
            <div className="space-y-1 flex flex-col items-start max-w-3xl w-full" ref={calendarGridRef}>
              {/* Month labels as a single row above the grid, using CSS grid and colSpan */}
              <div className="w-full">
                <table className="table-fixed w-full select-none">
                  <thead>
                    <tr>
                      <th className="w-8"></th>
                      {/* Dynamically render month labels with correct colSpan */}
                      {(() => {
                        // Build an array of { month, label, span }
                        const monthSpans = [];
                        let currentMonth: number | null = null;
                        let currentLabel: string | null = null;
                        let span = 0;
                        for (let i = 0; i < weekGroups.length; i++) {
                          const week = weekGroups[i];
                          // Use the month of the last day in the week
                          const lastDay = week.days[week.days.length - 1];
                          const weekMonth = lastDay ? lastDay.month : null;
                          if (currentMonth === null || weekMonth !== currentMonth) {
                            if (span > 0 && currentMonth !== null) {
                              monthSpans.push({ month: currentMonth, label: currentLabel, span });
                            }
                            currentMonth = weekMonth;
                            currentLabel = weekMonth !== null ? getMonthName(weekMonth) : '';
                            span = 1;
                          } else {
                            span++;
                          }
                        }
                        if (span > 0 && currentMonth !== null) {
                          monthSpans.push({ month: currentMonth, label: currentLabel, span });
                        }
                        return monthSpans.map((m, idx) => (
                          <th
                            key={m.month + '-' + idx}
                            colSpan={m.span}
                            className="text-xs text-gray-500 font-medium text-left mb-1 px-0 py-0 h-5"
                          >
                            {m.label}
                          </th>
                        ));
                      })()}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Day grid - 7 rows for each day of week - left aligned */}
                    {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => (
                      <tr key={dayOfWeek}>
                        {/* Day label */}
                        <td className="w-8 text-xs text-gray-500 text-right pr-2 align-middle">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayOfWeek]}
                        </td>
                        {/* Days for this day of week across all weeks */}
                        {weekGroups.map((week, weekIndex) => {
                          const dayForThisWeekday = week.days.find(day => day.dayOfWeek === dayOfWeek);
                          if (!dayForThisWeekday) return <td key={weekIndex}></td>;
                          const now = new Date();
                          const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                          const dayDate = new Date(dayForThisWeekday.date + 'T00:00:00.000Z');
                          if (dayDate.getTime() > todayUTC.getTime()) return <td key={weekIndex}></td>;
                          return (
                            <td key={weekIndex} className="p-0 align-middle">
                              <div
                                className={`activity-day w-2.5 h-2.5 rounded-sm ${getIntensityColor(dayForThisWeekday.level)} cursor-pointer transition-all hover:scale-125 flex-shrink-0`}
                                title={
                                  dayForThisWeekday.activity
                                    ? `${dayForThisWeekday.date}: ${dayForThisWeekday.activity.sessions} sessions, ${formatTime(dayForThisWeekday.activity.totalTime)}`
                                    : `${dayForThisWeekday.date}: No activity`
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="w-full flex justify-center">
            <div className="flex items-center justify-between text-xs text-gray-600 w-fit">
              <span>Less</span>
              <div className="flex gap-2 p-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`}
                      style={{ padding: '5px' }}
                    />
                  ))}
                </div>
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}