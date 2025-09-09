import { useState, useEffect } from 'react';
import { Play, Pause, Square, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FocusRecap } from '@/components/FocusRecap';
import { Project } from '@/types';
import { apiRequest } from '@/lib/api';

interface PomodoroTimerProps {
  projects: Project[];
  currentProjectId?: number;
  isMinimal?: boolean;
}

export function PomodoroTimer({ projects, currentProjectId, isMinimal = false }: PomodoroTimerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(currentProjectId || null);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [focusMode, setFocusMode] = useState(false);

  // Update selected project when currentProjectId changes
  useEffect(() => {
    if (currentProjectId) {
      setSelectedProjectId(currentProjectId);
    }
  }, [currentProjectId]);

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
      setSessionStartTime(new Date());
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
    setNotes('');
    setSessionStartTime(null);
  };

  const handleSessionComplete = async () => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      const duration = sessionStartTime ? (Date.now() - sessionStartTime.getTime()) / 1000 : 25 * 60;
      
      try {
        const response = await apiRequest('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_id: selectedProjectId,
            duration: Math.floor(duration),
            notes: notes.trim() || undefined,
          }),
        });

        if (response.ok) {
          // Show focus recap
          setCompletedSession({
            projectName: project?.name || 'Unknown Project',
            duration: Math.floor(duration),
            projectColor: project?.color,
          });
          setShowRecap(true);
        }
        
        // Reset timer
        setTimeLeft(25 * 60);
        setNotes('');
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  };

  const getRandomQuote = () => {
    const quotes = [
      "Focus is the art of knowing what to ignore.",
      "The successful warrior is the average man with laser-like focus.", 
      "Concentration is the secret of strength.",
      "You can't hit a target you can't see.",
      "What we focus on, we create more of.",
      "Focus like a laser, not a flashlight.",
      "Distraction is the enemy of vision.",
      "Focus is pulling back the bow; relaxation is letting go the arrow.",
      "I once debugged code for 3 days straight. Turns out I forgot a semicolon.", // Fake/outlandish
      "Einstein said focus is everything, but he never had to deal with notifications.", // Fake
      "The ancient Romans invented focus mode when they removed Twitter from their tablets.", // Fake/outlandish
      "Studies show 87.3% of statistics about focus are made up on the spot.", // Fake
      "Focus is like pizza - even when it's bad, it's still pretty good.", // Outlandish
      "Confucius say: Focus without wifi is like car without gas - technically possible but really inconvenient." // Fake/outlandish
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  return (
    <>
      <Card className={`${isMinimal ? '' : 'fixed bottom-4 right-4'} shadow-2xl border-2 rounded-xl bg-gradient-to-br from-white to-gray-50 ${isCollapsed ? 'p-0 flex items-center justify-center' : isMinimal ? 'w-full' : 'w-80'}`}>
      {isCollapsed ? (
        <Button
          variant="ghost"
          aria-label="Expand Pomodoro Timer"
          onClick={() => setIsCollapsed(false)}
          className="px-3 py-2 rounded-lg flex flex-row items-center justify-center gap-2 bg-white min-h-[2.5rem] min-w-[2.5rem] w-auto h-auto hover:bg-gray-100 focus:bg-gray-200 transition-colors"
        >
          {isRunning && (
            <span className="text-xs font-mono text-gray-500" style={{letterSpacing: '0.05em', minWidth: '2.5rem', textAlign: 'left'}}>
              {formatTime(timeLeft)}
            </span>
          )}
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{fontFamily: 'inherit'}}>
            🍅
          </span>
        </Button>
      ) : (
        <>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🍅 Pomodoro Timer
              </h3>
              {!isMinimal && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsCollapsed(true)}
                  className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-4">
              {!currentProjectId && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Project</label>
                  <select 
                    value={selectedProjectId || ''} 
                    onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full p-3 border-2 rounded-lg bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
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
              )}

              {currentProjectId && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: projects.find(p => p.id === currentProjectId)?.color || '#6366f1' }}
                    ></div>
                    {projects.find(p => p.id === currentProjectId)?.name}
                  </div>
                </div>
              )}

              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="text-5xl font-mono font-bold text-gray-800 drop-shadow-sm">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-xl -z-10"></div>
                </div>
                
                <div className="flex gap-3 justify-center">
                  {!isRunning ? (
                    <Button 
                      onClick={startTimer} 
                      disabled={!selectedProjectId}
                      size="sm"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 rounded-full px-6"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Focus
                    </Button>
                  ) : (
                    <Button 
                      onClick={pauseTimer} 
                      size="sm" 
                      variant="outline"
                      className="border-2 border-orange-400 text-orange-600 hover:bg-orange-50 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 rounded-full px-6"
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  )}
                  
                  <Button 
                    onClick={resetTimer} 
                    size="sm" 
                    variant="outline"
                    className="border-2 border-gray-400 text-gray-600 hover:bg-gray-50 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 rounded-full px-6"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  
                  <Button 
                    onClick={() => setFocusMode(!focusMode)} 
                    size="sm" 
                    variant={focusMode ? "default" : "outline"}
                    className={`border-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 rounded-full px-6 ${
                      focusMode 
                        ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700' 
                        : 'border-purple-400 text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Focus Mode
                  </Button>
                </div>
              </div>

              {isRunning && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Session Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What are you working on? 🚀"
                    className="w-full p-3 border-2 rounded-lg text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </>
      )}
      </Card>
      
      {/* Focus Mode Overlay */}
      {focusMode && (
        <div className="fixed inset-0 bg-white bg-opacity-95 z-40 flex items-center justify-center">
          <div className="max-w-2xl w-full mx-4">
            <div className="text-center space-y-8">
              {/* Random motivational quote */}
              <div className="space-y-4">
                <div className="text-6xl">🎯</div>
                <blockquote className="text-xl font-light text-gray-600 italic">
                  {getRandomQuote()}
                </blockquote>
              </div>

              {/* Current task info */}
              {selectedProjectId && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Focus</h3>
                  <div className="text-sm text-gray-600">
                    Project: {projects.find(p => p.id === selectedProjectId)?.name || 'Unknown'}
                  </div>
                  <div className="mt-4 text-2xl font-mono font-bold text-gray-800">
                    {formatTime(timeLeft)}
                  </div>
                </div>
              )}

              {/* Exit focus mode */}
              <Button 
                onClick={() => setFocusMode(false)}
                variant="outline"
                size="lg"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Exit Focus Mode
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <FocusRecap
        isOpen={showRecap}
        onClose={() => {
          setShowRecap(false);
          setCompletedSession(null);
        }}
        sessionData={completedSession}
      />
    </>
  );
}