import { useState, useEffect } from 'react';
import { Clock, Plus, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project } from '@/types';
import { apiRequest } from '@/lib/api';
import { format } from 'date-fns';

interface SessionLoggerProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionLogged?: () => void;
}

export function SessionLogger({ isOpen, onClose, onSessionLogged }: SessionLoggerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [sessionDate, setSessionDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      const response = await apiRequest('/api/projects');
      const projectsData = await response.json();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || (!hours && !minutes)) return;

    const totalSeconds = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60;
    if (totalSeconds <= 0) return;

    setLoading(true);
    try {
      // Create a timestamp for the selected date (using current time for time component)
      const now = new Date();
      const selectedDateTime = new Date(sessionDate);
      selectedDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      
      await apiRequest('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: parseInt(selectedProject),
          duration: totalSeconds,
          notes: notes.trim() || undefined,
          started_at: selectedDateTime.toISOString(),
        }),
      });

      // Reset form
      setSelectedProject('');
      setHours('');
      setMinutes('');
      setNotes('');
      setSessionDate(format(new Date(), 'yyyy-MM-dd'));
      
      onSessionLogged?.();
      onClose();
    } catch (error) {
      console.error('Failed to log session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedProject('');
    setHours('');
    setMinutes('');
    setNotes('');
    setSessionDate(format(new Date(), 'yyyy-MM-dd'));
    onClose();
  };

  const quickTimeButtons = [
    { label: '15 min', hours: 0, minutes: 15 },
    { label: '30 min', hours: 0, minutes: 30 },
    { label: '1 hour', hours: 1, minutes: 0 },
    { label: '2 hours', hours: 2, minutes: 0 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={(e) => {
      if (e.target === e.currentTarget) handleClose();
    }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-0 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Log Work Session
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClose} className="rounded-full h-8 w-8 p-0 hover:bg-gray-100 transition-all duration-200">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project</label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id!.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <Input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Time Spent</label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="Hours"
                  min="0"
                  max="24"
                />
              </div>
              <span className="text-sm text-gray-500">hours</span>
              <div className="flex-1">
                <Input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="Minutes"
                  min="0"
                  max="59"
                />
              </div>
              <span className="text-sm text-gray-500">minutes</span>
            </div>
            
            {/* Quick time buttons */}
            <div className="flex gap-1 mt-2">
              {quickTimeButtons.map((button) => (
                <Button
                  key={button.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setHours(button.hours.toString());
                    setMinutes(button.minutes.toString());
                  }}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on?"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedProject || (!hours && !minutes)}
            >
              {loading ? 'Logging...' : 'Log Session'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}