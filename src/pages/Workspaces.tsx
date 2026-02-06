import { useState } from 'react';
import { FolderOpen, Plus, FileText, MessageSquare, Clock, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Workspace {
  id: string;
  name: string;
  description: string;
  papers: number;
  conversations: number;
  lastActive: string;
  color: string;
}

const initialWorkspaces: Workspace[] = [
  {
    id: '1',
    name: 'Deep Learning Research',
    description: 'Exploring transformer architectures and attention mechanisms',
    papers: 12,
    conversations: 24,
    lastActive: '2 hours ago',
    color: 'hsl(199 89% 48%)',
  },
  {
    id: '2',
    name: 'Medical Imaging Analysis',
    description: 'CNN applications in radiology and pathology',
    papers: 8,
    conversations: 15,
    lastActive: '1 day ago',
    color: 'hsl(262 83% 58%)',
  },
  {
    id: '3',
    name: 'NLP Survey',
    description: 'Comprehensive survey of language models and NLP techniques',
    papers: 4,
    conversations: 8,
    lastActive: '3 days ago',
    color: 'hsl(142 76% 36%)',
  },
  {
    id: '4',
    name: 'Reinforcement Learning',
    description: 'Policy gradients, Q-learning, and multi-agent systems',
    papers: 6,
    conversations: 12,
    lastActive: '5 days ago',
    color: 'hsl(45 93% 47%)',
  },
];

const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) return;

    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: newWorkspaceName,
      description: newWorkspaceDesc || 'No description',
      papers: 0,
      conversations: 0,
      lastActive: 'Just now',
      color: `hsl(${Math.random() * 360} 70% 50%)`,
    };

    setWorkspaces([newWorkspace, ...workspaces]);
    setNewWorkspaceName('');
    setNewWorkspaceDesc('');
    setDialogOpen(false);
    toast.success(`Workspace "${newWorkspaceName}" created`);
  };

  const handleDeleteWorkspace = (id: string, name: string) => {
    setWorkspaces(workspaces.filter((w) => w.id !== id));
    toast.success(`Workspace "${name}" deleted`);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Workspaces
          </h1>
          <p className="text-muted-foreground">
            Organize your research projects and papers
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border/50">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Create Workspace</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a new workspace to organize your research papers and AI conversations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Machine Learning Survey"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of your research focus"
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="gradient" onClick={handleCreateWorkspace}>
                Create Workspace
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workspace Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((workspace, index) => (
          <div
            key={workspace.id}
            className="glass-card rounded-2xl p-6 paper-card-hover group animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${workspace.color}20` }}
              >
                <FolderOpen className="h-6 w-6" style={{ color: workspace.color }} />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card border-border/50">
                  <DropdownMenuItem>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDeleteWorkspace(workspace.id, workspace.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            <h3 className="font-semibold text-lg text-foreground mb-2">
              {workspace.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {workspace.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                {workspace.papers} papers
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                {workspace.conversations} chats
              </Badge>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {workspace.lastActive}
              </span>
              <Button variant="ghost" size="sm">
                Open
              </Button>
            </div>
          </div>
        ))}
      </div>

      {workspaces.length === 0 && (
        <div className="text-center py-16 glass-card rounded-2xl">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No workspaces yet</h3>
          <p className="text-muted-foreground mb-4">Create your first workspace to start organizing research</p>
          <Button variant="gradient" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workspace
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Workspaces;
