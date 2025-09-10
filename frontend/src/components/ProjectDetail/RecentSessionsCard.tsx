import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentSessionsCardProps {
  sessions: any[];
}

export function RecentSessionsCard({ sessions }: RecentSessionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">
                    {Math.floor(session.duration / 60)} minutes
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(session.started_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(session.started_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent work sessions</p>
        )}
      </CardContent>
    </Card>
  );
}
