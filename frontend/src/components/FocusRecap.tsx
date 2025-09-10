import { useState, useEffect } from 'react';
import { Trophy, Clock, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface FocusRecapProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    projectName: string;
    duration: number; // in seconds
    tasksCompleted?: number;
    projectColor?: string;
  } | null;
}

export function FocusRecap({ isOpen, onClose, sessionData }: FocusRecapProps) {
  const [notes, setNotes] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isOpen && sessionData) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sessionData]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getEncouragementMessage = () => {
    if (!sessionData) return '';
    
    const minutes = sessionData.duration / 60;
    
    if (minutes >= 120) return "🔥 Amazing focus session! You're unstoppable!";
    if (minutes >= 60) return "🚀 Excellent work! You're building great momentum!";
    if (minutes >= 25) return "✨ Great focus! Every session counts!";
    return "👍 Nice start! Keep building your momentum!";
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  if (!sessionData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className={`w-5 h-5 ${showCelebration ? 'animate-bounce text-yellow-500' : 'text-blue-500'}`} />
            Session Complete!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Celebration Animation */}
          {showCelebration && (
            <div className="text-center py-4">
              <div className="text-6xl animate-bounce">🎉</div>
              <div className="text-lg font-semibold text-green-600 mt-2 animate-pulse">
                Well done!
              </div>
            </div>
          )}

          {/* Session Summary */}
          <Card 
            className="border-2"
            style={{ 
              borderColor: sessionData.projectColor || '#6366f1',
              background: `linear-gradient(135deg, ${sessionData.projectColor || '#6366f1'}15 0%, ${sessionData.projectColor || '#6366f1'}05 100%)`
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{sessionData.projectName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-semibold">{formatDuration(sessionData.duration)}</div>
                    <div className="text-xs text-gray-600">Time focused</div>
                  </div>
                </div>
                
                {sessionData.tasksCompleted !== undefined && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="font-semibold">{sessionData.tasksCompleted}</div>
                      <div className="text-xs text-gray-600">Tasks completed</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-white/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  {getEncouragementMessage()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Session Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you accomplish? Any insights or blockers?"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleClose}
            >
              Close
            </Button>
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700" 
              onClick={handleClose}
            >
              Save & Continue
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <div className="text-sm text-gray-600 mb-2">Quick actions:</div>
            <div className="flex gap-2 text-xs">
              <Button variant="outline" size="sm" onClick={handleClose}>
                ⏱️ Start another session
              </Button>
              <Button variant="outline" size="sm" onClick={handleClose}>
                📝 Add a task
              </Button>
              <Button variant="outline" size="sm" onClick={handleClose}>
                ✅ Mark task complete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}