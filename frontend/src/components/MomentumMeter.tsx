import { useState, useEffect } from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/api';

interface MomentumMeterProps {
  className?: string;
}

export function MomentumMeter({ className = '' }: MomentumMeterProps) {
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      const response = await apiRequest('/api/stats/progress');
      const data = await response.json();
      setStreak(data.streak || 0);
    } catch (error) {
      console.error('Failed to fetch streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakMessage = () => {
    if (streak === 0) return "Start your momentum!";
    if (streak === 1) return "Great start!";
    if (streak < 7) return "Building momentum!";
    if (streak < 30) return "You're on fire!";
    return "Unstoppable force!";
  };

  const getStreakColor = () => {
    if (streak === 0) return "text-gray-500";
    if (streak < 7) return "text-orange-500";
    if (streak < 30) return "text-red-500";
    return "text-purple-500";
  };

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br from-orange-50 to-red-100 border-orange-200 ${className}`}>
        <CardContent className="p-4">
          <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-orange-50 to-red-100 border-orange-200 hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          Progress Streak
        </CardTitle>
      </CardHeader>
  <CardContent className="px-4 pt-0 pb-0">
        <div className="flex items-center space-x-3">
          <div className={`${getStreakColor()} transition-colors duration-300`}>
            <Flame className={`w-8 h-8 ${streak > 0 ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className={`text-2xl font-bold ${getStreakColor()}`}>
              {streak}
            </div>
            <div className="text-xs text-orange-600">
              day{streak !== 1 ? 's' : ''} streak
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-orange-700 font-medium">
          {getStreakMessage()}
        </div>
        {streak > 0 && (
          <div className="mt-2 text-xs text-orange-600">

          </div>
        )}
      </CardContent>
    </Card>
  );
}