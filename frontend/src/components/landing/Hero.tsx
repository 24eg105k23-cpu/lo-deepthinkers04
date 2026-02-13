import { ArrowRight, Brain, Sparkles, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(222_47%_12%)_0%,hsl(222_47%_4%)_100%)]" />
      <div className="hero-glow top-0 left-1/4 -translate-x-1/2" />
      <div className="hero-glow bottom-0 right-1/4 translate-x-1/2" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.12) 0%, transparent 70%)' }} />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Powered by Advanced AI Agents</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="text-foreground">Your Autonomous</span>
            <br />
            <span className="gradient-text">Research Intelligence</span>
            <br />
            <span className="text-foreground">Hub</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Discover, organize, and interact with academic papers through AI-powered 
            contextual summaries, intelligent search, and conversational Q&A.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button variant="hero" asChild>
              <Link to="/dashboard">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/search">
                <Search className="mr-2 h-5 w-5" />
                Explore Papers
              </Link>
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <FeatureCard
              icon={Search}
              title="Smart Discovery"
              description="AI-powered search across academic databases with semantic understanding"
            />
            <FeatureCard
              icon={Brain}
              title="Contextual Q&A"
              description="Ask questions about your papers and get intelligent, cited answers"
            />
            <FeatureCard
              icon={FileText}
              title="Auto Summaries"
              description="Generate comprehensive summaries and key insights automatically"
            />
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 rounded-2xl glass-card float-animation opacity-40" style={{ animationDelay: '0s' }}>
        <div className="flex items-center justify-center h-full">
          <FileText className="h-8 w-8 text-primary" />
        </div>
      </div>
      <div className="absolute bottom-1/4 right-10 w-16 h-16 rounded-2xl glass-card float-animation opacity-40" style={{ animationDelay: '2s' }}>
        <div className="flex items-center justify-center h-full">
          <Sparkles className="h-6 w-6 text-accent" />
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <div className="glass-card rounded-2xl p-6 text-left paper-card-hover">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default Hero;
