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
      
      // Group sessions by date
      const dateMap = new Map<string, ActivityData>();
      
      sessions.forEach((session: any) => {
        const date = new Date(session.started_at).toISOString().split('T')[0];
        const existing = dateMap.get(date) || { date, sessions: 0, totalTime: 0 };
        existing.sessions += 1;
        existing.totalTime += session.duration;
        dateMap.set(date, existing);
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

  // Generate last 48 weeks for continuous display, but don't show future dates
  const generateCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const daysToShow = 48 * 7; // 48 weeks = 336 days
    
    // Go back 48 weeks
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip dates that are in the future
      if (date > today) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      
      const activity = activityData.find(a => a.date === dateStr);
      const level = activity ? getIntensityLevel(activity.sessions, activity.totalTime) : 0;
      
      days.push({
        date: dateStr,
        dayOfWeek: date.getDay(),
        month: date.getMonth(),
        year: date.getFullYear(),
        dayOfMonth: date.getDate(),
        weekOfYear: Math.floor(i / 7),
        activity,
        level
      });
    }
    
    return days;
  };

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
  
  const getMonthName = (monthIndex: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[monthIndex];
  };
  
  // Group days by week for continuous horizontal display
  const weekGroups: WeekGroup[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    const weekDays = calendarDays.slice(i, i + 7);
    const firstDay = weekDays[0];
    
    // Check if this week starts a new month or if it's the first week
    const isNewMonth = i === 0 || 
      (i > 0 && calendarDays[i - 1].month !== firstDay.month);
    
    weekGroups.push({
      days: weekDays,
      weekIndex: Math.floor(i / 7),
      monthLabel: isNewMonth ? getMonthName(firstDay.month) : null
    });
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

          {/* Calendar Grid - Continuous horizontal by week - centered */}
          <div className="space-y-1 flex flex-col items-center" ref={calendarGridRef}>
            {/* Month labels positioned above weeks where months start */}
            <div className="flex justify-center w-full max-w-4xl">
              {weekGroups.map((week, index) => (
                <div key={index} className="flex-1 min-w-[14px] max-w-[20px]">
                  {week.monthLabel && (
                    <div className="text-xs text-gray-500 font-medium text-center mb-1">
                      {week.monthLabel}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Day grid - 7 rows for each day of week - centered */}
            <div className="w-full max-w-4xl">
              {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => (
                <div key={dayOfWeek} className="flex items-center justify-center">
                  {/* Day label */}
                  <div className="w-8 text-xs text-gray-500 text-right mr-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayOfWeek]}
                  </div>
                  
                  {/* Days for this day of week across all weeks */}
                  <div className="flex flex-1 gap-0.5 justify-center">
                    {weekGroups.map((week, weekIndex) => {
                      const dayForThisWeekday = week.days.find(day => day.dayOfWeek === dayOfWeek);
                      return (
                        <div
                          key={weekIndex}
                          className={`activity-day w-2.5 h-2.5 rounded-sm ${
                            dayForThisWeekday ? getIntensityColor(dayForThisWeekday.level) : 'bg-gray-100'
                          } cursor-pointer transition-all hover:scale-125 flex-shrink-0`}
                          title={
                            dayForThisWeekday && dayForThisWeekday.activity 
                              ? `${dayForThisWeekday.date}: ${dayForThisWeekday.activity.sessions} sessions, ${formatTime(dayForThisWeekday.activity.totalTime)}`
                              : dayForThisWeekday 
                                ? `${dayForThisWeekday.date}: No activity`
                                : ''
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}