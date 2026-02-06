import { useState } from 'react';
import { 
  FileText, 
  Search, 
  FolderOpen, 
  Clock, 
  Download, 
  Trash2,
  Grid3X3,
  List,
  Filter
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'summary' | 'notes' | 'review';
  workspace: string;
  size: string;
  lastModified: string;
}

const documents: Document[] = [
  {
    id: '1',
    name: 'Attention Is All You Need.pdf',
    type: 'pdf',
    workspace: 'Deep Learning Research',
    size: '2.4 MB',
    lastModified: '2 hours ago',
  },
  {
    id: '2',
    name: 'BERT Paper Summary.md',
    type: 'summary',
    workspace: 'NLP Survey',
    size: '45 KB',
    lastModified: '1 day ago',
  },
  {
    id: '3',
    name: 'GPT-4 Technical Report.pdf',
    type: 'pdf',
    workspace: 'Deep Learning Research',
    size: '5.1 MB',
    lastModified: '3 days ago',
  },
  {
    id: '4',
    name: 'Literature Review - Transformers.md',
    type: 'review',
    workspace: 'Deep Learning Research',
    size: '128 KB',
    lastModified: '5 days ago',
  },
  {
    id: '5',
    name: 'Research Notes - ViT.md',
    type: 'notes',
    workspace: 'Medical Imaging Analysis',
    size: '23 KB',
    lastModified: '1 week ago',
  },
  {
    id: '6',
    name: 'ResNet Paper.pdf',
    type: 'pdf',
    workspace: 'Medical Imaging Analysis',
    size: '3.2 MB',
    lastModified: '1 week ago',
  },
];

const typeColors = {
  pdf: 'bg-red-500/10 text-red-400',
  summary: 'bg-blue-500/10 text-blue-400',
  notes: 'bg-green-500/10 text-green-400',
  review: 'bg-purple-500/10 text-purple-400',
};

const Documents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filteredDocs, setFilteredDocs] = useState(documents);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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

  const handleDelete = (doc: Document) => {
    setFilteredDocs((prev) => prev.filter((d) => d.id !== doc.id));
    toast.success(`"${doc.name}" deleted`);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Doc Space
          </h1>
          <p className="text-muted-foreground">
            All your research documents in one place
          </p>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search documents..."
              className="pl-10 bg-secondary/50 border-border/50"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
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

      {/* Document Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{documents.filter(d => d.type === 'pdf').length}</p>
          <p className="text-sm text-muted-foreground">PDFs</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{documents.filter(d => d.type === 'summary').length}</p>
          <p className="text-sm text-muted-foreground">Summaries</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{documents.filter(d => d.type === 'notes').length}</p>
          <p className="text-sm text-muted-foreground">Notes</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{documents.filter(d => d.type === 'review').length}</p>
          <p className="text-sm text-muted-foreground">Reviews</p>
        </div>
      </div>

      {/* Documents List */}
      {viewMode === 'list' ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Name</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Type</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Workspace</th>
                  <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">Size</th>
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
                      <Badge className={typeColors[doc.type]}>{doc.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FolderOpen className="h-4 w-4" />
                        <span className="text-sm">{doc.workspace}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{doc.size}</td>
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
                          onClick={() => handleDelete(doc)}
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
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-medium text-foreground mb-2 line-clamp-2">{doc.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={typeColors[doc.type]}>{doc.type}</Badge>
              </div>
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
          <p className="text-muted-foreground">Try adjusting your search query</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Documents;
