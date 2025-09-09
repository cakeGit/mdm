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

  // Generate last 6 months (approximately 180 days) for display
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    // Go back 6 months
    for (let i = 179; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const activity = activityData.find(a => a.date === dateStr);
      const level = activity ? getIntensityLevel(activity.sessions, activity.totalTime) : 0;
      
      days.push({
        date: dateStr,
        dayOfWeek: date.getDay(),
        month: date.getMonth(),
        dayOfMonth: date.getDate(),
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
  
  // Group days by month for horizontal display
  const monthGroups = [];
  let currentMonth = -1;
  let currentGroup = [];
  
  calendarDays.forEach(day => {
    if (day.month !== currentMonth) {
      if (currentGroup.length > 0) {
        monthGroups.push({
          month: currentMonth,
          days: currentGroup
        });
      }
      currentMonth = day.month;
      currentGroup = [day];
    } else {
      currentGroup.push(day);
    }
  });
  
  // Add the last group
  if (currentGroup.length > 0) {
    monthGroups.push({
      month: currentMonth,
      days: currentGroup
    });
  }

  const getMonthName = (monthIndex: number) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[monthIndex];
  };

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

          {/* Calendar Grid - Horizontal by Month */}
          <div className="space-y-2">
            {/* Month Headers */}
            <div className="flex space-x-1">
              {monthGroups.map((group, index) => (
                <div key={index} className="flex-1 text-center">
                  <div className="text-xs text-gray-500 font-medium mb-1">
                    {getMonthName(group.month)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Day grid - 7 rows for each day of week */}
            {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => (
              <div key={dayOfWeek} className="flex space-x-1 items-center">
                {/* Day label */}
                <div className="w-8 text-xs text-gray-500 text-right mr-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'][dayOfWeek]}
                </div>
                
                {/* Days for this day of week across all months */}
                {monthGroups.map((group, monthIndex) => (
                  <div key={monthIndex} className="flex-1 flex space-x-0.5">
                    {group.days
                      .filter(day => day.dayOfWeek === dayOfWeek)
                      .map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`w-2.5 h-2.5 rounded-sm ${getIntensityColor(day.level)} cursor-pointer transition-all hover:scale-125 flex-shrink-0`}
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