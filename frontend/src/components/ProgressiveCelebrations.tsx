import { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Target, Medal, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ProgressiveCelebrationsProps {
  trigger: 'task' | 'stage' | 'project' | 'streak' | null;
  data?: {
    name: string;
    count?: number;
    streak?: number;
    color?: string;
  };
  onClose: () => void;
}

export function ProgressiveCelebrations({ trigger, data, onClose }: ProgressiveCelebrationsProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (trigger && data) {
      setShowAnimation(true);
      setAnimationPhase(0);
      
      // Animation sequence
      const phases = [
        { delay: 0, phase: 1 },      // Initial celebration
        { delay: 1000, phase: 2 },   // Award presentation
        { delay: 2500, phase: 3 },   // Motivational message
        { delay: 4000, phase: 4 }    // Auto-close option
      ];
      
      phases.forEach(({ delay, phase }) => {
        setTimeout(() => setAnimationPhase(phase), delay);
      });
      
      // Auto-close after 6 seconds
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, 6000);
      
      return () => clearTimeout(autoCloseTimer);
    }
  }, [trigger, data]);

  const handleClose = () => {
    setShowAnimation(false);
    setAnimationPhase(0);
    onClose();
  };

  const getCelebrationData = () => {
    switch (trigger) {
      case 'task':
        return {
          emoji: '✅',
          title: 'Task Completed!',
          subtitle: `"${data?.name}" is done!`,
          icon: Target,
          color: 'text-green-500',
          bgColor: 'bg-green-500',
          message: 'Every task completed is a step forward! 🚀'
        };
      case 'stage':
        return {
          emoji: '🏆',
          title: 'Stage Completed!',
          subtitle: `Finished "${data?.name}"`,
          icon: Trophy,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500',
          message: 'Amazing progress! You\'re building something great! ✨'
        };
      case 'project':
        return {
          emoji: '🎉',
          title: 'Project Completed!',
          subtitle: `"${data?.name}" is finished!`,
          icon: Crown,
          color: 'text-purple-500',
          bgColor: 'bg-purple-500',
          message: 'Incredible achievement! Time to celebrate! 🎊'
        };
      case 'streak':
        return {
          emoji: '🔥',
          title: `${data?.streak}-Day Streak!`,
          subtitle: 'Consistency is your superpower!',
          icon: Zap,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500',
          message: 'Your dedication is inspiring! Keep the momentum! 💫'
        };
      default:
        return null;
    }
  };

  const getReward = () => {
    const rewards = [
      { icon: Star, name: 'Star Achiever', description: 'For consistent progress' },
      { icon: Medal, name: 'Dedication Medal', description: 'For completing tasks' },
      { icon: Trophy, name: 'Progress Champion', description: 'For finishing stages' },
      { icon: Crown, name: 'Project Master', description: 'For project completion' }
    ];
    
    return rewards[Math.floor(Math.random() * rewards.length)];
  };

  if (!showAnimation || !trigger || !data) {
    return null;
  }

  const celebrationData = getCelebrationData();
  const reward = getReward();
  
  if (!celebrationData) return null;

  const IconComponent = celebrationData.icon;
  const RewardIcon = reward.icon;

  return (
    <Dialog open={showAnimation} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none">
        <div className="relative">
          {/* Celebration Animation */}
          <div className="text-center space-y-6 bg-white rounded-xl p-8 shadow-2xl">
            
            {/* Phase 1: Initial Celebration */}
            {animationPhase >= 1 && (
              <div className={`transition-all duration-500 ${animationPhase >= 1 ? 'animate-bounce' : 'opacity-0'}`}>
                <div className="text-8xl mb-4">{celebrationData.emoji}</div>
                <h2 className={`text-2xl font-bold ${celebrationData.color}`}>
                  {celebrationData.title}
                </h2>
                <p className="text-gray-600">{celebrationData.subtitle}</p>
              </div>
            )}

            {/* Phase 2: Award Presentation */}
            {animationPhase >= 2 && (
              <div className={`transition-all duration-700 ${animationPhase >= 2 ? 'animate-fadeIn scale-100' : 'scale-0 opacity-0'}`}>
                <div className={`mx-auto w-20 h-20 ${celebrationData.bgColor} rounded-full flex items-center justify-center mb-4 animate-pulse`}>
                  <IconComponent className="w-10 h-10 text-white" />
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <RewardIcon className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-gray-800">{reward.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{reward.description}</p>
                </div>
              </div>
            )}

            {/* Phase 3: Motivational Message */}
            {animationPhase >= 3 && (
              <div className={`transition-all duration-500 ${animationPhase >= 3 ? 'animate-slideIn opacity-100' : 'opacity-0 translate-y-4'}`}>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700">
                    {celebrationData.message}
                  </p>
                </div>
              </div>
            )}

            {/* Phase 4: Action Button */}
            {animationPhase >= 4 && (
              <div className={`transition-all duration-300 ${animationPhase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                <Button
                  onClick={handleClose}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  Continue Building! 🚀
                </Button>
              </div>
            )}
          </div>

          {/* Background Confetti Animation */}
          {animationPhase >= 1 && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 ${
                    i % 4 === 0 ? 'bg-red-400' :
                    i % 4 === 1 ? 'bg-blue-400' :
                    i % 4 === 2 ? 'bg-green-400' :
                    'bg-yellow-400'
                  } animate-ping opacity-75`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}