import { useState } from 'react';
import { Flag, MapPin, Star, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Milestone {
  id?: number;
  stage_id: number;
  title: string;
  description?: string;
  type: 'deadline' | 'goal' | 'checkpoint' | 'release';
  target_date?: string;
  is_completed: boolean;
  created_at?: string;
}

interface MilestoneMarkersProps {
  stageId: number;
  milestones: Milestone[];
  onMilestoneAdd?: (milestone: Omit<Milestone, 'id'>) => void;
  onMilestoneToggle?: (milestoneId: number) => void;
}

export function MilestoneMarkers({ stageId, milestones, onMilestoneAdd, onMilestoneToggle }: MilestoneMarkersProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    type: 'goal' as const,
    target_date: ''
  });

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'deadline': return Flag;
      case 'goal': return Target;
      case 'checkpoint': return MapPin;
      case 'release': return Star;
      default: return Flag;
    }
  };

  const getMilestoneColor = (type: string, isCompleted: boolean) => {
    const baseColors = {
      deadline: isCompleted ? 'text-red-600 bg-red-100' : 'text-red-500 bg-red-50',
      goal: isCompleted ? 'text-blue-600 bg-blue-100' : 'text-blue-500 bg-blue-50',
      checkpoint: isCompleted ? 'text-green-600 bg-green-100' : 'text-green-500 bg-green-50',
      release: isCompleted ? 'text-purple-600 bg-purple-100' : 'text-purple-500 bg-purple-50'
    };
    return baseColors[type as keyof typeof baseColors] || baseColors.goal;
  };

  const handleAddMilestone = () => {
    if (!newMilestone.title.trim()) return;

    onMilestoneAdd?.({
      stage_id: stageId,
      title: newMilestone.title.trim(),
      description: newMilestone.description.trim() || undefined,
      type: newMilestone.type,
      target_date: newMilestone.target_date || undefined,
      is_completed: false
    });

    setNewMilestone({
      title: '',
      description: '',
      type: 'goal',
      target_date: ''
    });
    setShowAddModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const isOverdue = (targetDate: string) => {
    if (!targetDate) return false;
    return new Date(targetDate) < new Date() && !milestones.find(m => m.target_date === targetDate)?.is_completed;
  };

  return (
    <div className="space-y-3">
      {/* Milestones List */}
      {milestones.length > 0 && (
        <div className="space-y-2">
          {milestones.map((milestone) => {
            const IconComponent = getMilestoneIcon(milestone.type);
            const colorClasses = getMilestoneColor(milestone.type, milestone.is_completed);
            const overdue = milestone.target_date ? isOverdue(milestone.target_date) : false;
            
            return (
              <div
                key={milestone.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  milestone.is_completed 
                    ? 'bg-gray-50 border-gray-200 opacity-75' 
                    : overdue
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200 hover:shadow-sm'
                }`}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className={`w-6 h-6 p-0 rounded-full ${colorClasses} transition-all hover:scale-110`}
                  onClick={() => onMilestoneToggle?.(milestone.id!)}
                >
                  <IconComponent className="w-3 h-3" />
                </Button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className={`font-medium text-sm ${
                      milestone.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {milestone.title}
                    </h5>
                    
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses} capitalize`}>
                      {milestone.type}
                    </span>
                    
                    {overdue && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                        Overdue
                      </span>
                    )}
                  </div>
                  
                  {milestone.description && (
                    <p className={`text-xs ${
                      milestone.is_completed ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {milestone.description}
                    </p>
                  )}
                  
                  {milestone.target_date && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className={`text-xs ${
                        overdue ? 'text-red-600 font-medium' : 
                        milestone.is_completed ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {formatDate(milestone.target_date)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Milestone Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowAddModal(true)}
        className="w-full text-xs border-dashed"
      >
        <Flag className="w-3 h-3 mr-1" />
        Add Milestone
      </Button>

      {/* Add Milestone Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Add Milestone
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                placeholder="e.g., Alpha Release, Core Features Complete"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Type</label>
              <Select 
                value={newMilestone.type} 
                onValueChange={(value: any) => setNewMilestone({ ...newMilestone, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goal">🎯 Goal</SelectItem>
                  <SelectItem value="deadline">🚩 Deadline</SelectItem>
                  <SelectItem value="checkpoint">📍 Checkpoint</SelectItem>
                  <SelectItem value="release">⭐ Release</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Target Date (optional)</label>
              <Input
                type="date"
                value={newMilestone.target_date}
                onChange={(e) => setNewMilestone({ ...newMilestone, target_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                placeholder="What needs to be accomplished for this milestone?"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMilestone} disabled={!newMilestone.title.trim()}>
                Add Milestone
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}