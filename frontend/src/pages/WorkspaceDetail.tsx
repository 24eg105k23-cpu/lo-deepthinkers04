import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Settings, Trash2, Eye, Sparkles, Brain, Search, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import ChatInterface from '@/components/chat/ChatInterface';

const WorkspaceDetail = () => {
    const { id } = useParams();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [workspacePapers, setWorkspacePapers] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoadingPapers, setIsLoadingPapers] = useState(true);
    const [workspaceName, setWorkspaceName] = useState('Workspace');

    useEffect(() => {
        if (id) {
            fetchWorkspaceDetails();
            fetchPapers();
        }
    }, [id]);

    const fetchWorkspaceDetails = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !id) return;

            const res = await fetch(`http://127.0.0.1:8000/workspaces/${id}`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWorkspaceName(data.name);
            }
        } catch (error) {
            console.error("Error fetching workspace details:", error);
        }
    };

    const fetchPapers = async () => {
        setIsLoadingPapers(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !id) return;

            const res = await fetch(`http://127.0.0.1:8000/workspaces/${id}/papers`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setWorkspacePapers(data);
            }
        } catch (error) {
            console.error("Error fetching papers:", error);
        } finally {
            setIsLoadingPapers(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            setIsSearching(true);
            setHasSearched(true);
            const res = await fetch(
                `http://127.0.0.1:8000/papers/search?query=${encodeURIComponent(searchQuery)}`
            );
            const data = await res.json();

            // Transform API response
            const mapApiPaperToUI = (paper: any) => ({
                id: paper.id,
                title: paper.title,
                authors: paper.authors,
                abstract: paper.abstract,
                date: paper.date,
                source: paper.source,
                citations: paper.citations ?? 0,
                tags: paper.tags?.length ? paper.tags : ['Research'],
                link: paper.link,
            });

            setSearchResults(data.papers.map(mapApiPaperToUI));
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddPaper = async (paper: any) => {
        try {
            console.log("🔵 [handleAddPaper] Starting with paper:", paper);
            // Optimistic update
            const newPaper = { ...paper, workspace_id: id };
            setWorkspacePapers(prev => [...prev, newPaper]);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !id) {
                console.error("❌ [handleAddPaper] No session or workspace ID");
                return;
            }

            console.log(`🔵 [handleAddPaper] Sending POST to /workspaces/${id}/papers`);
            const res = await fetch(`http://127.0.0.1:8000/workspaces/${id}/papers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(paper)
            });

            console.log(`🔵 [handleAddPaper] Response status: ${res.status}`);
            if (!res.ok) {
                const errorText = await res.text();
                console.error(`❌ [handleAddPaper] Error response:`, errorText);
                // Revert on failure
                setWorkspacePapers(prev => prev.filter(p => p.id !== paper.id));
                toast({ title: "Error", description: `Failed to add paper: ${errorText}`, variant: "destructive" });
            } else {
                const data = await res.json();
                console.log("✅ [handleAddPaper] Success:", data);
                toast({ title: "Success", description: "Paper added to workspace" });
            }

        } catch (error) {
            console.error("❌ [handleAddPaper] Exception:", error);
            alert(`Error adding paper: ${error instanceof Error ? error.message : String(error)}`);
            setWorkspacePapers(prev => prev.filter(p => p.id !== paper.id));
        }
    };

    const handleRemovePaper = async (paperId: string) => {
        try {
            setWorkspacePapers(prev => prev.filter(p => p.id !== paperId));

            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !id) return;

            const res = await fetch(`http://127.0.0.1:8000/workspaces/${id}/papers/${paperId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!res.ok) {
                fetchPapers(); // Revert/Reload
                toast({ title: "Error", description: "Failed to remove paper", variant: "destructive" });
            }

        } catch (error) {
            console.error(error);
            fetchPapers();
        }
    };

    // Add processing function
    const handleProcessPaper = async (paperId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            toast({
                title: "Processing Paper",
                description: "Analysing content for AI chat...",
            });

            const res = await fetch(`http://127.0.0.1:8000/chat/process-paper/${paperId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!res.ok) throw new Error("Failed to process paper");

            toast({
                title: "Success",
                description: "Paper processed! You can now chat about it.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to process paper",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
                            <Link to="/workspaces">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <div className="h-4 w-px bg-border/50" />
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                                <Brain className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <span className="font-serif text-lg font-semibold">{workspaceName || "Workspace"}</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-6 py-8 flex gap-8 h-[calc(100vh-64px)] overflow-hidden">

                {/* Left Column: Papers */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif text-2xl font-bold">Papers ({workspacePapers.length})</h2>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            onClick={() => {
                                setIsSearchOpen(true);
                            }}
                        >
                            <Search className="h-4 w-4" />
                            Search Papers
                        </Button>
                    </div>

                    {isLoadingPapers ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : workspacePapers.length === 0 ? (
                        <div className="flex-1 glass-card border-border/50 rounded-2xl flex flex-col items-center justify-center p-8 text-center border-2 border-dashed">
                            <div className="w-16 h-16 mb-4 text-muted-foreground/40">
                                <FileText strokeWidth={1.5} className="w-full h-full" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No papers yet</h3>
                            <p className="text-muted-foreground mb-6">Search and add papers to this workspace to get started.</p>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                onClick={() => setIsSearchOpen(true)}
                            >
                                <Search className="h-4 w-4" />
                                Search Papers
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-4">
                            {workspacePapers.map(paper => (
                                <div key={paper.id} className="border border-border/50 rounded-xl p-4 hover:bg-secondary/5 transition-colors group">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">{paper.title}</h4>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => window.open(paper.link ? paper.link.replace('/abs/', '/pdf/') + '.pdf' : '#', '_blank')}>
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleProcessPaper(paper.id)}
                                                    >
                                                        <Sparkles className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRemovePaper(paper.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{paper.abstract}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="bg-secondary px-2 py-0.5 rounded text-foreground font-medium">{paper.source}</span>
                                                <span>{paper.date}</span>
                                                <span>•</span>
                                                <span>{paper.authors ? paper.authors.slice(0, 2).join(', ') : 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search Dialog */}
                <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                    <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0 gap-0">
                        <div className="p-6 border-b border-border/50">
                            <DialogTitle className="text-xl font-semibold mb-1">Search Academic Papers</DialogTitle>
                            <div className="text-sm text-muted-foreground">Search across arXiv and Semantic Scholar</div>
                            <div className="flex gap-2 mt-4">
                                <Input
                                    placeholder="transformer architecture, quantum computing..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="flex-1"
                                    autoFocus
                                />
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                >
                                    {isSearching ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Search className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 content-center">
                            {!hasSearched && !isSearching ? (
                                <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground">
                                    <Search className="h-16 w-16 mb-4 opacity-20" />
                                    <p>Enter a search query to find papers</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {searchResults.length === 0 && !isSearching ? (
                                        <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground pt-12">
                                            <p>No papers found for "{searchQuery}"</p>
                                        </div>
                                    ) : (
                                        searchResults.map(paper => (
                                            <div key={paper.id} className="border border-border/50 rounded-xl p-4 hover:bg-secondary/5 transition-colors">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <h4 className="font-semibold text-lg mb-1">{paper.title}</h4>
                                                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{paper.abstract}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>{paper.date}</span>
                                                            <span>•</span>
                                                            <span>{paper.authors.slice(0, 2).join(', ')}</span>
                                                            <a
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    window.open(paper.link.replace('/abs/', '/pdf/') + '.pdf', '_blank');
                                                                }}
                                                                className="hover:text-blue-600 flex items-center gap-1 ml-2"
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                                View
                                                            </a>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant={workspacePapers.some(p => p.id === paper.id) ? "secondary" : "default"}
                                                        onClick={() => handleAddPaper(paper)}
                                                        disabled={workspacePapers.some(p => p.id === paper.id)}
                                                    >
                                                        {workspacePapers.some(p => p.id === paper.id) ? 'Added' : 'Add'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                            {isSearching && (
                                <div className="flex flex-col items-center justify-center h-full absolute inset-0 bg-background/50 backdrop-blur-sm z-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                                    <p className="text-muted-foreground">Searching papers...</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Right Column: AI Chat */}
                <div className="flex-1 min-w-[500px] max-w-[50%] flex flex-col border-l border-border/50 pl-8" style={{ height: 'calc(100vh - 180px)' }}>
                    <ChatInterface workspaceId={id!} />
                </div>

            </main>
        </div>
    );
};

export default WorkspaceDetail;
