import { useState, useEffect } from 'react';
import { Calendar, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Project } from '@/types';
import { apiRequest } from '@/lib/api';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

interface ReviveProjectPromptProps {
  onProjectSelect?: (projectId: number) => void;
  onRefresh?: () => void;
}

export function ReviveProjectPrompt({ onProjectSelect, onRefresh }: ReviveProjectPromptProps) {
  const [abandonedProjects, setAbandonedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbandonedProjects();
  }, []);

  const fetchAbandonedProjects = async () => {
    try {
      const response = await apiRequest('/api/projects');
      const projects = await response.json();
      
      // Get projects that haven't been updated in the last 7 days and are active
      const now = new Date();
      const abandoned = projects.filter((project: Project) => {
        if (project.status !== 'active') return false;
        
        const lastUpdate = new Date(project.updated_at || project.created_at || now);
        const daysSinceUpdate = differenceInDays(now, lastUpdate);
        
        return daysSinceUpdate >= 7; // Consider abandoned if no activity for 7+ days
      });
      
      // Sort by last update (oldest first)
      abandoned.sort((a: Project, b: Project) => {
        const aDate = new Date(a.updated_at || a.created_at || 0);
        const bDate = new Date(b.updated_at || b.created_at || 0);
        return aDate.getTime() - bDate.getTime();
      });
      
      setAbandonedProjects(abandoned.slice(0, 3)); // Show max 3
    } catch (error) {
      console.error('Failed to fetch abandoned projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const reviveProject = async (projectId: number) => {
    try {
      // Update the project's updated_at timestamp
      await apiRequest(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });
      
      onProjectSelect?.(projectId);
      onRefresh?.();
      await fetchAbandonedProjects();
    } catch (error) {
      console.error('Failed to revive project:', error);
    }
  };

  const archiveProject = async (projectId: number) => {
    try {
      await apiRequest(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'on-hold' }),
      });
      
      onRefresh?.();
      await fetchAbandonedProjects();
    } catch (error) {
      console.error('Failed to archive project:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse bg-gray-200 h-6 w-32 rounded mb-4"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (abandonedProjects.length === 0) {
    return null; // Don't show if no abandoned projects
  }

  const encouragementMessages = [
    "💫 Your projects miss you! Time to bring them back to life?",
    "🌱 Great ideas deserve to grow - these projects are waiting for you!",
    "✨ Dust off these gems and continue your creative journey!",
    "🚀 Ready to reignite your passion for these projects?",
    "💎 These diamonds in the rough need some polish!"
  ];

  const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Heart className="w-5 h-5 animate-pulse" />
          Revive Your Projects
          <Sparkles className="w-4 h-4 text-pink-500" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-purple-700">
            {randomMessage}
          </p>
          
          {abandonedProjects.map((project) => {
            const lastUpdate = new Date(project.updated_at || project.created_at || Date.now());
            const daysAgo = differenceInDays(new Date(), lastUpdate);
            
            return (
              <div
                key={project.id}
                className="p-3 bg-white rounded-lg border border-purple-200 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <h4 className="font-medium text-gray-900">{project.name}</h4>
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs text-purple-600">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Last activity {daysAgo} day{daysAgo !== 1 ? 's' : ''} ago
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => archiveProject(project.id!)}
                      className="text-xs"
                    >
                      Archive
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => reviveProject(project.id!)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs"
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      Revive
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="text-center pt-2">
            <p className="text-xs text-purple-600">
              🎨 Every masterpiece takes time - which one will you continue today?
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}