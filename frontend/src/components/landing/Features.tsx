import { 
  Search, 
  FolderOpen, 
  MessageSquare, 
  FileText, 
  Sparkles, 
  Upload,
  Zap,
  Shield
} from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Paper Discovery',
    description: 'Query multiple academic databases with intelligent search that understands research context and returns curated results with full metadata.',
  },
  {
    icon: FolderOpen,
    title: 'Workspace Management',
    description: 'Create project-specific workspaces to organize papers, maintain separate AI conversations, and track your research progress.',
  },
  {
    icon: MessageSquare,
    title: 'Contextual Q&A',
    description: 'Chat with an AI that has read all your papers. Ask complex questions and get synthesized answers with citations.',
  },
  {
    icon: FileText,
    title: 'AI Summarization',
    description: 'Generate comprehensive summaries, extract key findings, and create literature reviews automatically from your paper collection.',
  },
  {
    icon: Sparkles,
    title: 'Research Insights',
    description: 'Discover connections between papers, identify research gaps, and get AI-powered recommendations for related work.',
  },
  {
    icon: Upload,
    title: 'PDF Upload',
    description: 'Import your own papers via PDF upload. The AI processes and indexes them for instant searchability and analysis.',
  },
  {
    icon: Zap,
    title: 'Real-time Analysis',
    description: 'Powered by advanced LLMs for ultra-fast inference, delivering instant responses to your research queries.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your research data is protected with enterprise-grade security. Your papers and conversations remain confidential.',
  },
];

const Features = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Everything You Need for</span>
            <br />
            <span className="gradient-text">Intelligent Research</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A complete platform that transforms how you discover, organize, and understand academic literature.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card rounded-2xl p-6 paper-card-hover animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 glow-primary">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
