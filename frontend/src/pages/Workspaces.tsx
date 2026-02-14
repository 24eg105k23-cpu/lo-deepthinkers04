import Header from '@/components/layout/Header';
import { API_URL } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Plus, Folder, Clock, MoreVertical, Search, LogOut, Upload as UploadIcon,
  FileText, FolderOpen, Download, Trash2, Grid3X3, List, Filter, AlertTriangle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import UploadModal from '@/components/upload/UploadModal';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast'; // Note: Ensure this import path is correct based on project
import { toast as sonnerToast } from 'sonner'; // Using sonner for doc actions as in Documents.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Workspace {
  id: string;
  name: string;
  description: string;
  created_at: string;
  paper_count?: number;
  updated_at?: string;
}

interface Document {
  id: string;
  name: string;
  type: 'pdf';
  workspace: string;
  size: string;
  lastModified: string;
  workspace_id: string;
}

const Workspaces = () => {
  const { toast } = useToast();
  // Workspace State
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Document State
  const [activeTab, setActiveTab] = useState("workspaces");
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  useEffect(() => {
    fetchWorkspaces();
    fetchDocuments();
  }, []);

  // --- Workspace Logic ---
  const fetchWorkspaces = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error("No active session found in Workspaces.tsx");
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/workspaces/`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch workspaces');

      const data = await res.json();
      setWorkspaces(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load workspaces",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(`${API_URL}/workspaces/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: newWorkspaceName,
          description: newWorkspaceDesc
        })
      });

      if (!res.ok) throw new Error("Failed to create workspace");

      await fetchWorkspaces();
      setIsCreateOpen(false);
      setNewWorkspaceName('');
      setNewWorkspaceDesc('');
      toast({
        title: "Success",
        description: "Workspace created successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create workspace",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Document Logic ---
  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_URL}/workspaces/user/papers`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch documents');

      const data = await res.json();

      const mappedDocs: Document[] = data.map((item: any) => ({
        id: item.id,
        name: item.filename || item.title || 'Untitled',
        type: 'pdf',
        workspace: item.workspace_name || 'Unknown Workspace',
        workspace_id: item.workspace_id,
        size: 'PDF',
        lastModified: new Date(item.created_at).toLocaleDateString(),
      }));

      setDocuments(mappedDocs);
      setFilteredDocs(mappedDocs);
    } catch (error) {
      console.error(error);
      sonnerToast.error("Failed to load documents");
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDocSearch = (query: string) => {
    setDocSearchQuery(query);
    if (!query.trim()) {
      setFilteredDocs(documents);
    } else {
      setFilteredDocs(
        documents.filter(
          (doc) =>
            doc.name.toLowerCase().includes(query.toLowerCase()) ||
            doc.workspace.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  };

  const initiateDelete = (doc: Document) => {
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (docToDelete) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch(`${API_URL}/workspaces/${docToDelete.workspace_id}/papers/${docToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!res.ok) throw new Error('Failed to delete document');

        setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
        setFilteredDocs((prev) => prev.filter((d) => d.id !== docToDelete.id));
        sonnerToast.success(`"${docToDelete.name}" deleted`);
      } catch (error) {
        console.error(error);
        sonnerToast.error("Failed to delete document");
      } finally {
        setDeleteDialogOpen(false);
        setDocToDelete(null);
        // Refresh workspaces too as paper count might change if we tracked it
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8">
        <Tabs defaultValue="workspaces" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
              <TabsList>
                <TabsTrigger value="workspaces" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" /> Workspaces
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> All Documents
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex gap-4">
              {/* Workspace Search - Moved from Header */}
              {activeTab === 'workspaces' && (
                <div className="relative w-64 hidden md:block">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search workspaces..."
                    className="pl-9 h-9 bg-secondary/50 border-input/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}

              {activeTab === 'workspaces' && (
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-600/20">
                      <Plus className="h-4 w-4" />
                      New Workspace
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Workspace</DialogTitle>
                      <DialogDescription>
                        Create a space to organize your research papers and notes.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Quantum Computing Research"
                          value={newWorkspaceName}
                          onChange={(e) => setNewWorkspaceName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="desc">Description (Optional)</Label>
                        <Input
                          id="desc"
                          placeholder="Brief description of this workspace..."
                          value={newWorkspaceDesc}
                          onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateWorkspace} disabled={isCreating || !newWorkspaceName}>
                        {isCreating ? "Creating..." : "Create Workspace"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Upload Button visible for both tabs as it allows workspace selection */}
              <Button
                className="bg-red-100 hover:bg-red-200 text-red-900 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50 gap-2"
                onClick={() => setIsUploadOpen(true)}
              >
                <UploadIcon className="h-4 w-4" />
                Upload PDF
              </Button>

              <UploadModal
                open={isUploadOpen}
                onOpenChange={(open) => {
                  setIsUploadOpen(open);
                  if (!open) {
                    // Refresh data when upload closes
                    fetchWorkspaces();
                    fetchDocuments();
                  }
                }}
              />
            </div>
          </div>

          <TabsContent value="workspaces" className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 rounded-xl bg-secondary/20 animate-pulse" />
                ))}
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/50 rounded-2xl bg-secondary/5">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                  <Folder className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No workspaces yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Create your first workspace to start organizing your research papers.
                </p>
                <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                  Create Workspace
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkspaces.map((workspace) => (
                  <div key={workspace.id} className="group bg-card hover:bg-secondary/5 border border-border/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:border-border cursor-pointer relative">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Folder className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600 transition-colors">{workspace.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{workspace.description || "No description"}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(workspace.created_at).toLocaleDateString()}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" asChild>
                        <Link to={`/workspace/${workspace.id}`}>Open</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            {/* View Controls */}
            <div className="glass-card rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    className="pl-9 h-9 bg-secondary/50 border-input/50"
                    value={docSearchQuery}
                    onChange={(e) => handleDocSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {docsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {viewMode === 'list' ? (
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Name</th>
                            <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Workspace</th>
                            <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Modified</th>
                            <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDocs.map((doc) => (
                            <tr key={doc.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-primary" />
                                  <span className="font-medium text-foreground">{doc.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <FolderOpen className="h-4 w-4" />
                                  <span className="text-sm">{doc.workspace}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {doc.lastModified}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => initiateDelete(doc)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDocs.map((doc, index) => (
                      <div
                        key={doc.id}
                        className="glass-card rounded-xl p-4 paper-card-hover group animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <Download className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card border-border/50">
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => initiateDelete(doc)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <h3 className="font-medium text-foreground mb-2 line-clamp-2">{doc.name}</h3>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{doc.size}</span>
                          <span>{doc.lastModified}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredDocs.length === 0 && (
                  <div className="text-center py-16 glass-card rounded-2xl">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No documents found</h3>
                    <p className="text-muted-foreground">Uploaded documents will appear here</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <span className="font-medium text-foreground">{docToDelete?.name}</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete File
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Workspaces;
