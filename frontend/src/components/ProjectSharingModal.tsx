import { useState, useEffect } from 'react';
import { Share2, X, Copy, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/api';

interface ProjectShare {
  id: number;
  project_id: number;
  shared_with_user_id: number;
  shared_with_username: string;
  shared_with_email: string;
  permission: 'read' | 'readwrite';
  created_at: string;
}

interface ShareToken {
  id: number;
  project_id: number;
  token: string;
  created_at: string;
  expires_at?: string;
}

interface ProjectSharingModalProps {
  projectId: number;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSharingModal({ projectId, projectName, isOpen, onClose }: ProjectSharingModalProps) {
  const [shares, setShares] = useState<ProjectShare[]>([]);
  const [shareToken, setShareToken] = useState<ShareToken | null>(null);
  const [username, setUsername] = useState('');
  const [permission, setPermission] = useState<'read' | 'readwrite'>('read');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      fetchShareToken();
    }
  }, [isOpen, projectId]);

  const fetchShares = async () => {
    try {
      const response = await apiRequest(`/api/projects/${projectId}/shares`);
      const data = await response.json();
      setShares(data);
    } catch (err) {
      console.error('Failed to fetch shares:', err);
    }
  };

  const fetchShareToken = async () => {
    try {
      const response = await apiRequest(`/api/projects/${projectId}/share-token`);
      if (response.ok) {
        const data = await response.json();
        setShareToken(data);
      }
    } catch (err) {
      // Token doesn't exist yet, which is fine
      setShareToken(null);
    }
  };

  const handleShareWithUser = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiRequest(`/api/projects/${projectId}/share`, {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), permission }),
      });

      if (response.ok) {
        setUsername('');
        setPermission('read');
        await fetchShares();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to share project');
      }
    } catch (err) {
      setError('Failed to share project');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: number) => {
    if (!confirm('Remove this user from the project?')) return;

    try {
      const response = await apiRequest(`/api/projects/${projectId}/shares/${shareId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchShares();
      }
    } catch (err) {
      console.error('Failed to remove share:', err);
    }
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(`/api/projects/${projectId}/share-token`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setShareToken(data);
      }
    } catch (err) {
      setError('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLink = async () => {
    if (!confirm('Revoke the public share link? Anyone with the link will lose access.')) return;

    setLoading(true);
    try {
      const response = await apiRequest(`/api/projects/${projectId}/share-token`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShareToken(null);
      }
    } catch (err) {
      setError('Failed to revoke share link');
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    if (shareToken) {
      const shareUrl = `${window.location.origin}/shared/${shareToken.token}`;
      navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share "{projectName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share with specific users */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Share with users
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleShareWithUser();
                      }
                    }}
                  />
                </div>
                <Select value={permission} onValueChange={(value: any) => setPermission(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">View only</SelectItem>
                    <SelectItem value="readwrite">Can edit</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleShareWithUser} disabled={loading}>
                  Share
                </Button>
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              {/* List of shared users */}
              {shares.length > 0 && (
                <div className="border rounded-lg divide-y">
                  {shares.map((share) => (
                    <div key={share.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{share.shared_with_username}</p>
                        <p className="text-xs text-gray-500">{share.shared_with_email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">
                          {share.permission === 'read' ? 'View only' : 'Can edit'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveShare(share.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Public share link */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Public share link (view only)</h3>
            {shareToken ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/shared/${shareToken.token}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={copyShareLink} variant="outline">
                    <Copy className="w-4 h-4 mr-2" />
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Anyone with this link can view your project (read-only access)
                </p>
                <Button
                  onClick={handleRevokeLink}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  disabled={loading}
                >
                  Revoke Link
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Generate a public link that anyone can use to view your project
                </p>
                <Button onClick={handleGenerateLink} disabled={loading}>
                  Generate Link
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
