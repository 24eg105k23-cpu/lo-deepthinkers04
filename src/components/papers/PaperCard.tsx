import { FileText, Users, Calendar, ExternalLink, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  date: string;
  source: string;
  citations?: number;
  tags?: string[];
  imported?: boolean;
}

interface PaperCardProps {
  paper: Paper;
  onImport?: (paper: Paper) => void;
  showImportButton?: boolean;
}

const PaperCard = ({ paper, onImport, showImportButton = true }: PaperCardProps) => {
  return (
    <div className="glass-card rounded-2xl p-6 paper-card-hover group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {paper.source}
          </Badge>
        </div>
        
        {showImportButton && (
          <Button
            variant={paper.imported ? "secondary" : "gradient"}
            size="sm"
            onClick={() => onImport?.(paper)}
            disabled={paper.imported}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {paper.imported ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Imported
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Import
              </>
            )}
          </Button>
        )}
      </div>

      <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {paper.title}
      </h3>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span className="truncate max-w-[150px]">
            {paper.authors.slice(0, 2).join(', ')}
            {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{paper.date}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
        {paper.abstract}
      </p>

      {paper.tags && paper.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {paper.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        {paper.citations !== undefined && (
          <span className="text-xs text-muted-foreground">
            {paper.citations} citations
          </span>
        )}
        <Button variant="ghost" size="sm" className="ml-auto">
          <ExternalLink className="h-4 w-4 mr-1" />
          View Paper
        </Button>
      </div>
    </div>
  );
};

export default PaperCard;
