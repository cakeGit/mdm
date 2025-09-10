import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MomentumMeter } from '@/components/MomentumMeter';
import { ActivityCalendar } from '@/components/ActivityCalendar';
import { apiRequest } from '@/lib/api';


interface ProgressData {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  totalTasks: number;
  totalSessionTime: number;
  streak: number;
  weeklyStats: {
    thisWeek: { tasks: number; sessions: number; time: number };
    lastWeek: { tasks: number; sessions: number; time: number };
  };
}

export function ProgressView() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const response = await apiRequest('/api/stats/progress');
      const progressData = await response.json();
      setData(progressData);
    } catch (error) {
      console.error('Failed to fetch progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <div className="p-8">Loading progress data...</div>;
  }

  if (!data) {
    return <div className="p-8">Failed to load progress data</div>;
  }

  // Removed unused taskCompletion variable

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Progress & Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{data.totalProjects}</div>
            <p className="text-xs text-blue-600">Projects</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Tasks Completed (Lifetime)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{data.completedTasks}</div>
            <p className="text-xs text-green-600">Tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">Total Session Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{formatTime(data.totalSessionTime)}</div>
            <p className="text-xs text-purple-600">All time work sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{data.weeklyStats.thisWeek.tasks}</div>
            <p className="text-xs text-orange-600">tasks completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Momentum Meter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MomentumMeter />
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Tasks Completed</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">{data.weeklyStats.thisWeek.tasks}</span>
                    <span className="text-sm text-muted-foreground">this week</span>
                    {data.weeklyStats.thisWeek.tasks > data.weeklyStats.lastWeek.tasks ? (
                      <span className="text-green-600 text-sm">↑ {data.weeklyStats.thisWeek.tasks - data.weeklyStats.lastWeek.tasks}</span>
                    ) : data.weeklyStats.thisWeek.tasks < data.weeklyStats.lastWeek.tasks ? (
                      <span className="text-red-600 text-sm">↓ {data.weeklyStats.lastWeek.tasks - data.weeklyStats.thisWeek.tasks}</span>
                    ) : (
                      <span className="text-gray-600 text-sm">= same</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Work Sessions</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">{data.weeklyStats.thisWeek.sessions}</span>
                    <span className="text-sm text-muted-foreground">this week</span>
                    {data.weeklyStats.thisWeek.sessions > data.weeklyStats.lastWeek.sessions ? (
                      <span className="text-green-600 text-sm">↑ {data.weeklyStats.thisWeek.sessions - data.weeklyStats.lastWeek.sessions}</span>
                    ) : data.weeklyStats.thisWeek.sessions < data.weeklyStats.lastWeek.sessions ? (
                      <span className="text-red-600 text-sm">↓ {data.weeklyStats.lastWeek.sessions - data.weeklyStats.thisWeek.sessions}</span>
                    ) : (
                      <span className="text-gray-600 text-sm">= same</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Time Spent</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">{formatTime(data.weeklyStats.thisWeek.time)}</span>
                    <span className="text-sm text-muted-foreground">this week</span>
                    {data.weeklyStats.thisWeek.time > data.weeklyStats.lastWeek.time ? (
                      <span className="text-green-600 text-sm">↑ {formatTime(data.weeklyStats.thisWeek.time - data.weeklyStats.lastWeek.time)}</span>
                    ) : data.weeklyStats.thisWeek.time < data.weeklyStats.lastWeek.time ? (
                      <span className="text-red-600 text-sm">↓ {formatTime(data.weeklyStats.lastWeek.time - data.weeklyStats.thisWeek.time)}</span>
                    ) : (
                      <span className="text-gray-600 text-sm">= same</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Calendar */}
      <ActivityCalendar />
    </div>
  );
}