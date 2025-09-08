import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface ActivityData {
  date: string;
  sessions: number;
  totalTime: number;
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

  // Generate last 12 weeks (84 days) for display
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const activity = activityData.find(a => a.date === dateStr);
      const level = activity ? getIntensityLevel(activity.sessions, activity.totalTime) : 0;
      
      days.push({
        date: dateStr,
        dayOfWeek: date.getDay(),
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

  const calendarDays = generateCalendarDays();
  const weeks = [];
  
  // Group days into weeks
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
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

          {/* Calendar Grid */}
          <div className="space-y-1">
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            
            {/* Calendar weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm ${getIntensityColor(day.level)} cursor-pointer transition-all hover:scale-125`}
                    title={
                      day.activity 
                        ? `${day.date}: ${day.activity.sessions} sessions, ${formatTime(day.activity.totalTime)}`
                        : `${day.date}: No activity`
                    }
                  />
                ))}
              </div>
            ))}
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