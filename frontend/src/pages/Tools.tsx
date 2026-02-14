import { useState } from 'react';
import { API_URL } from '@/lib/utils';
import {
  FileText,
  Lightbulb,
  BookOpen,
  Download,
  Loader2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const papers = [
  {
    id: '1',
    title: 'Attention Is All You Need',
    authors: 'Vaswani et al.',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism.'
  },
  {
    id: '2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: 'Devlin et al.',
    abstract: 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. BERT is designed to pre-train deep bidirectional representations from unlabeled text.'
  },
  {
    id: '3',
    title: 'GPT-4 Technical Report',
    authors: 'OpenAI',
    abstract: 'We report the development of GPT-4, a large-scale, multimodal model which can accept image and text inputs and produce text outputs. While less capable than humans in many real-world scenarios, GPT-4 exhibits human-level performance on various benchmarks.'
  },
  {
    id: '4',
    title: 'Deep Residual Learning',
    authors: 'He et al.',
    abstract: 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.'
  },
];

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
}

const tools: Tool[] = [
  {
    id: 'summary',
    title: 'AI Summaries',
    description: 'Generate comprehensive summaries of selected papers',
    icon: FileText,
    action: 'Generate Summaries',
  },
  {
    id: 'insights',
    title: 'Key Insights',
    description: 'Extract key findings and contributions from papers',
    icon: Lightbulb,
    action: 'Extract Insights',
  },
  {
    id: 'review',
    title: 'Literature Review',
    description: 'Create a structured literature review section',
    icon: BookOpen,
    action: 'Generate Review',
  },
];

const Tools = () => {
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handlePaperToggle = (paperId: string) => {
    setSelectedPapers((prev) =>
      prev.includes(paperId)
        ? prev.filter((id) => id !== paperId)
        : [...prev, paperId]
    );
  };

  const generateSummary = async (paperId: string): Promise<string> => {
    const paper = papers.find(p => p.id === paperId);
    if (!paper) return '';

    try {
      const res = await fetch(`${API_URL}/papers/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          abstract: paper.abstract,
        }),
      });

      const data = await res.json();
      return `### ${paper.title}\n${data.summary}\n\n`;
    } catch {
      toast.error(`Failed to generate summary for ${paper.title}`);
      return '';
    }
  };

  const handleToolClick = async (toolId: string) => {
    if (selectedPapers.length === 0) {
      toast.error('Please select at least one paper');
      return;
    }

    setActiveTool(toolId);
    setIsProcessing(true);
    setResult(null);

    if (toolId === 'summary') {
      try {
        const summaries = await Promise.all(selectedPapers.map(id => generateSummary(id)));
        setResult(summaries.join('\n'));
        toast.success('Summaries generated successfully!');
      } catch (error) {
        console.error(error);
        toast.error('Error generating summaries');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Simulate other tools for now
      setTimeout(() => {
        setIsProcessing(false);
        setResult(generateMockResult(toolId, selectedPapers));
        toast.success('Analysis complete!');
      }, 2000);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
          AI Tools
        </h1>
        <p className="text-muted-foreground">
          Powerful AI-powered tools for research analysis
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Paper Selection */}
        <div className="lg:col-span-1">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Select Papers for Analysis</CardTitle>
              <CardDescription>Choose papers to analyze with AI tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <Checkbox
                    id={paper.id}
                    checked={selectedPapers.includes(paper.id)}
                    onCheckedChange={() => handlePaperToggle(paper.id)}
                  />
                  <Label htmlFor={paper.id} className="cursor-pointer flex-1">
                    <p className="font-medium text-sm text-foreground">{paper.title}</p>
                    <p className="text-xs text-muted-foreground">{paper.authors}</p>
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Tools & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tool Buttons */}
          <div className="grid sm:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Card
                key={tool.id}
                className={`glass-card border-border/50 paper-card-hover cursor-pointer ${activeTool === tool.id ? 'ring-2 ring-primary' : ''
                  }`}
                onClick={() => handleToolClick(tool.id)}
              >
                <CardContent className="p-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center mb-3 glow-primary">
                    <tool.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{tool.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{tool.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={isProcessing && activeTool === tool.id}
                  >
                    {isProcessing && activeTool === tool.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {tool.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Results */}
          {(isProcessing || result) && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {tools.find((t) => t.id === activeTool)?.title} Results
                    </CardTitle>
                    {!isProcessing && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  {!isProcessing && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Analyzing papers with AI...</p>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <div className="bg-secondary/30 rounded-lg p-4 whitespace-pre-wrap text-sm text-foreground">
                      {result}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

function generateMockResult(toolId: string, paperIds: string[]): string {
  const results: Record<string, string> = {
    summary: `## AI-Generated Summary

Based on analysis of ${paperIds.length} selected papers:

### Key Themes
1. **Transformer Architecture Dominance**: The papers collectively demonstrate the shift from recurrent and convolutional architectures to transformer-based models across NLP and computer vision.

2. **Self-Attention Mechanisms**: Central to all discussed works is the self-attention mechanism, which enables modeling of long-range dependencies without sequential processing.

3. **Pre-training Paradigm**: Multiple papers emphasize the importance of large-scale pre-training on unlabeled data, followed by task-specific fine-tuning.

### Synthesis
The evolution from attention mechanisms (Vaswani et al.) to modern LLMs represents a paradigm shift in how we approach sequence modeling tasks. BERT's bidirectional approach and GPT's autoregressive methodology represent two complementary strategies for leveraging transformer architectures.`,

    insights: `## Key Insights Extracted

### Finding 1: Attention Scalability
The self-attention mechanism scales quadratically with sequence length, leading to various optimization strategies including sparse attention and linear attention variants.

### Finding 2: Transfer Learning Efficiency
Pre-trained models significantly reduce the data requirements for downstream tasks, with BERT showing strong few-shot capabilities.

### Finding 3: Multimodal Potential
Recent work demonstrates that transformer architectures can be effectively applied to images (ViT), audio, and multimodal data, suggesting a universal architecture paradigm.

### Research Gap
Limited work exists on efficient fine-tuning strategies for resource-constrained environments.`,

    review: `## Literature Review Section

### 2.1 Transformer Architectures in Deep Learning

The introduction of the Transformer architecture (Vaswani et al., 2017) marked a significant departure from previous sequence-to-sequence models. By replacing recurrence with self-attention mechanisms, the Transformer enables parallel processing of sequences while maintaining the ability to model long-range dependencies.

Subsequent work extended this foundation in two primary directions. First, BERT (Devlin et al., 2019) demonstrated the effectiveness of bidirectional pre-training for natural language understanding tasks. Second, the GPT series progressively scaled autoregressive language models, culminating in GPT-4's multimodal capabilities.

### 2.2 Implications for Research

This architectural convergence has significant implications for research methodology, suggesting that insights from one domain may transfer effectively to others.`,
  };

  return results[toolId] || 'Analysis complete.';
}

export default Tools;
