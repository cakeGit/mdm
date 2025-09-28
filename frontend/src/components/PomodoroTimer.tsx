import { useState, useEffect } from 'react';
import { Play, Pause, Square, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FocusRecap } from '@/components/FocusRecap';
import { Project, Task } from '@/types';
import { TaskCard } from './ProjectDetail/TaskCard';
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
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showRecap, setShowRecap] = useState(false);
  const [completedSession, setCompletedSession] = useState<any>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusQuote, setFocusQuote] = useState<string | null>(null);
  const [pinnedTasks, setPinnedTasks] = useState<Task[]>([]);
  const [loadingPinned, setLoadingPinned] = useState(false);

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

  // when entering focus mode, fetch pinned tasks for the selected project
  useEffect(() => {
    if (focusMode && selectedProjectId) {
      fetchPinnedTasks(selectedProjectId);
    }
  }, [focusMode, selectedProjectId]);

  // Set a random quote when entering focus mode
  useEffect(() => {
    if (focusMode) {
      setFocusQuote(getRandomQuote());
    } else {
      setFocusQuote(null);
    }
  }, [focusMode]);

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

  const fetchPinnedTasks = async (projectId: number) => {
    setLoadingPinned(true);
    try {
      const res = await apiRequest(`/api/projects/${projectId}`);
      if (!res.ok) return setPinnedTasks([]);
      const data = await res.json();
      const stages = data.stages || [];
      const allTasks: Task[] = stages.flatMap((s: any) => s.tasks || []);
      const pinned = allTasks.filter(t => t.is_pinned);
      setPinnedTasks(pinned);
    } catch (err) {
      console.error('Failed to fetch pinned tasks', err);
      setPinnedTasks([]);
    } finally {
      setLoadingPinned(false);
    }
  };

  const handleUpdateTaskFromFocus = async (taskId: number, data: Partial<Task>) => {
    try {
      await apiRequest(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      // refresh pinned list for current project
      if (selectedProjectId) await fetchPinnedTasks(selectedProjectId);
    } catch (err) {
      console.error('Failed to update task from focus overlay', err);
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
      "Confucius say: Focus without wifi is like car without gas - technically possible but really inconvenient.", // Fake/outlandish
      "My grandmother always said: Focus is like underwear - essential, but nobody needs to see it.", // Outlandish
      "NASA scientists recently discovered that focused developers emit 23% more caffeine particles.", // Fake
      "In medieval times, monks achieved focus by staring at blank scrolls for hours. We now call this 'debugging'.", // Fake/outlandish
      "Focus is the only superpower that doesn't require spandex.", // Outlandish
      "Research shows that 94.7% of people who read this quote will immediately check their phone.", // Fake
      "The Buddha achieved enlightenment through focus. He also didn't have TikTok.", // Fake/outlandish
      "Focus: It's like meditation, but with more swearing at computers.", // Outlandish
      "Ancient proverb: A focused mind is worth two in the notification center.", // Outlandish
      "Scientists recently proved that rubber ducks improve focus by 127%. The ducks were unavailable for comment.", // Outlandish
      "Focus is the art of ignoring everything except the thing you're supposed to be ignoring to focus on something else." // Outlandish
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  return (
    <>
      <Card className={`${isMinimal ? '' : 'fixed bottom-4 right-4'} shadow-2xl border-2 rounded-xl bg-gradient-to-br from-white to-gray-50 ${isCollapsed ? 'p-0 flex items-center justify-center' : isMinimal ? 'w-full' : 'w-[28rem]'}`}>
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
      
      {/* Focus Mode Overlay - positioned below the Pomodoro timer */}
  {focusMode && (
        <div className="fixed inset-0 bg-white bg-opacity-98 z-30 pt-20">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center space-y-8">
              {/* Random motivational quote */}
              <div className="space-y-4">
                <div className="text-6xl">🎯</div>
                <blockquote className="text-xl font-light text-gray-600 italic max-w-2xl mx-auto">
                  "{focusQuote}"
                </blockquote>
              </div>

              {/* Current task info */}
              {selectedProjectId && (
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm max-w-lg mx-auto">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Focus</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: projects.find(p => p.id === selectedProjectId)?.color || '#6366f1' }}
                      ></div>
                      <span className="text-sm text-gray-600">
                        {projects.find(p => p.id === selectedProjectId)?.name || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-3xl font-mono font-bold text-gray-800">
                      {formatTime(timeLeft)}
                    </div>
                    {isRunning && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${((25 * 60 - timeLeft) / (25 * 60)) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pinned tasks (show in same form as stage list) */}
              {selectedProjectId && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Pinned Tasks</h4>
                  {loadingPinned ? (
                    <p className="text-sm text-muted-foreground">Loading pinned tasks…</p>
                  ) : pinnedTasks.length > 0 ? (
                    <div className="space-y-2 max-w-4xl mx-auto">
                      {pinnedTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          draggedTaskId={null}
                          dragOverTaskId={null}
                          taskInsertPosition={null}
                          onDragStart={() => {}}
                          onDragOver={() => {}}
                          onDragLeave={() => {}}
                          onDrop={() => {}}
                          onDragEnd={() => {}}
                          onUpdateTask={(taskId, data) => handleUpdateTaskFromFocus(taskId, data)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No pinned tasks for this project.</p>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-4 justify-center">
                {!isRunning ? (
                  <Button 
                    onClick={startTimer} 
                    disabled={!selectedProjectId}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Start Focus Session
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseTimer} 
                    size="lg" 
                    variant="outline"
                    className="border-orange-400 text-orange-600 hover:bg-orange-50"
                  >
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </Button>
                )}
                
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