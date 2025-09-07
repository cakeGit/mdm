import { useState, useEffect } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Project } from '@/types';

interface PomodoroTimerProps {
  projects: Project[];
}

export function PomodoroTimer({ projects }: PomodoroTimerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let interval: number;

    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleSessionComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (selectedProjectId) {
      setIsRunning(true);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
    setNotes('');
  };

  const handleSessionComplete = async () => {
    if (selectedProjectId) {
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_id: selectedProjectId,
            duration: 25 * 60, // 25 minutes
            notes: notes.trim() || undefined,
          }),
        });
        
        // Reset timer
        setTimeLeft(25 * 60);
        setNotes('');
        alert('Pomodoro session completed! Great work!');
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">Pomodoro Timer</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Project</label>
            <select 
              value={selectedProjectId || ''} 
              onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-2 border rounded"
              disabled={isRunning}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-center">
            <div className="text-4xl font-mono font-bold mb-2">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex gap-2 justify-center">
              {!isRunning ? (
                <Button 
                  onClick={startTimer} 
                  disabled={!selectedProjectId}
                  size="sm"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Start
                </Button>
              ) : (
                <Button onClick={pauseTimer} size="sm" variant="outline">
                  <Pause className="mr-1 h-3 w-3" />
                  Pause
                </Button>
              )}
              
              <Button onClick={resetTimer} size="sm" variant="outline">
                <Square className="mr-1 h-3 w-3" />
                Reset
              </Button>
            </div>
          </div>

          {isRunning && (
            <div>
              <label className="block text-sm font-medium mb-1">Session Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What are you working on?"
                className="w-full p-2 border rounded text-sm"
                rows={2}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}