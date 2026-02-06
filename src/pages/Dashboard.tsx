import { 
  FileText, 
  FolderOpen, 
  MessageSquare, 
  TrendingUp, 
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import PaperCard, { Paper } from '@/components/papers/PaperCard';

const stats = [
  { label: 'Papers Imported', value: '24', icon: FileText, trend: '+3 this week' },
  { label: 'Workspaces', value: '5', icon: FolderOpen, trend: 'Active' },
  { label: 'AI Conversations', value: '48', icon: MessageSquare, trend: '+12 today' },
  { label: 'Insights Generated', value: '156', icon: TrendingUp, trend: 'Growing' },
];

const recentPapers: Paper[] = [
  {
    id: '1',
    title: 'Attention Is All You Need: Transformer Architecture for Neural Machine Translation',
    authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.'],
    abstract: 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
    date: '2024',
    source: 'arXiv',
    citations: 89420,
    tags: ['Deep Learning', 'NLP', 'Transformers'],
    imported: true,
  },
  {
    id: '2',
    title: 'Large Language Models are Few-Shot Learners',
    authors: ['Brown, T.', 'Mann, B.', 'Ryder, N.'],
    abstract: 'We demonstrate that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art.',
    date: '2023',
    source: 'NeurIPS',
    citations: 34521,
    tags: ['LLM', 'Few-shot Learning'],
    imported: true,
  },
];

const workspaces = [
  { name: 'Deep Learning Research', papers: 12, lastActive: '2 hours ago' },
  { name: 'Medical Imaging Analysis', papers: 8, lastActive: '1 day ago' },
  { name: 'NLP Survey', papers: 4, lastActive: '3 days ago' },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Welcome back, Researcher
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your research today.
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link to="/search">
            <Plus className="h-4 w-4 mr-2" />
            Add Papers
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="glass-card rounded-2xl p-6 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                {stat.trend}
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Papers */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-foreground">Recent Papers</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/search">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {recentPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} showImportButton={false} />
            ))}
          </div>
        </div>

        {/* Workspaces */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg text-foreground">Workspaces</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/workspaces">
                Manage
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {workspaces.map((workspace, index) => (
              <Link
                key={workspace.name}
                to="/workspaces"
                className="block glass-card rounded-xl p-4 paper-card-hover animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <FolderOpen className="h-4 w-4 text-accent" />
                  </div>
                  <h3 className="font-medium text-foreground">{workspace.name}</h3>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{workspace.papers} papers</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {workspace.lastActive}
                  </span>
                </div>
              </Link>
            ))}
            <Button variant="outline" className="w-full" asChild>
              <Link to="/workspaces">
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
