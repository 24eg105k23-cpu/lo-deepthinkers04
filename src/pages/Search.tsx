import { useState } from 'react';
import { Search as SearchIcon, Filter, SlidersHorizontal, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PaperCard, { Paper } from '@/components/papers/PaperCard';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const mockPapers: Paper[] = [
  {
    id: '1',
    title: 'Attention Is All You Need: Transformer Architecture for Neural Machine Translation',
    authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.', 'Uszkoreit, J.'],
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism.',
    date: '2017',
    source: 'arXiv',
    citations: 89420,
    tags: ['Deep Learning', 'NLP', 'Transformers'],
    imported: false,
  },
  {
    id: '2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
    authors: ['Devlin, J.', 'Chang, M.', 'Lee, K.', 'Toutanova, K.'],
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. BERT is designed to pre-train deep bidirectional representations from unlabeled text.',
    date: '2019',
    source: 'ACL',
    citations: 67891,
    tags: ['NLP', 'Language Models', 'Pre-training'],
    imported: false,
  },
  {
    id: '3',
    title: 'GPT-4 Technical Report',
    authors: ['OpenAI'],
    abstract: 'We report the development of GPT-4, a large-scale, multimodal model which can accept image and text inputs and produce text outputs. While less capable than humans in many real-world scenarios, GPT-4 exhibits human-level performance on various benchmarks.',
    date: '2024',
    source: 'arXiv',
    citations: 12453,
    tags: ['LLM', 'Multimodal', 'AI Safety'],
    imported: false,
  },
  {
    id: '4',
    title: 'Deep Residual Learning for Image Recognition',
    authors: ['He, K.', 'Zhang, X.', 'Ren, S.', 'Sun, J.'],
    abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.',
    date: '2016',
    source: 'CVPR',
    citations: 143567,
    tags: ['Computer Vision', 'Deep Learning', 'ResNet'],
    imported: false,
  },
  {
    id: '5',
    title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
    authors: ['Lewis, P.', 'Perez, E.', 'Piktus, A.'],
    abstract: 'Large pre-trained language models have been shown to store factual knowledge in their parameters. However, their ability to access and manipulate knowledge is limited. RAG combines the benefits of retrieval and generation.',
    date: '2023',
    source: 'NeurIPS',
    citations: 4521,
    tags: ['RAG', 'Information Retrieval', 'NLP'],
    imported: false,
  },
  {
    id: '6',
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale',
    authors: ['Dosovitskiy, A.', 'Beyer, L.', 'Kolesnikov, A.'],
    abstract: 'While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited. We show that a pure transformer applied directly to sequences of image patches can perform very well.',
    date: '2021',
    source: 'ICLR',
    citations: 28934,
    tags: ['Vision Transformers', 'Computer Vision', 'ViT'],
    imported: false,
  },
];

const filters = ['All', 'Deep Learning', 'NLP', 'Computer Vision', 'LLM', 'RAG'];

const Search = () => {
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>(mockPapers);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => {
      const filtered = mockPapers.filter(
        (paper) =>
          paper.title.toLowerCase().includes(query.toLowerCase()) ||
          paper.abstract.toLowerCase().includes(query.toLowerCase()) ||
          paper.tags?.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      );
      setPapers(filtered);
      setIsSearching(false);
    }, 800);
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'All') {
      setPapers(mockPapers);
    } else {
      setPapers(mockPapers.filter((paper) => paper.tags?.includes(filter)));
    }
  };

  const handleImport = (paper: Paper) => {
    setPapers((prev) =>
      prev.map((p) => (p.id === paper.id ? { ...p, imported: true } : p))
    );
    toast.success(`"${paper.title.slice(0, 40)}..." imported to workspace`);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
          Search Papers
        </h1>
        <p className="text-muted-foreground">
          Discover academic papers across multiple databases
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for papers, topics, or authors..."
              className="pl-12 h-12 bg-secondary/50 border-border/50 focus:border-primary text-base"
            />
          </div>
          <Button variant="gradient" size="lg" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <SearchIcon className="h-5 w-5 mr-2" />
                Search
              </>
            )}
          </Button>
          <Button variant="outline" size="lg">
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Badge
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => handleFilterClick(filter)}
              >
                {filter}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {papers.length} results
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {papers.map((paper, index) => (
          <div
            key={paper.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <PaperCard paper={paper} onImport={handleImport} />
          </div>
        ))}
      </div>

      {papers.length === 0 && (
        <div className="text-center py-16">
          <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No papers found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Search;
